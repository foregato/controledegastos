/**
 * Copyright (c) 2026 Arthur Araujo and contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  FileCode2,
  Plus,
  Receipt,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import {
  BenefitWallet,
  DailyExpense,
  DailyExpenseCategory,
  FixedExpense,
  IncomeEntry,
  IncomeOrigin,
  MonthlyPeriod,
  PaymentMethod,
  PaymentStatus,
} from './types/finance';
import {
  calculateMonthlySummary,
  computeMonthRolloverPreview,
  formatCurrencyBRL,
  formatPeriodLabel,
  shiftDateToPeriod,
} from './lib/financialEngine';
import {
  DEMO_USER_ID,
  INITIAL_BENEFIT_WALLETS,
  INITIAL_DAILY_EXPENSES,
  INITIAL_FIXED_EXPENSES,
  INITIAL_INCOMES,
  INITIAL_PERIODS,
} from './data/seedData';
import { ActiveNavSection, TopBar } from './components/TopBar';
import { TemporalHeader } from './components/TemporalHeader';
import { SummaryCards } from './components/SummaryCards';
import { FixedExpensesColumn } from './components/FixedExpensesColumn';
import { IncomesColumn } from './components/IncomesColumn';
import { DailyExpensesColumn } from './components/DailyExpensesColumn';
import { BenefitWalletsColumn } from './components/BenefitWalletsColumn';
import {
  QuickActionModal,
  QuickActionMode,
} from './components/QuickActionModal';
import { CloseMonthModal } from './components/CloseMonthModal';
import { ArchitectureDeliverablesView } from './components/ArchitectureDeliverablesView';

const STORAGE_KEYS = {
  PERIODS: 'fluxocaixa_pro_v1_periods',
  INCOMES: 'fluxocaixa_pro_v1_incomes',
  FIXED: 'fluxocaixa_pro_v1_fixed',
  DAILY: 'fluxocaixa_pro_v1_daily',
  WALLETS: 'fluxocaixa_pro_v1_wallets',
  THEME: 'fluxocaixa_pro_v1_theme',
};

type MobilePillarTab = 'fixed' | 'incomes' | 'daily' | 'benefits';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  // Theme state (Dark by default, user can toggle Light/Dark)
  const [isDark, setIsDark] = useState<boolean>(() =>
    loadFromStorage(STORAGE_KEYS.THEME, true)
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify(isDark));
  }, [isDark]);

  // Core persisted state
  const [periods, setPeriods] = useState<MonthlyPeriod[]>(() =>
    loadFromStorage(STORAGE_KEYS.PERIODS, INITIAL_PERIODS)
  );
  const [incomes, setIncomes] = useState<IncomeEntry[]>(() =>
    loadFromStorage(STORAGE_KEYS.INCOMES, INITIAL_INCOMES)
  );
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>(() =>
    loadFromStorage(STORAGE_KEYS.FIXED, INITIAL_FIXED_EXPENSES)
  );
  const [dailyExpenses, setDailyExpenses] = useState<DailyExpense[]>(() =>
    loadFromStorage(STORAGE_KEYS.DAILY, INITIAL_DAILY_EXPENSES)
  );
  const [benefitWallets, setBenefitWallets] = useState<BenefitWallet[]>(() =>
    loadFromStorage(STORAGE_KEYS.WALLETS, INITIAL_BENEFIT_WALLETS)
  );

  // Sync changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PERIODS, JSON.stringify(periods));
  }, [periods]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(incomes));
  }, [incomes]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FIXED, JSON.stringify(fixedExpenses));
  }, [fixedExpenses]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DAILY, JSON.stringify(dailyExpenses));
  }, [dailyExpenses]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(benefitWallets));
  }, [benefitWallets]);

  // Active Period (default to Nov 2026)
  const [selectedPeriodId, setSelectedPeriodId] =
    useState<string>('period_2026_11');

  const currentPeriod = useMemo(
    () =>
      periods.find((p) => p.id === selectedPeriodId) ||
      periods[periods.length - 1],
    [periods, selectedPeriodId]
  );

  // Navigation & Mobile Tabs
  const [activeNavSection, setActiveNavSection] =
    useState<ActiveNavSection>('overview');
  const [mobilePillarTab, setMobilePillarTab] =
    useState<MobilePillarTab>('fixed');

  // Modals & Toast
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [quickActionMode, setQuickActionMode] =
    useState<QuickActionMode>('daily');
  const [closeMonthModalOpen, setCloseMonthModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Filtered collections for the current monthly period
  const periodIncomes = useMemo(
    () => incomes.filter((i) => i.periodId === currentPeriod.id),
    [incomes, currentPeriod.id]
  );
  const periodFixedExpenses = useMemo(
    () => fixedExpenses.filter((f) => f.periodId === currentPeriod.id),
    [fixedExpenses, currentPeriod.id]
  );
  const periodDailyExpenses = useMemo(
    () => dailyExpenses.filter((d) => d.periodId === currentPeriod.id),
    [dailyExpenses, currentPeriod.id]
  );
  const periodBenefitWallets = useMemo(
    () => benefitWallets.filter((w) => w.periodId === currentPeriod.id),
    [benefitWallets, currentPeriod.id]
  );

  // Pure Financial Calculation Engine Summary
  const summary = useMemo(
    () =>
      calculateMonthlySummary({
        period: currentPeriod,
        incomes: periodIncomes,
        fixedExpenses: periodFixedExpenses,
        dailyExpenses: periodDailyExpenses,
        benefitWallets: periodBenefitWallets,
      }),
    [
      currentPeriod,
      periodIncomes,
      periodFixedExpenses,
      periodDailyExpenses,
      periodBenefitWallets,
    ]
  );

  // Pure Rollover Preview for Month Closing
  const rolloverPreview = useMemo(
    () =>
      computeMonthRolloverPreview({
        sourcePeriod: currentPeriod,
        incomes: periodIncomes,
        fixedExpenses: periodFixedExpenses,
        dailyExpenses: periodDailyExpenses,
        benefitWallets: periodBenefitWallets,
      }),
    [
      currentPeriod,
      periodIncomes,
      periodFixedExpenses,
      periodDailyExpenses,
      periodBenefitWallets,
    ]
  );

  const defaultDateForPeriod = useMemo(() => {
    const mm = String(currentPeriod.month).padStart(2, '0');
    return `${currentPeriod.year}-${mm}-10`;
  }, [currentPeriod]);

  // Handlers — Fixed Expenses
  const handleCycleFixedStatus = (expenseId: string) => {
    setFixedExpenses((prev) =>
      prev.map((item) => {
        if (item.id !== expenseId) return item;
        const nextStatus: PaymentStatus =
          item.paymentStatus === 'pending'
            ? 'paid'
            : item.paymentStatus === 'paid'
            ? 'exempt'
            : 'pending';
        return {
          ...item,
          paymentStatus: nextStatus,
          contextualNote:
            nextStatus === 'exempt'
              ? item.contextualNote || 'Mãe Pagou'
              : item.contextualNote === 'Mãe Pagou'
              ? undefined
              : item.contextualNote,
          paidAt:
            nextStatus === 'paid' ? new Date().toISOString().slice(0, 10) : null,
        };
      })
    );
  };

  const handleSetFixedStatus = (
    expenseId: string,
    status: PaymentStatus,
    note?: string
  ) => {
    setFixedExpenses((prev) =>
      prev.map((item) =>
        item.id === expenseId
          ? {
              ...item,
              paymentStatus: status,
              contextualNote: note ?? item.contextualNote,
              paidAt:
                status === 'paid' ? new Date().toISOString().slice(0, 10) : null,
            }
          : item
      )
    );
    triggerToast(
      status === 'paid'
        ? 'Conta marcada como paga!'
        : status === 'exempt'
        ? `Conta marcada como isenta (${note || 'Terceiros'})`
        : 'Status atualizado para pendente'
    );
  };

  const handleDeleteFixedExpense = (expenseId: string) => {
    setFixedExpenses((prev) => prev.filter((f) => f.id !== expenseId));
    triggerToast('Conta removida do mês.');
  };

  const handleAddFixedExpense = (data: {
    title: string;
    amount: number;
    paymentMethod: PaymentMethod;
    dueDate: string;
    paymentStatus: PaymentStatus;
    contextualNote?: string;
    currentInstallment?: number | null;
    totalInstallments?: number | null;
    isRecurring: boolean;
  }) => {
    const newItem: FixedExpense = {
      id: `fix_${Date.now()}`,
      userId: DEMO_USER_ID,
      periodId: currentPeriod.id,
      ...data,
    };
    setFixedExpenses((prev) => [...prev, newItem]);
    triggerToast(`Conta "${data.title}" adicionada com sucesso.`);
  };

  // Handlers — Incomes & Starting Balance Rollover
  const handleUpdateStartingBalance = (newBalance: number) => {
    setPeriods((prev) =>
      prev.map((p) =>
        p.id === currentPeriod.id ? { ...p, startingBalance: newBalance } : p
      )
    );
    triggerToast(
      `Rollover inicial ajustado para ${formatCurrencyBRL(newBalance)}.`
    );
  };

  const handleToggleConfirmIncome = (incomeId: string) => {
    setIncomes((prev) =>
      prev.map((inc) =>
        inc.id === incomeId ? { ...inc, isConfirmed: !inc.isConfirmed } : inc
      )
    );
  };

  const handleDeleteIncome = (incomeId: string) => {
    setIncomes((prev) => prev.filter((inc) => inc.id !== incomeId));
    triggerToast('Entrada removida.');
  };

  const handleAddIncome = (data: {
    amount: number;
    description: string;
    receivedDate: string;
    origin: IncomeOrigin;
    isConfirmed: boolean;
    isRecurring: boolean;
  }) => {
    const newInc: IncomeEntry = {
      id: `inc_${Date.now()}`,
      userId: DEMO_USER_ID,
      periodId: currentPeriod.id,
      ...data,
    };
    setIncomes((prev) => [...prev, newInc]);
    triggerToast(`Entrada "${data.description}" registrada.`);
  };

  // Handlers — Daily Expenses
  const handleAddDailyExpense = (data: {
    amount: number;
    description: string;
    date: string;
    category: DailyExpenseCategory;
    paymentMethod: PaymentMethod;
  }) => {
    const newDaily: DailyExpense = {
      id: `day_${Date.now()}`,
      userId: DEMO_USER_ID,
      periodId: currentPeriod.id,
      ...data,
    };
    setDailyExpenses((prev) => [newDaily, ...prev]);
    triggerToast(
      `Microgasto de ${formatCurrencyBRL(data.amount)} lançado no diário.`
    );
  };

  const handleDeleteDailyExpense = (id: string) => {
    setDailyExpenses((prev) => prev.filter((d) => d.id !== id));
    triggerToast('Microgasto removido.');
  };

  // Handlers — Benefit Wallets
  const handleAddBenefitTransaction = (
    walletId: string,
    description: string,
    amount: number,
    date: string
  ) => {
    setBenefitWallets((prev) =>
      prev.map((w) =>
        w.id === walletId
          ? {
              ...w,
              transactions: [
                {
                  id: `btx_${Date.now()}`,
                  walletId,
                  description,
                  amount,
                  date,
                },
                ...w.transactions,
              ],
            }
          : w
      )
    );
    triggerToast(
      `Débito de ${formatCurrencyBRL(amount)} registrado no benefício.`
    );
  };

  const handleDeleteBenefitTransaction = (walletId: string, txId: string) => {
    setBenefitWallets((prev) =>
      prev.map((w) =>
        w.id === walletId
          ? {
              ...w,
              transactions: w.transactions.filter((tx) => tx.id !== txId),
            }
          : w
      )
    );
  };

  const handleUpdateWalletCredits = (
    walletId: string,
    previousBalance: number,
    monthlyCredit: number
  ) => {
    setBenefitWallets((prev) =>
      prev.map((w) =>
        w.id === walletId ? { ...w, previousBalance, monthlyCredit } : w
      )
    );
    triggerToast('Saldos do cartão de benefício atualizados.');
  };

  const handleAddNewWallet = (
    providerName: string,
    cardType: 'VR' | 'VA' | 'Flex',
    previousBalance: number,
    monthlyCredit: number
  ) => {
    const newWal: BenefitWallet = {
      id: `wal_${Date.now()}`,
      userId: DEMO_USER_ID,
      periodId: currentPeriod.id,
      providerName,
      cardType,
      previousBalance,
      monthlyCredit,
      colorAccent: 'indigo',
      transactions: [],
    };
    setBenefitWallets((prev) => [...prev, newWal]);
    triggerToast(`Cartão ${providerName} criado.`);
  };

  // Automation: Close Month & Rollover to Next Period
  const handleConfirmCloseAndRollover = () => {
    const targetMonth = rolloverPreview.targetMonth;
    const targetYear = rolloverPreview.targetYear;
    const nextPeriodId = `period_${targetYear}_${String(targetMonth).padStart(
      2,
      '0'
    )}`;

    // 1. Mark current period as closed
    const existingNext = periods.find(
      (p) => p.month === targetMonth && p.year === targetYear
    );

    const updatedPeriods = periods.map((p) =>
      p.id === currentPeriod.id
        ? { ...p, status: 'closed' as const, closedAt: new Date().toISOString() }
        : p
    );

    if (existingNext) {
      setPeriods(
        updatedPeriods.map((p) =>
          p.id === existingNext.id
            ? {
                ...p,
                startingBalance: rolloverPreview.transferableOperationalBalance,
              }
            : p
        )
      );
      setSelectedPeriodId(existingNext.id);
    } else {
      // Create new period
      const newPeriod: MonthlyPeriod = {
        id: nextPeriodId,
        userId: DEMO_USER_ID,
        month: targetMonth,
        year: targetYear,
        startingBalance: rolloverPreview.transferableOperationalBalance,
        status: 'open',
        closedAt: null,
        notes: `Gerado via fechamento automático de ${formatPeriodLabel(
          currentPeriod.month,
          currentPeriod.year
        )}.`,
      };

      // Clone recurring incomes
      const clonedIncomes: IncomeEntry[] =
        rolloverPreview.recurringIncomesToClone.map((inc, idx) => ({
          id: `inc_${nextPeriodId}_${idx}_${Date.now()}`,
          userId: DEMO_USER_ID,
          periodId: nextPeriodId,
          description: inc.description,
          amount: inc.amount,
          receivedDate: shiftDateToPeriod(
            inc.receivedDate,
            targetMonth,
            targetYear
          ),
          origin: inc.origin,
          isConfirmed: false,
          isRecurring: true,
        }));

      // Clone recurring fixed expenses & advance installments
      const clonedFixed: FixedExpense[] =
        rolloverPreview.fixedExpensesToClone.map((item, idx) => ({
          id: `fix_${nextPeriodId}_${idx}_${Date.now()}`,
          userId: DEMO_USER_ID,
          periodId: nextPeriodId,
          title: item.original.title,
          amount: item.original.amount,
          paymentMethod: item.original.paymentMethod,
          dueDate: item.nextDueDate,
          paymentStatus: 'pending',
          contextualNote: item.isLastInstallment ? 'Última!' : undefined,
          currentInstallment: item.nextInstallment,
          totalInstallments: item.totalInstallments,
          isRecurring: item.original.isRecurring,
          paidAt: null,
        }));

      // Rollover Benefit Wallets
      const clonedWallets: BenefitWallet[] =
        rolloverPreview.benefitWalletsRollover.map((bw, idx) => ({
          id: `wal_${nextPeriodId}_${idx}_${Date.now()}`,
          userId: DEMO_USER_ID,
          periodId: nextPeriodId,
          providerName: bw.providerName,
          cardType: bw.cardType,
          previousBalance: bw.remainingBalanceToTransfer,
          monthlyCredit: bw.suggestedMonthlyCredit,
          colorAccent: bw.colorAccent,
          transactions: [],
        }));

      setPeriods([...updatedPeriods, newPeriod]);
      setIncomes((prev) => [...prev, ...clonedIncomes]);
      setFixedExpenses((prev) => [...prev, ...clonedFixed]);
      setBenefitWallets((prev) => [...prev, ...clonedWallets]);
      setSelectedPeriodId(nextPeriodId);
    }

    setCloseMonthModalOpen(false);
    triggerToast(
      `Ciclo ${rolloverPreview.targetPeriodLabel} iniciado com rollover de ${formatCurrencyBRL(
        rolloverPreview.transferableOperationalBalance
      )}!`
    );
  };

  const handleReopenMonth = () => {
    setPeriods((prev) =>
      prev.map((p) =>
        p.id === currentPeriod.id
          ? { ...p, status: 'open', closedAt: null }
          : p
      )
    );
    triggerToast('Mês reaberto para edições.');
  };

  const handleResetDemoData = () => {
    setPeriods(INITIAL_PERIODS);
    setIncomes(INITIAL_INCOMES);
    setFixedExpenses(INITIAL_FIXED_EXPENSES);
    setDailyExpenses(INITIAL_DAILY_EXPENSES);
    setBenefitWallets(INITIAL_BENEFIT_WALLETS);
    setSelectedPeriodId('period_2026_11');
    triggerToast('Dados originais de demonstração restaurados.');
  };

  const openQuickModal = (mode: QuickActionMode) => {
    setQuickActionMode(mode);
    setQuickActionOpen(true);
  };

  const isClosed = currentPeriod.status === 'closed';
  const pendingBills = periodFixedExpenses.filter(
    (f) => f.paymentStatus === 'pending'
  );

  return (
    <div id="top" className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 lg:pb-10">
      {/* 1. Strict 3-Zone Top Bar */}
      <TopBar
        activeSection={activeNavSection}
        onSelectSection={setActiveNavSection}
        onOpenQuickAction={() => openQuickModal('daily')}
      />

      {/* 2. Temporal Context & Month Control Bar */}
      <TemporalHeader
        periods={periods}
        currentPeriod={currentPeriod}
        summary={summary}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onSelectPeriodId={setSelectedPeriodId}
        onOpenCloseMonthModal={() => setCloseMonthModalOpen(true)}
        onReopenMonth={handleReopenMonth}
        onResetDemoData={handleResetDemoData}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="mb-4 px-4 py-3 bg-slate-900 dark:bg-emerald-950 text-white dark:text-emerald-200 border border-slate-800 dark:border-emerald-500/40 rounded-xl flex items-center justify-between text-xs font-medium shadow-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white ml-4 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Section Switcher for Mobile & Tablet */}
        <div className="flex md:hidden items-center gap-1 p-1 mb-5 bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
          {(
            [
              { id: 'overview', label: 'Painel Mensal' },
              { id: 'ledger', label: 'Quadro 4 Pilares' },
              { id: 'benefits', label: 'Carteiras VR/VA' },
              { id: 'architecture', label: 'Schema & SQL' },
            ] as Array<{ id: ActiveNavSection; label: string }>
          ).map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveNavSection(sec.id)}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeNavSection === sec.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* Always show Executive Summary Cards on Overview and Ledger */}
        {activeNavSection !== 'architecture' && (
          <SummaryCards
            summary={summary}
            onEditStartingBalance={() => {
              setActiveNavSection('overview');
              setMobilePillarTab('incomes');
            }}
          />
        )}

        {/* View 1 & 2: Full 4-Column Responsive Workspace */}
        {(activeNavSection === 'overview' || activeNavSection === 'ledger') && (
          <>
            {/* Quick Action Shortcut Strip (Desktop & Mobile) */}
            {!isClosed && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  <strong className="text-slate-900 dark:text-slate-100 font-semibold">
                    Atalhos de Operação Rápida:
                  </strong>{' '}
                  Registre movimentações com 1 clique ou dê baixa em contas pendentes.
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openQuickModal('daily')}
                    className="px-3 py-1.5 min-h-[36px] text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    + Adicionar Gasto Diário
                  </button>
                  <button
                    type="button"
                    onClick={() => openQuickModal('income')}
                    className="px-3 py-1.5 min-h-[36px] text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    + Registrar Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => openQuickModal('pay_bill')}
                    className="px-3 py-1.5 min-h-[36px] text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Pagar Conta ({pendingBills.length})
                  </button>
                </div>
              </div>
            )}

            {/* Mobile Pillar Tab Selector (<1280px) */}
            <div className="xl:hidden mb-4">
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMobilePillarTab('fixed')}
                  className={`py-2.5 px-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    mobilePillarTab === 'fixed'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  1. Contas ({periodFixedExpenses.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMobilePillarTab('incomes')}
                  className={`py-2.5 px-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    mobilePillarTab === 'incomes'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  2. Entradas ({periodIncomes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMobilePillarTab('daily')}
                  className={`py-2.5 px-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    mobilePillarTab === 'daily'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  3. Diário ({periodDailyExpenses.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMobilePillarTab('benefits')}
                  className={`py-2.5 px-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    mobilePillarTab === 'benefits'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  4. VR/VA ({periodBenefitWallets.length})
                </button>
              </div>
            </div>

            {/* 4-Column Responsive Grid (1 active tab on mobile, 4 columns on xl desktop) */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-5 items-stretch">
              <div
                className={`${
                  mobilePillarTab === 'fixed' ? 'block' : 'hidden xl:block'
                }`}
              >
                <FixedExpensesColumn
                  expenses={periodFixedExpenses}
                  isPeriodClosed={isClosed}
                  onCycleStatus={handleCycleFixedStatus}
                  onSetStatus={handleSetFixedStatus}
                  onDeleteExpense={handleDeleteFixedExpense}
                  onOpenAddFixed={() => openQuickModal('new_fixed')}
                />
              </div>

              <div
                className={`${
                  mobilePillarTab === 'incomes' ? 'block' : 'hidden xl:block'
                }`}
              >
                <IncomesColumn
                  period={currentPeriod}
                  incomes={periodIncomes}
                  isPeriodClosed={isClosed}
                  onUpdateStartingBalance={handleUpdateStartingBalance}
                  onToggleConfirmIncome={handleToggleConfirmIncome}
                  onDeleteIncome={handleDeleteIncome}
                  onOpenAddIncome={() => openQuickModal('income')}
                />
              </div>

              <div
                className={`${
                  mobilePillarTab === 'daily' ? 'block' : 'hidden xl:block'
                }`}
              >
                <DailyExpensesColumn
                  expenses={periodDailyExpenses}
                  isPeriodClosed={isClosed}
                  onDeleteDailyExpense={handleDeleteDailyExpense}
                  onOpenAddDaily={() => openQuickModal('daily')}
                />
              </div>

              <div
                className={`${
                  mobilePillarTab === 'benefits' ? 'block' : 'hidden xl:block'
                }`}
              >
                <BenefitWalletsColumn
                  wallets={periodBenefitWallets}
                  isPeriodClosed={isClosed}
                  onAddBenefitTransaction={handleAddBenefitTransaction}
                  onDeleteBenefitTransaction={handleDeleteBenefitTransaction}
                  onUpdateWalletCredits={handleUpdateWalletCredits}
                  onAddNewWallet={handleAddNewWallet}
                />
              </div>
            </div>
          </>
        )}

        {/* View 3: Focused Benefit Wallets View */}
        {activeNavSection === 'benefits' && (
          <div className="max-w-3xl mx-auto">
            <BenefitWalletsColumn
              wallets={periodBenefitWallets}
              isPeriodClosed={isClosed}
              onAddBenefitTransaction={handleAddBenefitTransaction}
              onDeleteBenefitTransaction={handleDeleteBenefitTransaction}
              onUpdateWalletCredits={handleUpdateWalletCredits}
              onAddNewWallet={handleAddNewWallet}
            />
          </div>
        )}

        {/* View 4: Deliverable Architecture, Drizzle Schema & SQL RLS Policies */}
        {activeNavSection === 'architecture' && (
          <ArchitectureDeliverablesView />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Respects 15% Sticky Cap & 44px Touch Targets) */}
      <nav
        aria-label="Navegação Mobile"
        className="fixed bottom-0 left-0 right-0 z-30 lg:hidden h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 items-center px-2"
      >
        <button
          type="button"
          onClick={() => {
            setActiveNavSection('overview');
            setMobilePillarTab('fixed');
          }}
          className={`min-h-[44px] flex flex-col items-center justify-center text-[10px] font-medium cursor-pointer ${
            activeNavSection === 'overview' && mobilePillarTab === 'fixed'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Receipt className="w-4 h-4 mb-0.5" />
          <span>Contas</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveNavSection('overview');
            setMobilePillarTab('incomes');
          }}
          className={`min-h-[44px] flex flex-col items-center justify-center text-[10px] font-medium cursor-pointer ${
            activeNavSection === 'overview' && mobilePillarTab === 'incomes'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <TrendingUp className="w-4 h-4 mb-0.5" />
          <span>Entradas</span>
        </button>

        {/* Center Quick Action Button */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => openQuickModal('daily')}
            aria-label="Abrir Lançamento Rápido"
            className="w-11 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-md cursor-pointer"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setActiveNavSection('overview');
            setMobilePillarTab('daily');
          }}
          className={`min-h-[44px] flex flex-col items-center justify-center text-[10px] font-medium cursor-pointer ${
            activeNavSection === 'overview' && mobilePillarTab === 'daily'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <ShoppingBag className="w-4 h-4 mb-0.5" />
          <span>Diário</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveNavSection('architecture')}
          className={`min-h-[44px] flex flex-col items-center justify-center text-[10px] font-medium cursor-pointer ${
            activeNavSection === 'architecture'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <FileCode2 className="w-4 h-4 mb-0.5" />
          <span>SQL/Schema</span>
        </button>
      </nav>

      {/* Modals */}
      <QuickActionModal
        isOpen={quickActionOpen}
        initialMode={quickActionMode}
        defaultDate={defaultDateForPeriod}
        pendingFixedExpenses={pendingBills}
        onClose={() => setQuickActionOpen(false)}
        onAddDailyExpense={handleAddDailyExpense}
        onAddIncome={handleAddIncome}
        onQuickPayFixedExpense={(id, status, note) => {
          handleSetFixedStatus(id, status, note);
        }}
        onAddFixedExpense={handleAddFixedExpense}
      />

      <CloseMonthModal
        isOpen={closeMonthModalOpen}
        preview={rolloverPreview}
        onClose={() => setCloseMonthModalOpen(false)}
        onConfirmCloseAndRollover={handleConfirmCloseAndRollover}
      />
    </div>
  );
}
