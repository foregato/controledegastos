export type PaymentMethod = 'pix' | 'credit' | 'debit' | 'boleto' | 'cash';

export type PaymentStatus = 'pending' | 'paid' | 'exempt';

export type IncomeOrigin =
  | 'Salário'
  | 'FGTS'
  | 'Freelas'
  | 'Comissões'
  | 'Ajudas de Custo'
  | 'Rendimentos'
  | 'Outros';

export type DailyExpenseCategory =
  | 'food'       // Alimentação/Comida
  | 'groceries'  // Mercado
  | 'leisure'    // Lazer
  | 'personal';  // Gastos Pessoais/Outros

export interface MonthlyPeriod {
  id: string;
  userId: string;
  month: number; // 1 to 12
  year: number;  // e.g. 2026
  startingBalance: number; // Saldo Remanescente do Mês Anterior (Rollover)
  status: 'open' | 'closed';
  closedAt?: string | null;
  notes?: string;
}

export interface FixedExpense {
  id: string;
  userId: string;
  periodId: string;
  title: string;
  amount: number;
  paymentMethod: PaymentMethod;
  dueDate: string; // YYYY-MM-DD
  paymentStatus: PaymentStatus;
  contextualNote?: string; // ex.: "Mãe Pagou", "Reembolso Empresa", "Última!"
  currentInstallment?: number | null;
  totalInstallments?: number | null;
  isRecurring: boolean; // recorrente_mensal
  paidAt?: string | null;
}

export interface IncomeEntry {
  id: string;
  userId: string;
  periodId: string;
  description: string;
  amount: number;
  receivedDate: string; // YYYY-MM-DD
  origin: IncomeOrigin;
  isConfirmed: boolean;
  isRecurring?: boolean;
}

export interface DailyExpense {
  id: string;
  userId: string;
  periodId: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: DailyExpenseCategory;
  paymentMethod?: PaymentMethod;
}

export interface BenefitTransaction {
  id: string;
  walletId: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  merchantCategory?: string;
}

export interface BenefitWallet {
  id: string;
  userId: string;
  periodId: string;
  providerName: string; // ex.: "Pluxee Refeição", "Flash Alimentação", "VR Benefícios"
  cardType: 'VA' | 'VR' | 'Flex';
  previousBalance: number; // Saldo do mês anterior no cartão
  monthlyCredit: number;   // Crédito recarregado no mês
  colorAccent: 'indigo' | 'emerald' | 'amber' | 'rose';
  transactions: BenefitTransaction[];
}

export interface BenefitWalletSummary {
  walletId: string;
  providerName: string;
  cardType: 'VA' | 'VR' | 'Flex';
  previousBalance: number;
  monthlyCredit: number;
  totalAvailable: number;
  totalSpent: number;
  remainingBalance: number;
  usagePercentage: number;
}

export interface MonthlyFinancialSummary {
  periodId: string;
  startingBalance: number; // Rollover do mês anterior

  // Entradas
  totalConfirmedNewIncomes: number;
  totalPendingNewIncomes: number;
  totalPredictedNewIncomes: number;
  totalAvailableIncomesConfirmed: number; // Saldo Anterior + Entradas Confirmadas
  totalAvailableIncomesProjected: number; // Saldo Anterior + Todas as Entradas

  // Contas Fixas & Parceladas
  totalFixedPredicted: number;       // Soma de contas fixas + parcelas (exceto isentas/terceiros)
  totalFixedGross: number;           // Soma bruta incluindo isentas
  totalFixedPaid: number;            // Contas fixas já pagas pelo usuário
  totalFixedPending: number;         // Contas fixas ainda pendentes de desembolso
  totalFixedExempt: number;          // Contas assumidas por terceiros ("Mãe Pagou" / Isento)
  paidFixedCount: number;
  pendingFixedCount: number;
  exemptFixedCount: number;

  // Despesas Diárias / Microgastos
  totalDailyExpenses: number;
  dailyExpensesByCategory: Record<DailyExpenseCategory, number>;

  // Indicadores Globais de Caixa (Conta Corrente)
  totalPredictedExpenses: number;    // Contas fixas exigíveis + microgastos acumulados
  totalExecutedExpenses: number;     // Contas fixas já pagas + microgastos diários registrados
  operationalBalance: number;        // (Saldo Anterior + Entradas Confirmadas) - Despesas Executadas
  projectedEndOfMonthBalance: number;// (Saldo Anterior + Todas as Entradas) - Todas as Despesas Previstas
  commitmentRatio: number;           // % da disponibilidade total comprometida

  // Benefícios Isolados (Não somam no operacional da conta corrente)
  totalBenefitsRemaining: number;
  totalBenefitsSpent: number;
}

export interface MonthRolloverPreview {
  sourcePeriod: MonthlyPeriod;
  targetMonth: number;
  targetYear: number;
  targetPeriodLabel: string;
  transferableOperationalBalance: number;
  recurringIncomesToClone: IncomeEntry[];
  fixedExpensesToClone: Array<{
    original: FixedExpense;
    nextInstallment: number | null;
    totalInstallments: number | null;
    isLastInstallment: boolean;
    nextDueDate: string;
  }>;
  completedInstallmentsExcluded: FixedExpense[];
  benefitWalletsRollover: Array<{
    providerName: string;
    cardType: 'VA' | 'VR' | 'Flex';
    remainingBalanceToTransfer: number;
    suggestedMonthlyCredit: number;
    colorAccent: 'indigo' | 'emerald' | 'amber' | 'rose';
  }>;
}
