import {
  BenefitWallet,
  BenefitWalletSummary,
  DailyExpense,
  DailyExpenseCategory,
  FixedExpense,
  IncomeEntry,
  MonthlyFinancialSummary,
  MonthlyPeriod,
  MonthRolloverPreview,
} from '../types/finance';

const MONTH_NAMES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

/**
 * Arredonda valores monetários para 2 casas decimais evitando erros de ponto flutuante IEEE 754.
 */
export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Formata número para moeda BRL (R$ 1.234,56).
 */
export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Retorna o nome do mês e ano formatado (ex: "Novembro 2026").
 */
export function formatPeriodLabel(month: number, year: number): string {
  const monthName = MONTH_NAMES_PT[Math.max(0, Math.min(11, month - 1))];
  return `${monthName} ${year}`;
}

/**
 * Formata data ISO (YYYY-MM-DD) para DD/MM ou DD/MM/YYYY.
 */
export function formatShortDate(isoDate: string, includeYear = false): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const [year, month, day] = parts;
  return includeYear ? `${day}/${month}/${year}` : `${day}/${month}`;
}

/**
 * Verifica se uma conta parcelada está na última parcela.
 */
export function isFinalInstallment(expense: Pick<FixedExpense, 'currentInstallment' | 'totalInstallments'>): boolean {
  if (!expense.currentInstallment || !expense.totalInstallments) return false;
  return expense.currentInstallment === expense.totalInstallments && expense.totalInstallments > 1;
}

/**
 * Calcula o resumo isolado de uma Carteira de Benefício (VR / VA / Flex).
 * Nunca se mistura ao saldo da conta corrente principal.
 */
export function calculateBenefitWalletSummary(wallet: BenefitWallet): BenefitWalletSummary {
  const previousBalance = roundCurrency(wallet.previousBalance);
  const monthlyCredit = roundCurrency(wallet.monthlyCredit);
  const totalAvailable = roundCurrency(previousBalance + monthlyCredit);

  const totalSpent = roundCurrency(
    wallet.transactions.reduce((acc, tx) => acc + tx.amount, 0)
  );

  const remainingBalance = roundCurrency(totalAvailable - totalSpent);
  const usagePercentage =
    totalAvailable > 0
      ? Math.min(100, Math.round((totalSpent / totalAvailable) * 100))
      : 0;

  return {
    walletId: wallet.id,
    providerName: wallet.providerName,
    cardType: wallet.cardType,
    previousBalance,
    monthlyCredit,
    totalAvailable,
    totalSpent,
    remainingBalance,
    usagePercentage,
  };
}

/**
 * Função pura central de Previsibilidade e Fluxo de Caixa Mensal.
 * Calcula todos os indicadores operacionais e projetados do período.
 */
export function calculateMonthlySummary(params: {
  period: MonthlyPeriod;
  incomes: IncomeEntry[];
  fixedExpenses: FixedExpense[];
  dailyExpenses: DailyExpense[];
  benefitWallets: BenefitWallet[];
}): MonthlyFinancialSummary {
  const { period, incomes, fixedExpenses, dailyExpenses, benefitWallets } = params;

  const startingBalance = roundCurrency(period.startingBalance);

  // 1. Entradas / Receitas Novas do Mês
  const totalConfirmedNewIncomes = roundCurrency(
    incomes.filter((i) => i.isConfirmed).reduce((acc, i) => acc + i.amount, 0)
  );
  const totalPendingNewIncomes = roundCurrency(
    incomes.filter((i) => !i.isConfirmed).reduce((acc, i) => acc + i.amount, 0)
  );
  const totalPredictedNewIncomes = roundCurrency(
    totalConfirmedNewIncomes + totalPendingNewIncomes
  );

  const totalAvailableIncomesConfirmed = roundCurrency(
    startingBalance + totalConfirmedNewIncomes
  );
  const totalAvailableIncomesProjected = roundCurrency(
    startingBalance + totalPredictedNewIncomes
  );

  // 2. Contas Fixas e Parcelamentos
  // Contas com status 'exempt' (Isento / Mãe Pagou) ficam registradas para histórico,
  // mas não drenam o caixa operacional nem o projetado do usuário.
  const totalFixedGross = roundCurrency(
    fixedExpenses.reduce((acc, f) => acc + f.amount, 0)
  );
  const totalFixedPaid = roundCurrency(
    fixedExpenses
      .filter((f) => f.paymentStatus === 'paid')
      .reduce((acc, f) => acc + f.amount, 0)
  );
  const totalFixedPending = roundCurrency(
    fixedExpenses
      .filter((f) => f.paymentStatus === 'pending')
      .reduce((acc, f) => acc + f.amount, 0)
  );
  const totalFixedExempt = roundCurrency(
    fixedExpenses
      .filter((f) => f.paymentStatus === 'exempt')
      .reduce((acc, f) => acc + f.amount, 0)
  );

  const totalFixedPredicted = roundCurrency(totalFixedPaid + totalFixedPending);

  const paidFixedCount = fixedExpenses.filter((f) => f.paymentStatus === 'paid').length;
  const pendingFixedCount = fixedExpenses.filter((f) => f.paymentStatus === 'pending').length;
  const exemptFixedCount = fixedExpenses.filter((f) => f.paymentStatus === 'exempt').length;

  // 3. Despesas Diárias / Microgastos Categorizados
  const dailyExpensesByCategory: Record<DailyExpenseCategory, number> = {
    food: 0,
    groceries: 0,
    leisure: 0,
    personal: 0,
  };

  let totalDailyExpenses = 0;
  for (const item of dailyExpenses) {
    dailyExpensesByCategory[item.category] = roundCurrency(
      (dailyExpensesByCategory[item.category] || 0) + item.amount
    );
    totalDailyExpenses = roundCurrency(totalDailyExpenses + item.amount);
  }

  // 4. Painel de Indicadores e Previsibilidade
  // Total Despesas Previstas: soma das contas fixas exigíveis + microgastos registrados no mês
  const totalPredictedExpenses = roundCurrency(
    totalFixedPredicted + totalDailyExpenses
  );

  // Total Despesas Executadas: contas fixas já pagas + microgastos diários registrados
  const totalExecutedExpenses = roundCurrency(
    totalFixedPaid + totalDailyExpenses
  );

  // Saldo Operacional Atual: (Saldo Anterior + Entradas Confirmadas) - Despesas Executadas
  const operationalBalance = roundCurrency(
    totalAvailableIncomesConfirmed - totalExecutedExpenses
  );

  // Saldo Projetado ao Fim do Mês: (Saldo Anterior + Todas as Entradas) - Todas as Despesas Previstas
  const projectedEndOfMonthBalance = roundCurrency(
    totalAvailableIncomesProjected - totalPredictedExpenses
  );

  const commitmentRatio =
    totalAvailableIncomesProjected > 0
      ? Math.min(
          100,
          Math.round((totalPredictedExpenses / totalAvailableIncomesProjected) * 100)
        )
      : 0;

  // 5. Benefícios Isolados
  const walletSummaries = benefitWallets.map(calculateBenefitWalletSummary);
  const totalBenefitsRemaining = roundCurrency(
    walletSummaries.reduce((acc, w) => acc + w.remainingBalance, 0)
  );
  const totalBenefitsSpent = roundCurrency(
    walletSummaries.reduce((acc, w) => acc + w.totalSpent, 0)
  );

  return {
    periodId: period.id,
    startingBalance,
    totalConfirmedNewIncomes,
    totalPendingNewIncomes,
    totalPredictedNewIncomes,
    totalAvailableIncomesConfirmed,
    totalAvailableIncomesProjected,
    totalFixedPredicted,
    totalFixedGross,
    totalFixedPaid,
    totalFixedPending,
    totalFixedExempt,
    paidFixedCount,
    pendingFixedCount,
    exemptFixedCount,
    totalDailyExpenses,
    dailyExpensesByCategory,
    totalPredictedExpenses,
    totalExecutedExpenses,
    operationalBalance,
    projectedEndOfMonthBalance,
    commitmentRatio,
    totalBenefitsRemaining,
    totalBenefitsSpent,
  };
}

/**
 * Agrupa microgastos diários por data (decrescente) com subtotal diário.
 */
export function groupDailyExpensesByDate(
  expenses: DailyExpense[]
): Array<{ date: string; totalDay: number; items: DailyExpense[] }> {
  const map = new Map<string, DailyExpense[]>();

  for (const exp of expenses) {
    const existing = map.get(exp.date) || [];
    existing.push(exp);
    map.set(exp.date, existing);
  }

  return Array.from(map.entries())
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .map(([date, items]) => ({
      date,
      totalDay: roundCurrency(items.reduce((acc, i) => acc + i.amount, 0)),
      items,
    }));
}

/**
 * Avança uma data YYYY-MM-DD para o mês/ano seguinte mantendo o dia válido.
 */
export function shiftDateToPeriod(
  isoDate: string,
  targetMonth: number,
  targetYear: number
): string {
  const parts = isoDate.split('-');
  const originalDay = parts.length === 3 ? parseInt(parts[2], 10) : 10;
  const maxDaysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
  const safeDay = Math.min(originalDay || 10, maxDaysInTargetMonth);
  const mm = String(targetMonth).padStart(2, '0');
  const dd = String(safeDay).padStart(2, '0');
  return `${targetYear}-${mm}-${dd}`;
}

/**
 * Calcula o preview completo de Fechamento de Mês (Rollover Automático):
 * 1. Transfere o Saldo Operacional Real para o starting_balance do próximo mês.
 * 2. Clona receitas marcadas como recorrentes.
 * 3. Clona contas fixas recorrentes e avança parcelas ativas (excluindo parcelas já encerradas).
 * 4. Transfere o saldo remanescente das carteiras de benefícios (VR/VA).
 */
export function computeMonthRolloverPreview(params: {
  sourcePeriod: MonthlyPeriod;
  incomes: IncomeEntry[];
  fixedExpenses: FixedExpense[];
  dailyExpenses: DailyExpense[];
  benefitWallets: BenefitWallet[];
}): MonthRolloverPreview {
  const { sourcePeriod, incomes, fixedExpenses, dailyExpenses, benefitWallets } = params;

  const summary = calculateMonthlySummary({
    period: sourcePeriod,
    incomes,
    fixedExpenses,
    dailyExpenses,
    benefitWallets,
  });

  const targetMonth = sourcePeriod.month === 12 ? 1 : sourcePeriod.month + 1;
  const targetYear =
    sourcePeriod.month === 12 ? sourcePeriod.year + 1 : sourcePeriod.year;

  const recurringIncomesToClone = incomes.filter((inc) => inc.isRecurring);

  const fixedExpensesToClone: MonthRolloverPreview['fixedExpensesToClone'] = [];
  const completedInstallmentsExcluded: FixedExpense[] = [];

  for (const exp of fixedExpenses) {
    const hasInstallments =
      Boolean(exp.currentInstallment) && Boolean(exp.totalInstallments);

    if (hasInstallments) {
      const current = exp.currentInstallment!;
      const total = exp.totalInstallments!;
      if (current < total) {
        const nextInstallment = current + 1;
        fixedExpensesToClone.push({
          original: exp,
          nextInstallment,
          totalInstallments: total,
          isLastInstallment: nextInstallment === total,
          nextDueDate: shiftDateToPeriod(exp.dueDate, targetMonth, targetYear),
        });
      } else {
        completedInstallmentsExcluded.push(exp);
      }
    } else if (exp.isRecurring) {
      fixedExpensesToClone.push({
        original: exp,
        nextInstallment: null,
        totalInstallments: null,
        isLastInstallment: false,
        nextDueDate: shiftDateToPeriod(exp.dueDate, targetMonth, targetYear),
      });
    }
  }

  const benefitWalletsRollover = benefitWallets.map((w) => {
    const walletSummary = calculateBenefitWalletSummary(w);
    return {
      providerName: w.providerName,
      cardType: w.cardType,
      remainingBalanceToTransfer: Math.max(0, walletSummary.remainingBalance),
      suggestedMonthlyCredit: w.monthlyCredit,
      colorAccent: w.colorAccent,
    };
  });

  return {
    sourcePeriod,
    targetMonth,
    targetYear,
    targetPeriodLabel: formatPeriodLabel(targetMonth, targetYear),
    transferableOperationalBalance: summary.operationalBalance,
    recurringIncomesToClone,
    fixedExpensesToClone,
    completedInstallmentsExcluded,
    benefitWalletsRollover,
  };
}
