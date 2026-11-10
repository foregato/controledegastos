/**
 * Copyright (c) 2026 Arthur Araujo and contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  TrendingUp,
  CreditCard,
} from 'lucide-react';
import { MonthlyFinancialSummary } from '../types/finance';
import { formatCurrencyBRL } from '../lib/financialEngine';

interface SummaryCardsProps {
  summary: MonthlyFinancialSummary;
  onEditStartingBalance: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  summary,
  onEditStartingBalance,
}) => {
  const executionRate =
    summary.totalPredictedExpenses > 0
      ? Math.min(
          100,
          Math.round((summary.totalExecutedExpenses / summary.totalPredictedExpenses) * 100)
        )
      : 0;

  const isOperationalPositive = summary.operationalBalance >= 0;
  const isProjectedPositive = summary.projectedEndOfMonthBalance >= 0;

  return (
    <section aria-label="Indicadores de Previsibilidade Mensal" className="mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Entradas Totais (Novas + Saldo Anterior) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span className="font-medium">Disponibilidade Total (Caixa)</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono tabular-nums">
              {formatCurrencyBRL(summary.totalAvailableIncomesProjected)}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <button
                type="button"
                onClick={onEditStartingBalance}
                className="hover:underline text-left cursor-pointer"
                title="Clique para ajustar o saldo inicial vindo do mês anterior"
              >
                Saldo Mês Anterior (Rollover):
              </button>
              <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-200">
                {formatCurrencyBRL(summary.startingBalance)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Receitas Novas Confirmadas:</span>
              <span className="font-mono tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                +{formatCurrencyBRL(summary.totalConfirmedNewIncomes)}
              </span>
            </div>
            {summary.totalPendingNewIncomes > 0 && (
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>A Receber no Mês:</span>
                <span className="font-mono tabular-nums">
                  +{formatCurrencyBRL(summary.totalPendingNewIncomes)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Despesas Previstas vs. Executadas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span className="font-medium">Despesas Previstas vs. Executadas</span>
              <ArrowDownRight className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                {formatCurrencyBRL(summary.totalPredictedExpenses)}
              </span>
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {executionRate}% pago
              </span>
            </div>

            {/* Clean Progress Bar */}
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2.5">
              <div
                className="h-full bg-slate-900 dark:bg-emerald-500 transition-all duration-300"
                style={{ width: `${executionRate}%` }}
              />
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Executado (Fixas Pagas + Diário):</span>
              <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-200">
                {formatCurrencyBRL(summary.totalExecutedExpenses)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Contas Fixas a Pagar ({summary.pendingFixedCount}):</span>
              <span className="font-mono tabular-nums font-medium text-amber-600 dark:text-amber-400">
                {formatCurrencyBRL(summary.totalFixedPending)}
              </span>
            </div>
            {summary.totalFixedExempt > 0 && (
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Isentas / Terceiros ({summary.exemptFixedCount}):</span>
                <span className="font-mono tabular-nums">
                  {formatCurrencyBRL(summary.totalFixedExempt)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Saldo Operacional Atual (Real em Conta) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span className="font-medium">Saldo Operacional Atual (Em Conta)</span>
              <Wallet className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" />
            </div>
            <div
              className={`text-2xl font-bold tracking-tight font-mono tabular-nums ${
                isOperationalPositive
                  ? 'text-slate-900 dark:text-slate-100'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrencyBRL(summary.operationalBalance)}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs">
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Caixa real hoje: <span className="font-mono tabular-nums">{formatCurrencyBRL(summary.totalAvailableIncomesConfirmed)}</span> confirmados menos <span className="font-mono tabular-nums">{formatCurrencyBRL(summary.totalExecutedExpenses)}</span> já executados.
            </p>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-0.5">
              <span>Microgastos Diários no Mês:</span>
              <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-200">
                {formatCurrencyBRL(summary.totalDailyExpenses)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Saldo Projetado ao Fim do Mês (Focal Anchor) */}
        <div className="bg-slate-900 dark:bg-slate-900 text-white border border-slate-800 dark:border-emerald-500/30 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs text-slate-300 dark:text-slate-400 mb-2">
              <span className="font-medium">Saldo Projetado Fim do Mês</span>
              <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
            <div
              className={`text-2xl font-bold tracking-tight font-mono tabular-nums ${
                isProjectedPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrencyBRL(summary.projectedEndOfMonthBalance)}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span>Comprometimento da Renda:</span>
              <span className="font-mono tabular-nums font-semibold text-white">
                {summary.commitmentRatio}%
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="inline-flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                <span>Saldo Extra VR/VA (Isolado):</span>
              </span>
              <span className="font-mono tabular-nums font-medium text-indigo-300">
                {formatCurrencyBRL(summary.totalBenefitsRemaining)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
