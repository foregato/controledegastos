import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  UserCheck,
  Plus,
  Trash2,
  Repeat,
} from 'lucide-react';
import { FixedExpense, PaymentMethod, PaymentStatus } from '../types/finance';
import {
  formatCurrencyBRL,
  formatShortDate,
  isFinalInstallment,
} from '../lib/financialEngine';

interface FixedExpensesColumnProps {
  expenses: FixedExpense[];
  isPeriodClosed: boolean;
  onCycleStatus: (expenseId: string) => void;
  onSetStatus: (expenseId: string, status: PaymentStatus, note?: string) => void;
  onDeleteExpense: (expenseId: string) => void;
  onOpenAddFixed: () => void;
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'Pix',
  credit: 'Crédito',
  debit: 'Débito',
  boleto: 'Boleto',
  cash: 'Dinheiro',
};

type FilterTab = 'all' | 'pending' | 'paid' | 'installments';

export const FixedExpensesColumn: React.FC<FixedExpensesColumnProps> = ({
  expenses,
  isPeriodClosed,
  onCycleStatus,
  onSetStatus,
  onDeleteExpense,
  onOpenAddFixed,
}) => {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [editingExemptId, setEditingExemptId] = useState<string | null>(null);
  const [exemptNoteInput, setExemptNoteInput] = useState<string>('Mãe Pagou');

  const sortedExpenses = [...expenses].sort((a, b) =>
    a.dueDate.localeCompare(b.dueDate)
  );

  const filteredExpenses = sortedExpenses.filter((item) => {
    if (filter === 'pending') return item.paymentStatus === 'pending';
    if (filter === 'paid') return item.paymentStatus === 'paid' || item.paymentStatus === 'exempt';
    if (filter === 'installments') return Boolean(item.totalInstallments && item.totalInstallments > 1);
    return true;
  });

  const totalPending = sortedExpenses
    .filter((e) => e.paymentStatus === 'pending')
    .reduce((acc, e) => acc + e.amount, 0);

  const totalPaid = sortedExpenses
    .filter((e) => e.paymentStatus === 'paid')
    .reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col h-full">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
              01. Contas & Parcelas
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
              Pago: {formatCurrencyBRL(totalPaid)} · Falta: {formatCurrencyBRL(totalPending)}
            </p>
          </div>
          {!isPeriodClosed && (
            <button
              type="button"
              onClick={onOpenAddFixed}
              className="min-h-[38px] px-3 py-1.5 inline-flex items-center gap-1 text-xs font-semibold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Conta</span>
            </button>
          )}
        </div>

        {/* Interactive Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-lg">
          {(
            [
              { id: 'all', label: 'Todas' },
              { id: 'pending', label: 'Pendentes' },
              { id: 'paid', label: 'Quitadas' },
              { id: 'installments', label: 'Parceladas' },
            ] as Array<{ id: FilterTab; label: string }>
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filter === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/80 flex-1">
        {filteredExpenses.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              Nenhuma conta encontrada neste filtro.
            </p>
            {!isPeriodClosed && (
              <button
                type="button"
                onClick={onOpenAddFixed}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer"
              >
                Cadastrar Conta Fixa ou Parcelada
              </button>
            )}
          </div>
        ) : (
          filteredExpenses.map((item) => {
            const isPaid = item.paymentStatus === 'paid';
            const isExempt = item.paymentStatus === 'exempt';
            const isLast = isFinalInstallment(item);
            const hasInstallments =
              Boolean(item.currentInstallment) && Boolean(item.totalInstallments);

            return (
              <div
                key={item.id}
                className={`p-3.5 sm:px-4 transition-colors ${
                  isPaid || isExempt
                    ? 'bg-slate-50/60 dark:bg-slate-900/40'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* 44x44px Interactive Status Toggle Hitbox */}
                  <button
                    type="button"
                    disabled={isPeriodClosed}
                    onClick={() => onCycleStatus(item.id)}
                    title={
                      isPeriodClosed
                        ? 'Mês encerrado'
                        : 'Clique para alternar: Pendente → Pago → Isento/Terceiros'
                    }
                    className={`min-w-[40px] min-h-[40px] -ml-1 flex items-center justify-center rounded-xl transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed ${
                      isPaid
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                        : isExempt
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10'
                        : 'text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-emerald-500/15 hover:text-emerald-600'
                    }`}
                  >
                    {isPaid ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isExempt ? (
                      <UserCheck className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-sm font-semibold leading-snug ${
                          isPaid
                            ? 'line-through text-slate-500 dark:text-slate-400'
                            : isExempt
                            ? 'text-slate-600 dark:text-slate-300'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {item.title}
                      </span>

                      <span
                        className={`text-sm font-bold font-mono tabular-nums whitespace-nowrap shrink-0 ${
                          isPaid
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isExempt
                            ? 'line-through text-indigo-500 dark:text-indigo-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {formatCurrencyBRL(item.amount)}
                      </span>
                    </div>

                    {/* Clean Unboxed Metadata with · separators */}
                    <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono tabular-nums">
                        Vence {formatShortDate(item.dueDate)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{PAYMENT_METHOD_LABELS[item.paymentMethod]}</span>

                      {hasInstallments && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums font-medium text-slate-700 dark:text-slate-300">
                            Parcela {item.currentInstallment}/{item.totalInstallments}
                          </span>
                        </>
                      )}

                      {isLast && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-amber-600 dark:text-amber-400">
                            Última!
                          </span>
                        </>
                      )}

                      {item.isRecurring && !hasInstallments && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-0.5 text-slate-500 dark:text-slate-400">
                            <Repeat className="w-3 h-3" />
                            <span>Fixa</span>
                          </span>
                        </>
                      )}
                    </div>

                    {/* Status row + Quick Third-Party / Exempt Action */}
                    <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${
                            isPaid
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isExempt
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {isPaid
                            ? 'Pago'
                            : isExempt
                            ? `Isento (${item.contextualNote || 'Mãe Pagou'})`
                            : 'Pendente'}
                        </span>

                        {!isPeriodClosed && !isExempt && (
                          <>
                            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                              ·
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingExemptId(
                                  editingExemptId === item.id ? null : item.id
                                );
                                setExemptNoteInput(item.contextualNote || 'Mãe Pagou');
                              }}
                              className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                            >
                              Terceiros pagou?
                            </button>
                          </>
                        )}
                      </div>

                      {!isPeriodClosed && (
                        <button
                          type="button"
                          onClick={() => onDeleteExpense(item.id)}
                          title="Remover conta"
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Inline contextual note editor for "Mãe Pagou / Isento" */}
                    {editingExemptId === item.id && !isPeriodClosed && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                        <input
                          type="text"
                          value={exemptNoteInput}
                          onChange={(e) => setExemptNoteInput(e.target.value)}
                          placeholder="Ex: Mãe Pagou, Empresa Reembolsou"
                          className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            onSetStatus(
                              item.id,
                              'exempt',
                              exemptNoteInput.trim() || 'Mãe Pagou'
                            );
                            setEditingExemptId(null);
                          }}
                          className="px-2.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md whitespace-nowrap cursor-pointer"
                        >
                          Salvar Isenção
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
