import React, { useState } from 'react';
import {
  Utensils,
  ShoppingCart,
  Sparkles,
  User,
  Plus,
  Trash2,
  Search,
} from 'lucide-react';
import { DailyExpense, DailyExpenseCategory } from '../types/finance';
import {
  formatCurrencyBRL,
  formatShortDate,
  groupDailyExpensesByDate,
} from '../lib/financialEngine';

interface DailyExpensesColumnProps {
  expenses: DailyExpense[];
  isPeriodClosed: boolean;
  onDeleteDailyExpense: (id: string) => void;
  onOpenAddDaily: () => void;
}

export const CATEGORY_META: Record<
  DailyExpenseCategory,
  {
    label: string;
    shortLabel: string;
    icon: React.FC<{ className?: string }>;
    textColor: string;
    bgColor: string;
  }
> = {
  food: {
    label: 'Alimentação / Comida',
    shortLabel: 'Comida',
    icon: Utensils,
    textColor: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
  groceries: {
    label: 'Mercado',
    shortLabel: 'Mercado',
    icon: ShoppingCart,
    textColor: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  leisure: {
    label: 'Lazer',
    shortLabel: 'Lazer',
    icon: Sparkles,
    textColor: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-500/10',
  },
  personal: {
    label: 'Gastos Pessoais / Outros',
    shortLabel: 'Pessoais',
    icon: User,
    textColor: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-500/10',
  },
};

export const DailyExpensesColumn: React.FC<DailyExpensesColumnProps> = ({
  expenses,
  isPeriodClosed,
  onDeleteDailyExpense,
  onOpenAddDaily,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<
    DailyExpenseCategory | 'all'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExpenses = expenses.filter((exp) => {
    const matchesCategory =
      selectedCategory === 'all' || exp.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      exp.description.toLowerCase().includes(searchQuery.trim().toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const groupedByDate = groupDailyExpensesByDate(filteredExpenses);
  const totalFiltered = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col h-full">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
              03. Diário de Microgastos
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
              Acumulado: {formatCurrencyBRL(totalFiltered)} ({filteredExpenses.length} itens)
            </p>
          </div>

          {!isPeriodClosed && (
            <button
              type="button"
              onClick={onOpenAddDaily}
              className="min-h-[38px] px-3 py-1.5 inline-flex items-center gap-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gasto</span>
            </button>
          )}
        </div>

        {/* Category Filter Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-lg overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`py-1.5 px-2.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Todos
          </button>
          {(Object.keys(CATEGORY_META) as DailyExpenseCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`py-1.5 px-2.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {CATEGORY_META[cat].shortLabel}
            </button>
          ))}
        </div>

        {/* Quick Search */}
        <div className="mt-2.5 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar microgastos por descrição..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Grouped Feed by Date */}
      <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800/80">
        {groupedByDate.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              Nenhum microgasto diário encontrado.
            </p>
            {!isPeriodClosed && (
              <button
                type="button"
                onClick={onOpenAddDaily}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer"
              >
                Lançar Gasto Diário
              </button>
            )}
          </div>
        ) : (
          groupedByDate.map((group) => (
            <div key={group.date}>
              {/* Daily Group Header with Subtotal */}
              <div className="px-4 py-2 bg-slate-50/90 dark:bg-slate-800/40 flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-800/60">
                <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono tabular-nums">
                  Dia {formatShortDate(group.date, true)}
                </span>
                <span className="font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                  Subtotal: {formatCurrencyBRL(group.totalDay)}
                </span>
              </div>

              {/* Items for that day */}
              <div className="divide-y divide-slate-100/70 dark:divide-slate-800/50">
                {group.items.map((item) => {
                  const meta = CATEGORY_META[item.category];
                  const IconComp = meta.icon;
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 sm:px-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors flex items-start gap-3"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.bgColor} ${meta.textColor}`}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug">
                            {item.description}
                          </span>
                          <span className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0">
                            -{formatCurrencyBRL(item.amount)}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <span className={meta.textColor}>{meta.shortLabel}</span>
                            {item.paymentMethod && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="uppercase text-[11px]">
                                  {item.paymentMethod}
                                </span>
                              </>
                            )}
                          </div>

                          {!isPeriodClosed && (
                            <button
                              type="button"
                              onClick={() => onDeleteDailyExpense(item.id)}
                              title="Excluir microgasto"
                              className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
