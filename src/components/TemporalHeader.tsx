/**
 * Copyright (c) 2026 Arthur Araujo and contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  Sun,
  Moon,
  RotateCcw,
  ArrowRightCircle,
} from 'lucide-react';
import { MonthlyFinancialSummary, MonthlyPeriod } from '../types/finance';
import { formatCurrencyBRL, formatPeriodLabel } from '../lib/financialEngine';

interface TemporalHeaderProps {
  periods: MonthlyPeriod[];
  currentPeriod: MonthlyPeriod;
  summary: MonthlyFinancialSummary;
  isDark: boolean;
  onToggleTheme: () => void;
  onSelectPeriodId: (periodId: string) => void;
  onOpenCloseMonthModal: () => void;
  onReopenMonth: () => void;
  onResetDemoData: () => void;
}

export const TemporalHeader: React.FC<TemporalHeaderProps> = ({
  periods,
  currentPeriod,
  summary,
  isDark,
  onToggleTheme,
  onSelectPeriodId,
  onOpenCloseMonthModal,
  onReopenMonth,
  onResetDemoData,
}) => {
  const sortedPeriods = [...periods].sort(
    (a, b) => a.year * 12 + a.month - (b.year * 12 + b.month)
  );
  const currentIndex = sortedPeriods.findIndex((p) => p.id === currentPeriod.id);
  const prevPeriod = currentIndex > 0 ? sortedPeriods[currentIndex - 1] : null;
  const nextPeriod =
    currentIndex < sortedPeriods.length - 1 ? sortedPeriods[currentIndex + 1] : null;

  const isClosed = currentPeriod.status === 'closed';
  const projectedIsPositive = summary.projectedEndOfMonthBalance >= 0;

  return (
    <section
      aria-label="Seletor Temporal e Controle de Ciclo Mensal"
      className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5">
        {/* Left: Month Navigation + Cycle Status */}
        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-3">
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/70">
            <button
              type="button"
              disabled={!prevPeriod}
              onClick={() => prevPeriod && onSelectPeriodId(prevPeriod.id)}
              title={
                prevPeriod
                  ? `Ir para ${formatPeriodLabel(prevPeriod.month, prevPeriod.year)}`
                  : 'Primeiro período registrado'
              }
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-3.5 py-1 text-center min-w-[155px]">
              <span className="block text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display whitespace-nowrap">
                {formatPeriodLabel(currentPeriod.month, currentPeriod.year)}
              </span>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                Ciclo {String(currentPeriod.month).padStart(2, '0')}/{currentPeriod.year}
              </span>
            </div>

            <button
              type="button"
              disabled={!nextPeriod}
              onClick={() => nextPeriod && onSelectPeriodId(nextPeriod.id)}
              title={
                nextPeriod
                  ? `Ir para ${formatPeriodLabel(nextPeriod.month, nextPeriod.year)}`
                  : 'Encerre o mês atual para gerar o próximo ciclo'
              }
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Unboxed status metadata */}
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            {isClosed ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400">
                <Lock className="w-3.5 h-3.5" />
                <span>Mês Encerrado</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                <Unlock className="w-3.5 h-3.5" />
                <span>Ciclo Aberto</span>
              </span>
            )}
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              Rollover inicial: {formatCurrencyBRL(currentPeriod.startingBalance)}
            </span>
          </div>
        </div>

        {/* Right: Projected Balance Indicator + Utility Controls + Close Month CTA */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
          <div className="flex items-center gap-2 pr-2 sm:border-r border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Saldo Projetado:
            </span>
            <span
              className={`text-sm sm:text-base font-bold font-mono tabular-nums whitespace-nowrap ${
                projectedIsPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrencyBRL(summary.projectedEndOfMonthBalance)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleTheme}
              title={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
              className="min-w-[40px] min-h-[40px] px-2.5 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              <span className="hidden sm:inline">{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
            </button>

            <button
              type="button"
              onClick={onResetDemoData}
              title="Restaurar dados de demonstração"
              className="min-w-[40px] min-h-[40px] px-2.5 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Restaurar Demo</span>
            </button>

            {isClosed ? (
              <button
                type="button"
                onClick={onReopenMonth}
                className="min-h-[40px] px-3.5 py-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Reabrir Mês</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenCloseMonthModal}
                className="min-h-[40px] px-3.5 py-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-950 bg-slate-900/10 dark:bg-slate-100 hover:bg-slate-900 hover:text-white dark:hover:bg-white rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <ArrowRightCircle className="w-3.5 h-3.5" />
                <span>Encerrar Mês</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
