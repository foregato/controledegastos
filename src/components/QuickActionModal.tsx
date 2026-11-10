import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  ShoppingBag,
  ArrowUpCircle,
  CheckCircle2,
  CalendarPlus,
} from 'lucide-react';
import {
  DailyExpenseCategory,
  FixedExpense,
  IncomeOrigin,
  PaymentMethod,
  PaymentStatus,
} from '../types/finance';
import { formatCurrencyBRL, formatShortDate } from '../lib/financialEngine';

export type QuickActionMode = 'daily' | 'income' | 'pay_bill' | 'new_fixed';

interface QuickActionModalProps {
  isOpen: boolean;
  initialMode: QuickActionMode;
  defaultDate: string;
  pendingFixedExpenses: FixedExpense[];
  onClose: () => void;
  onAddDailyExpense: (data: {
    amount: number;
    description: string;
    date: string;
    category: DailyExpenseCategory;
    paymentMethod: PaymentMethod;
  }) => void;
  onAddIncome: (data: {
    amount: number;
    description: string;
    receivedDate: string;
    origin: IncomeOrigin;
    isConfirmed: boolean;
    isRecurring: boolean;
  }) => void;
  onQuickPayFixedExpense: (
    expenseId: string,
    status: PaymentStatus,
    contextualNote?: string
  ) => void;
  onAddFixedExpense: (data: {
    title: string;
    amount: number;
    paymentMethod: PaymentMethod;
    dueDate: string;
    paymentStatus: PaymentStatus;
    contextualNote?: string;
    currentInstallment?: number | null;
    totalInstallments?: number | null;
    isRecurring: boolean;
  }) => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  initialMode,
  defaultDate,
  pendingFixedExpenses,
  onClose,
  onAddDailyExpense,
  onAddIncome,
  onQuickPayFixedExpense,
  onAddFixedExpense,
}) => {
  const [mode, setMode] = useState<QuickActionMode>(initialMode);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Common numeric value first
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(defaultDate);

  // Daily expense specific
  const [dailyCategory, setDailyCategory] =
    useState<DailyExpenseCategory>('food');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');

  // Income specific
  const [incomeOrigin, setIncomeOrigin] = useState<IncomeOrigin>('Salário');
  const [incomeConfirmed, setIncomeConfirmed] = useState(true);
  const [incomeRecurring, setIncomeRecurring] = useState(false);

  // New Fixed Expense specific
  const [fixedStatus, setFixedStatus] = useState<PaymentStatus>('pending');
  const [fixedNote, setFixedNote] = useState('');
  const [isInstallment, setIsInstallment] = useState(false);
  const [currentInst, setCurrentInst] = useState('1');
  const [totalInst, setTotalInst] = useState('10');
  const [fixedRecurring, setFixedRecurring] = useState(true);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    setDate(defaultDate);
  }, [defaultDate]);

  useEffect(() => {
    if (isOpen && mode !== 'pay_bill') {
      const timer = setTimeout(() => {
        amountInputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (Number.isNaN(numericAmount) || numericAmount <= 0) return;

    if (mode === 'daily') {
      if (!description.trim()) return;
      onAddDailyExpense({
        amount: numericAmount,
        description: description.trim(),
        date,
        category: dailyCategory,
        paymentMethod,
      });
    } else if (mode === 'income') {
      if (!description.trim()) return;
      onAddIncome({
        amount: numericAmount,
        description: description.trim(),
        receivedDate: date,
        origin: incomeOrigin,
        isConfirmed: incomeConfirmed,
        isRecurring: incomeRecurring,
      });
    } else if (mode === 'new_fixed') {
      if (!description.trim()) return;
      const cInst = isInstallment ? parseInt(currentInst, 10) || 1 : null;
      const tInst = isInstallment ? parseInt(totalInst, 10) || 2 : null;
      onAddFixedExpense({
        title: description.trim(),
        amount: numericAmount,
        paymentMethod,
        dueDate: date,
        paymentStatus: fixedStatus,
        contextualNote:
          fixedNote.trim() ||
          (isInstallment && cInst === tInst ? 'Última!' : undefined),
        currentInstallment: cInst,
        totalInstallments: tInst,
        isRecurring: isInstallment ? false : fixedRecurring,
      });
    }

    setAmount('');
    setDescription('');
    setFixedNote('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Lançamento Rápido"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden">
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
              Ação Rápida de Caixa
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Atalhos de 1 clique com foco imediato no valor numérico
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="px-5 pt-3">
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('daily')}
              className={`py-2 px-2 flex flex-col items-center gap-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                mode === 'daily'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="whitespace-nowrap">Gasto Diário</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('income')}
              className={`py-2 px-2 flex flex-col items-center gap-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                mode === 'income'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ArrowUpCircle className="w-4 h-4" />
              <span className="whitespace-nowrap">Entrada</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('pay_bill')}
              className={`py-2 px-2 flex flex-col items-center gap-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                mode === 'pay_bill'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="whitespace-nowrap">Pagar Conta</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('new_fixed')}
              className={`py-2 px-2 flex flex-col items-center gap-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                mode === 'new_fixed'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <CalendarPlus className="w-4 h-4" />
              <span className="whitespace-nowrap">Conta Fixa</span>
            </button>
          </div>
        </div>

        {/* Body */}
        {mode === 'pay_bill' ? (
          <div className="p-5 max-h-[65vh] overflow-y-auto space-y-2.5">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Contas pendentes neste mês ({pendingFixedExpenses.length}). Toque para dar baixa imediata:
            </p>
            {pendingFixedExpenses.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Todas as contas fixas deste mês já estão quitadas!
              </div>
            ) : (
              pendingFixedExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {exp.title}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      Vence {formatShortDate(exp.dueDate)} ·{' '}
                      {formatCurrencyBRL(exp.amount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onQuickPayFixedExpense(exp.id, 'paid')}
                      className="px-3 py-1.5 min-h-[38px] text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg cursor-pointer"
                    >
                      Quitar
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onQuickPayFixedExpense(exp.id, 'exempt', 'Mãe Pagou')
                      }
                      className="px-2.5 py-1.5 min-h-[38px] text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg cursor-pointer"
                    >
                      Terceiros
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Numeric Input First (High Prominence) */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Valor do Lançamento (BRL)
              </label>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-slate-400">
                  R$
                </span>
                <input
                  ref={amountInputRef}
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full text-3xl font-bold font-mono tabular-nums bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            {/* Description & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {mode === 'new_fixed'
                    ? 'Título da Conta / Parcelamento'
                    : 'Descrição / Item'}
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    mode === 'daily'
                      ? 'Ex: Almoço executivo, Mercado, Uber...'
                      : mode === 'income'
                      ? 'Ex: Salário CLT, Freela Design, FGTS...'
                      : 'Ex: Seguro Auto, Notebook 10x, Internet...'
                  }
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {mode === 'new_fixed' ? 'Vencimento' : 'Data'}
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Mode-Specific Controls */}
            {mode === 'daily' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Categoria do Microgasto
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(
                      [
                        { id: 'food', label: 'Alimentação' },
                        { id: 'groceries', label: 'Mercado' },
                        { id: 'leisure', label: 'Lazer' },
                        { id: 'personal', label: 'Pessoais' },
                      ] as Array<{ id: DailyExpenseCategory; label: string }>
                    ).map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setDailyCategory(cat.id)}
                        className={`py-2 px-2.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                          dailyCategory === cat.id
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Forma de Pagamento
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: 'pix', label: 'Pix' },
                        { id: 'credit', label: 'Crédito' },
                        { id: 'debit', label: 'Débito' },
                        { id: 'cash', label: 'Dinheiro' },
                      ] as Array<{ id: PaymentMethod; label: string }>
                    ).map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                          paymentMethod === pm.id
                            ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {pm.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {mode === 'income' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Origem da Receita
                    </label>
                    <select
                      value={incomeOrigin}
                      onChange={(e) =>
                        setIncomeOrigin(e.target.value as IncomeOrigin)
                      }
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                    >
                      <option value="Salário">Salário</option>
                      <option value="Freelas">Freelas</option>
                      <option value="Comissões">Comissões</option>
                      <option value="FGTS">FGTS</option>
                      <option value="Ajudas de Custo">Ajudas de Custo</option>
                      <option value="Rendimentos">Rendimentos</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Status de Caixa
                    </label>
                    <select
                      value={incomeConfirmed ? 'confirmed' : 'pending'}
                      onChange={(e) =>
                        setIncomeConfirmed(e.target.value === 'confirmed')
                      }
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                    >
                      <option value="confirmed">Confirmado em Conta</option>
                      <option value="pending">Previsto / A Receber</option>
                    </select>
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incomeRecurring}
                    onChange={(e) => setIncomeRecurring(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Receita recorrente mensal (clonar ao encerrar o mês)</span>
                </label>
              </div>
            )}

            {mode === 'new_fixed' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Forma de Pagamento
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as PaymentMethod)
                      }
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                    >
                      <option value="boleto">Boleto</option>
                      <option value="pix">Pix</option>
                      <option value="credit">Cartão de Crédito</option>
                      <option value="debit">Débito Automático</option>
                      <option value="cash">Dinheiro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Status Inicial
                    </label>
                    <select
                      value={fixedStatus}
                      onChange={(e) =>
                        setFixedStatus(e.target.value as PaymentStatus)
                      }
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                    >
                      <option value="pending">Pendente</option>
                      <option value="paid">Já Pago</option>
                      <option value="exempt">Isento / Mãe Pagou</option>
                    </select>
                  </div>
                </div>

                {fixedStatus === 'exempt' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Marcação Contextual (Quem assumiu?)
                    </label>
                    <input
                      type="text"
                      value={fixedNote}
                      onChange={(e) => setFixedNote(e.target.value)}
                      placeholder="Ex: Mãe Pagou, Empresa Reembolsou"
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInstallment}
                      onChange={(e) => {
                        setIsInstallment(e.target.checked);
                        if (e.target.checked) setFixedRecurring(false);
                      }}
                      className="rounded border-slate-300 text-emerald-600"
                    />
                    <span>Compra Parcelada</span>
                  </label>

                  {!isInstallment && (
                    <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fixedRecurring}
                        onChange={(e) => setFixedRecurring(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600"
                      />
                      <span>Conta Recorrente Todo Mês</span>
                    </label>
                  )}
                </div>

                {isInstallment && (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                        Parcela Atual
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={currentInst}
                        onChange={(e) => setCurrentInst(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                        Total de Parcelas
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={totalInst}
                        onChange={(e) => setTotalInst(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                Confirmar Lançamento
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
