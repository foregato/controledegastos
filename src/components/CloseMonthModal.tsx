import React from 'react';
import {
  X,
  ArrowRightCircle,
  CheckCircle2,
  Repeat,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { MonthRolloverPreview } from '../types/finance';
import { formatCurrencyBRL, formatPeriodLabel } from '../lib/financialEngine';

interface CloseMonthModalProps {
  isOpen: boolean;
  preview: MonthRolloverPreview;
  onClose: () => void;
  onConfirmCloseAndRollover: () => void;
}

export const CloseMonthModal: React.FC<CloseMonthModalProps> = ({
  isOpen,
  preview,
  onClose,
  onConfirmCloseAndRollover,
}) => {
  if (!isOpen) return null;

  const sourceLabel = formatPeriodLabel(
    preview.sourcePeriod.month,
    preview.sourcePeriod.year
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Automação de Fechamento de Mês"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
              Encerrar {sourceLabel} & Abrir {preview.targetPeriodLabel}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Conciliação automática de saldo remanescente, avanço de parcelas e benefícios
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* 1. Rollover Balance Box */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-400 block">
                1. Saldo Operacional Transferível (Rollover Conta Corrente)
              </span>
              <span className="text-xs text-slate-300 mt-0.5 block">
                Será injetado como <strong className="text-white">Saldo do Mês Anterior</strong> em{' '}
                {preview.targetPeriodLabel}
              </span>
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 shrink-0">
              {formatCurrencyBRL(preview.transferableOperationalBalance)}
            </div>
          </div>

          {/* 2. Recurring Incomes & Fixed Expenses / Installments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2.5">
                <Repeat className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  2. Contas Fixas & Parcelas para {preview.targetPeriodLabel} (
                  {preview.fixedExpensesToClone.length})
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 max-h-44 overflow-y-auto pr-1">
                {preview.fixedExpensesToClone.map((item) => (
                  <li
                    key={item.original.id}
                    className="flex items-center justify-between gap-2 py-1 border-b border-slate-200/60 dark:border-slate-700/50 last:border-0"
                  >
                    <span className="truncate">
                      {item.original.title}
                      {item.nextInstallment && item.totalInstallments && (
                        <strong className="ml-1 font-mono text-amber-600 dark:text-amber-400">
                          ({item.nextInstallment}/{item.totalInstallments}
                          {item.isLastInstallment ? ' · Última!' : ''})
                        </strong>
                      )}
                    </span>
                    <span className="font-mono tabular-nums font-medium shrink-0">
                      {formatCurrencyBRL(item.original.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              {/* Completed Installments that retire */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>
                    Parcelamentos Concluídos ({preview.completedInstallmentsExcluded.length})
                  </span>
                </div>
                {preview.completedInstallmentsExcluded.length === 0 ? (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Nenhum parcelamento encerra neste ciclo.
                  </p>
                ) : (
                  <ul className="space-y-1 text-xs text-emerald-900 dark:text-emerald-200">
                    {preview.completedInstallmentsExcluded.map((done) => (
                      <li
                        key={done.id}
                        className="flex items-center justify-between font-mono tabular-nums"
                      >
                        <span className="font-sans truncate">
                          {done.title} ({done.currentInstallment}/{done.totalInstallments})
                        </span>
                        <span>Libera +{formatCurrencyBRL(done.amount)}/mês</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Benefit Wallets Rollover */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  <CreditCard className="w-4 h-4 text-indigo-500" />
                  <span>3. Rollover de Carteiras VR/VA Isoladas</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {preview.benefitWalletsRollover.map((w, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between font-mono tabular-nums"
                    >
                      <span className="font-sans truncate">{w.providerName}:</span>
                      <span>
                        Transfere {formatCurrencyBRL(w.remainingBalanceToTransfer)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Voltar ao Mês Atual
          </button>

          <button
            type="button"
            onClick={onConfirmCloseAndRollover}
            className="px-5 py-2.5 inline-flex items-center gap-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar Fechamento & Gerar {preview.targetPeriodLabel}</span>
            <ArrowRightCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
