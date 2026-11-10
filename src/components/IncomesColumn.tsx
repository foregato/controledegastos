import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Edit3,
  CornerDownRight,
  Repeat,
} from 'lucide-react';
import { IncomeEntry, MonthlyPeriod } from '../types/finance';
import { formatCurrencyBRL, formatShortDate } from '../lib/financialEngine';

interface IncomesColumnProps {
  period: MonthlyPeriod;
  incomes: IncomeEntry[];
  isPeriodClosed: boolean;
  onUpdateStartingBalance: (newBalance: number) => void;
  onToggleConfirmIncome: (incomeId: string) => void;
  onDeleteIncome: (incomeId: string) => void;
  onOpenAddIncome: () => void;
}

export const IncomesColumn: React.FC<IncomesColumnProps> = ({
  period,
  incomes,
  isPeriodClosed,
  onUpdateStartingBalance,
  onToggleConfirmIncome,
  onDeleteIncome,
  onOpenAddIncome,
}) => {
  const [isEditingRollover, setIsEditingRollover] = useState(false);
  const [rolloverInput, setRolloverInput] = useState(
    String(period.startingBalance)
  );

  const sortedIncomes = [...incomes].sort((a, b) =>
    a.receivedDate.localeCompare(b.receivedDate)
  );

  const totalNewConfirmed = sortedIncomes
    .filter((i) => i.isConfirmed)
    .reduce((acc, i) => acc + i.amount, 0);

  const totalNewPending = sortedIncomes
    .filter((i) => !i.isConfirmed)
    .reduce((acc, i) => acc + i.amount, 0);

  const handleSaveRollover = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(rolloverInput.replace(',', '.'));
    if (!Number.isNaN(parsed)) {
      onUpdateStartingBalance(parsed);
    }
    setIsEditingRollover(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col h-full">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
              02. Entradas & Rollover
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
              Novas: {formatCurrencyBRL(totalNewConfirmed)}
              {totalNewPending > 0 && ` · Previsto: +${formatCurrencyBRL(totalNewPending)}`}
            </p>
          </div>

          {!isPeriodClosed && (
            <button
              type="button"
              onClick={onOpenAddIncome}
              className="min-h-[38px] px-3 py-1.5 inline-flex items-center gap-1 text-xs font-semibold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Entrada</span>
            </button>
          )}
        </div>
      </div>

      {/* Explicit Distinction 1: Saldo Remanescente do Mês Anterior (Rollover Cumulativo) */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <CornerDownRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Saldo Remanescente do Mês Anterior
              </span>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                Rollover cumulativo de caixa em conta corrente
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
              {formatCurrencyBRL(period.startingBalance)}
            </span>
            {!isPeriodClosed && (
              <button
                type="button"
                onClick={() => {
                  setRolloverInput(String(period.startingBalance));
                  setIsEditingRollover(!isEditingRollover);
                }}
                title="Ajustar saldo remanescente do mês anterior"
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {isEditingRollover && !isPeriodClosed && (
          <form onSubmit={handleSaveRollover} className="mt-3 flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              value={rolloverInput}
              onChange={(e) => setRolloverInput(e.target.value)}
              className="flex-1 min-w-0 px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100"
              placeholder="0.00"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md whitespace-nowrap cursor-pointer"
            >
              Salvar Rollover
            </button>
          </form>
        )}
      </div>

      {/* Explicit Distinction 2: Receitas Novas do Mês */}
      <div className="px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Receitas Novas do Mês ({sortedIncomes.length})
        </span>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800/80 flex-1">
        {sortedIncomes.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              Nenhuma receita nova registrada neste mês.
            </p>
            {!isPeriodClosed && (
              <button
                type="button"
                onClick={onOpenAddIncome}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer"
              >
                Registrar Primeira Entrada
              </button>
            )}
          </div>
        ) : (
          sortedIncomes.map((inc) => (
            <div
              key={inc.id}
              className="p-3.5 sm:px-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* 40x40 Status Button */}
                <button
                  type="button"
                  disabled={isPeriodClosed}
                  onClick={() => onToggleConfirmIncome(inc.id)}
                  title={
                    inc.isConfirmed
                      ? 'Receita já confirmada em conta (clique para marcar como prevista)'
                      : 'Receita prevista (clique para confirmar recebimento)'
                  }
                  className={`min-w-[40px] min-h-[40px] -ml-1 flex items-center justify-center rounded-xl transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed ${
                    inc.isConfirmed
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                      : 'text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-emerald-500/15 hover:text-emerald-600'
                  }`}
                >
                  {inc.isConfirmed ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                      {inc.description}
                    </span>
                    <span
                      className={`text-sm font-bold font-mono tabular-nums whitespace-nowrap shrink-0 ${
                        inc.isConfirmed
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      +{formatCurrencyBRL(inc.amount)}
                    </span>
                  </div>

                  {/* Clean Unboxed Metadata */}
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {inc.origin}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {formatShortDate(inc.receivedDate)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          inc.isConfirmed
                            ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                            : 'text-amber-600 dark:text-amber-400 font-medium'
                        }
                      >
                        {inc.isConfirmed ? 'Confirmado' : 'A Receber'}
                      </span>
                      {inc.isRecurring && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-0.5">
                            <Repeat className="w-3 h-3" />
                            <span>Recorrente</span>
                          </span>
                        </>
                      )}
                    </div>

                    {!isPeriodClosed && (
                      <button
                        type="button"
                        onClick={() => onDeleteIncome(inc.id)}
                        title="Remover entrada"
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
