export const DRIZZLE_SCHEMA_CODE = `// src/db/schema.ts
// Drizzle ORM PostgreSQL Schema — Multi-Tenant Personal Finance & Predictability SaaS
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  date,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Enums de Domínio
export const paymentMethodEnum = pgEnum('payment_method', [
  'pix',
  'credit',
  'debit',
  'boleto',
  'cash',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending', // Pendente
  'paid',    // Pago pelo próprio usuário
  'exempt',  // Isento / Pago por terceiros (ex: "Mãe Pagou")
]);

export const dailyCategoryEnum = pgEnum('daily_expense_category', [
  'food',      // Alimentação / Comida
  'groceries', // Mercado
  'leisure',   // Lazer
  'personal',  // Gastos Pessoais / Outros
]);

export const periodStatusEnum = pgEnum('period_status', ['open', 'closed']);

// 2. Tabela de Usuários (Multi-Tenancy Root)
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  fullName: varchar('full_name', { length: 160 }).notNull(),
  currencyCode: varchar('currency_code', { length: 3 }).default('BRL').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 3. Períodos Mensais (MonthContext: ex. 11/2026)
export const monthlyPeriods = pgTable(
  'monthly_periods',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    month: integer('month').notNull(), // 1..12
    year: integer('year').notNull(),   // ex: 2026
    startingBalance: numeric('starting_balance', { precision: 12, scale: 2 })
      .default('0.00')
      .notNull(), // Rollover do mês anterior
    status: periodStatusEnum('status').default('open').notNull(),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userYearMonthUnique: uniqueIndex('idx_monthly_periods_user_year_month').on(
      table.userId,
      table.year,
      table.month
    ),
  })
);

// 4. Entradas / Receitas do Mês
export const incomes = pgTable(
  'incomes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    periodId: uuid('period_id')
      .notNull()
      .references(() => monthlyPeriods.id, { onDelete: 'cascade' }),
    description: varchar('description', { length: 200 }).notNull(),
    origin: varchar('origin', { length: 80 }).notNull(), // Salário, FGTS, Freelas, Comissões, Ajudas de Custo
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    receivedDate: date('received_date').notNull(),
    isConfirmed: boolean('is_confirmed').default(true).notNull(),
    isRecurring: boolean('is_recurring').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userPeriodIdx: index('idx_incomes_user_period').on(table.userId, table.periodId),
  })
);

// 5. Contas Fixas, Recorrentes e Parcelamentos
export const fixedExpenses = pgTable(
  'fixed_expenses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    periodId: uuid('period_id')
      .notNull()
      .references(() => monthlyPeriods.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 200 }).notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    dueDate: date('due_date').notNull(),
    paymentStatus: paymentStatusEnum('payment_status').default('pending').notNull(),
    contextualNote: varchar('contextual_note', { length: 120 }), // ex: "Mãe Pagou", "Última!"
    currentInstallment: integer('current_installment'),
    totalInstallments: integer('total_installments'),
    isRecurring: boolean('is_recurring').default(false).notNull(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userPeriodDueIdx: index('idx_fixed_expenses_user_period_due').on(
      table.userId,
      table.periodId,
      table.dueDate
    ),
  })
);

// 6. Despesas Diárias / Microgastos Categorizados
export const dailyExpenses = pgTable(
  'daily_expenses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    periodId: uuid('period_id')
      .notNull()
      .references(() => monthlyPeriods.id, { onDelete: 'cascade' }),
    description: varchar('description', { length: 220 }).notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    expenseDate: date('expense_date').notNull(),
    category: dailyCategoryEnum('category').notNull(),
    paymentMethod: paymentMethodEnum('payment_method').default('pix'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userPeriodDateIdx: index('idx_daily_expenses_user_period_date').on(
      table.userId,
      table.periodId,
      table.expenseDate
    ),
  })
);

// 7. Carteiras de Benefícios Isoladas (VR / VA / Flex)
export const benefitWallets = pgTable(
  'benefit_wallets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    periodId: uuid('period_id')
      .notNull()
      .references(() => monthlyPeriods.id, { onDelete: 'cascade' }),
    providerName: varchar('provider_name', { length: 120 }).notNull(), // Pluxee, Flash, VR, Sodexo
    cardType: varchar('card_type', { length: 20 }).default('VR').notNull(),
    previousBalance: numeric('previous_balance', { precision: 12, scale: 2 })
      .default('0.00')
      .notNull(),
    monthlyCredit: numeric('monthly_credit', { precision: 12, scale: 2 })
      .default('0.00')
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userPeriodWalletIdx: index('idx_benefit_wallets_user_period').on(
      table.userId,
      table.periodId
    ),
  })
);

// 8. Transações Dedicadas das Carteiras de Benefícios
export const benefitTransactions = pgTable('benefit_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  walletId: uuid('wallet_id')
    .notNull()
    .references(() => benefitWallets.id, { onDelete: 'cascade' }),
  description: varchar('description', { length: 200 }).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  transactionDate: date('transaction_date').notNull(),
  merchantCategory: varchar('merchant_category', { length: 80 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relacionamentos Drizzle ORM
export const monthlyPeriodsRelations = relations(monthlyPeriods, ({ one, many }) => ({
  user: one(users, { fields: [monthlyPeriods.userId], references: [users.id] }),
  incomes: many(incomes),
  fixedExpenses: many(fixedExpenses),
  dailyExpenses: many(dailyExpenses),
  benefitWallets: many(benefitWallets),
}));
`;

export const POSTGRES_RLS_SQL_CODE = `-- ============================================================================
-- PostgreSQL 16+ DDL + Row Level Security (RLS) Multi-Tenant Policies
-- Plataforma: FluxoCaixa Pro (Gestão Financeira Pessoal & Previsibilidade)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tipos Enumerados
CREATE TYPE payment_method AS ENUM ('pix', 'credit', 'debit', 'boleto', 'cash');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'exempt');
CREATE TYPE daily_expense_category AS ENUM ('food', 'groceries', 'leisure', 'personal');
CREATE TYPE period_status AS ENUM ('open', 'closed');

-- 2. Tabelas Core com Constraints de Integridade
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(160) NOT NULL,
  currency_code CHAR(3) NOT NULL DEFAULT 'BRL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE monthly_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year SMALLINT NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  starting_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  status period_status NOT NULL DEFAULT 'open',
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year, month)
);

CREATE TABLE incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES monthly_periods(id) ON DELETE CASCADE,
  description VARCHAR(200) NOT NULL,
  origin VARCHAR(80) NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  received_date DATE NOT NULL,
  is_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fixed_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES monthly_periods(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  payment_method payment_method NOT NULL,
  due_date DATE NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  contextual_note VARCHAR(120),
  current_installment SMALLINT CHECK (current_installment IS NULL OR current_installment >= 1),
  total_installments SMALLINT CHECK (
    total_installments IS NULL OR
    (total_installments >= 1 AND current_installment <= total_installments)
  ),
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE daily_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES monthly_periods(id) ON DELETE CASCADE,
  description VARCHAR(220) NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL,
  category daily_expense_category NOT NULL,
  payment_method payment_method DEFAULT 'pix',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE benefit_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES monthly_periods(id) ON DELETE CASCADE,
  provider_name VARCHAR(120) NOT NULL,
  card_type VARCHAR(20) NOT NULL DEFAULT 'VR',
  previous_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  monthly_credit NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE benefit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES benefit_wallets(id) ON DELETE CASCADE,
  description VARCHAR(200) NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  transaction_date DATE NOT NULL,
  merchant_category VARCHAR(80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. Row Level Security (RLS) Multi-Tenancy Isolado por auth.uid()
-- ============================================================================
ALTER TABLE monthly_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_monthly_periods ON monthly_periods
  USING (user_id = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY tenant_isolation_incomes ON incomes
  USING (user_id = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY tenant_isolation_fixed_expenses ON fixed_expenses
  USING (user_id = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY tenant_isolation_daily_expenses ON daily_expenses
  USING (user_id = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY tenant_isolation_benefit_wallets ON benefit_wallets
  USING (user_id = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY tenant_isolation_benefit_transactions ON benefit_transactions
  USING (user_id = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);
`;

export const ENV_AND_EXECUTION_GUIDE = `# Variáveis de Ambiente (.env.example)

# Conexão PostgreSQL / Supabase (Pooler Transaction Mode ou Direct Connection)
DATABASE_URL="postgresql://postgres:password@localhost:5432/fluxocaixa_pro?schema=public"

# Autenticação (Supabase Auth / NextAuth OAuth Google + Magic Link)
NEXT_PUBLIC_SUPABASE_URL="https://xyzcompany.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
AUTH_SECRET="super-secret-32-byte-key-for-session-signing"
GOOGLE_CLIENT_ID="your-google-oauth-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"

# Configurações Regionais
DEFAULT_CURRENCY="BRL"
DEFAULT_TIMEZONE="America/Sao_Paulo"

# ============================================================================
# Instruções de Execução e Deploy
# ============================================================================
# 1. Instalar dependências:
#    npm install
#
# 2. Gerar e aplicar migrations com Drizzle Kit (em ambiente PostgreSQL):
#    npx drizzle-kit generate
#    npx drizzle-kit migrate
#
# 3. Iniciar servidor de desenvolvimento (Porta 3000):
#    npm run dev
#
# 4. Build de produção:
#    npm run build
`;
