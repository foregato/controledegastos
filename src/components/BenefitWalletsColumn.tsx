/**
 * Copyright (c) 2026 Arthur Araujo and contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { BenefitWallet } from '../types/finance';
import {
  calculateBenefitWalletSummary,
  formatCurrencyBRL,
  formatShortDate,
} from '../lib/financialEngine';

interface BenefitWalletsColumnProps {
  wallets: BenefitWallet[];
  isPeriodClosed: boolean;
  onAddBenefitTransaction: (
    walletId: string,
    description: string,
    amount: number,
    date: string
  ) => void;
  onDeleteBenefitTransaction: (walletId: string, txId: string) => void;
  onUpdateWalletCredits: (
    walletId: string,
    previousBalance: number,
    monthlyCredit: number
  ) => void;
  onAddNewWallet: (
    providerName: string,
    cardType: 'VR' | 'VA' | 'Flex',
    previousBalance: number,
    monthlyCredit: number
  ) => void;
}

export const BenefitWalletsColumn: React.FC<BenefitWalletsColumnProps> = ({
  wallets,
  isPeriodClosed,
  onAddBenefitTransaction,
  onDeleteBenefitTransaction,
  onUpdateWalletCredits,
  onAddNewWallet,
}) => {
  const [selectedWalletId, setSelectedWalletId] = useState<string>(
    wallets[0]?.id || ''
  );
  const [isAddingTx, setIsAddingTx] = useState(false);
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [txDate, setTxDate] = useState('2026-11-10');

  const [isEditingCredits, setIsEditingCredits] = useState(false);
  const [prevBalInput, setPrevBalInput] = useState('');
  const [monthlyCreditInput, setMonthlyCreditInput] = useState('');

  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [newProvider, setNewProvider] = useState('');
  const [newCardType, setNewCardType] = useState<'VR' | 'VA' | 'Flex'>('VR');
  const [newCredit, setNewCredit] = useState('800');

  const activeWallet =
    wallets.find((w) => w.id === selectedWalletId) || wallets[0] || null;

  const summary = activeWallet
    ? calculateBenefitWalletSummary(activeWallet)
    : null;

  const handleSubmitTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWallet) return;
    const parsed = parseFloat(txAmount.replace(',', '.'));
    if (Number.isNaN(parsed) || parsed <= 0 || !txDesc.trim()) return;

    onAddBenefitTransaction(activeWallet.id, txDesc.trim(), parsed, txDate);
    setTxAmount('');
    setTxDesc('');
    setIsAddingTx(false);
  };

  const handleSaveCredits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWallet) return;
    const prev = parseFloat(prevBalInput.replace(',', '.')) || 0;
    const cred = parseFloat(monthlyCreditInput.replace(',', '.')) || 0;
    onUpdateWalletCredits(activeWallet.id, prev, cred);
    setIsEditingCredits(false);
  };

  const handleCreateWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProvider.trim()) return;
    const cred = parseFloat(newCredit.replace(',', '.')) || 0;
    onAddNewWallet(newProvider.trim(), newCardType, 0, cred);
    setNewProvider('');
    setIsCreatingWallet(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col h-full">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
              04. Benefícios & Vouchers
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Saldos isolados da conta corrente
            </p>
          </div>

          {!isPeriodClosed && (
            <button
              type="button"
              onClick={() => setIsCreatingWallet(!isCreatingWallet)}
              className="min-h-[38px] px-3 py-1.5 inline-flex items-center gap-1 text-xs font-semibold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cartão</span>
            </button>
          )}
        </div>

        {/* New Wallet Form */}
        {isCreatingWallet && !isPeriodClosed && (
          <form
            onSubmit={handleCreateWallet}
            className="mb-3 p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5"
          >
            <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
              Novo Cartão de Benefício (Pluxee, VR, Flash, Caju)
            </span>
            <input
              type="text"
              required
              value={newProvider}
              onChange={(e) => setNewProvider(e.target.value)}
              placeholder="Nome (ex: Caju Multibenefícios)"
              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
            />
            <div className="flex items-center gap-2">
              <select
                value={newCardType}
                onChange={(e) =>
                  setNewCardType(e.target.value as 'VR' | 'VA' | 'Flex')
                }
                className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              >
                <option value="VR">VR (Refeição)</option>
                <option value="VA">VA (Alimentação)</option>
                <option value="Flex">Flex</option>
              </select>
              <input
                type="number"
                step="0.01"
                value={newCredit}
                onChange={(e) => setNewCredit(e.target.value)}
                placeholder="Recarga Mensal (R$)"
                className="flex-1 min-w-0 px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md cursor-pointer"
              >
                Criar
              </button>
            </div>
          </form>
        )}

        {/* Wallet Selector Tabs */}
        {wallets.length > 0 && (
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-lg overflow-x-auto">
            {wallets.map((w) => {
              const isSelected = activeWallet?.id === w.id;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setSelectedWalletId(w.id)}
                  className={`flex-1 py-1.5 px-2.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {w.providerName.split(' ')[0]} ({w.cardType})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Wallet Visual Card + Dedicated Transactions */}
      {activeWallet && summary ? (
        <div className="flex-1 flex flex-col">
          {/* Voucher Card */}
          <div className="p-4 bg-slate-900 text-white border-b border-slate-800">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-200">
                  {activeWallet.providerName} · {activeWallet.cardType}
                </span>
              </div>
              {!isPeriodClosed && (
                <button
                  type="button"
                  onClick={() => {
                    setPrevBalInput(String(activeWallet.previousBalance));
                    setMonthlyCreditInput(String(activeWallet.monthlyCredit));
                    setIsEditingCredits(!isEditingCredits);
                  }}
                  title="Editar recarga do mês ou saldo anterior do benefício"
                  className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Recarga</span>
                </button>
              )}
            </div>

            <div className="flex items-baseline justify-between gap-2 mt-1">
              <div>
                <span className="block text-[11px] text-slate-400">
                  Saldo Restante no Cartão
                </span>
                <span className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
                  {formatCurrencyBRL(summary.remainingBalance)}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-[11px] text-slate-400">
                  Gasto no Mês ({summary.usagePercentage}%)
                </span>
                <span className="text-sm font-semibold font-mono tabular-nums text-slate-200">
                  -{formatCurrencyBRL(summary.totalSpent)}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-indigo-400 transition-all duration-300"
                style={{ width: `${summary.usagePercentage}%` }}
              />
            </div>

            {/* Breakdown of Benefit Credits */}
            <div className="mt-3 pt-2.5 border-t border-slate-800/90 flex items-center justify-between text-xs text-slate-300 font-mono tabular-nums">
              <span>Anterior: {formatCurrencyBRL(summary.previousBalance)}</span>
              <span>+ Recarga: {formatCurrencyBRL(summary.monthlyCredit)}</span>
              <span>= Total: {formatCurrencyBRL(summary.totalAvailable)}</span>
            </div>

            {/* Edit Credits Form */}
            {isEditingCredits && !isPeriodClosed && (
              <form
                onSubmit={handleSaveCredits}
                className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2"
              >
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">
                    Saldo Anterior (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={prevBalInput}
                    onChange={(e) => setPrevBalInput(e.target.value)}
                    className="w-full px-2 py-1 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">
                    Crédito do Mês (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={monthlyCreditInput}
                    onChange={(e) => setMonthlyCreditInput(e.target.value)}
                    className="w-full px-2 py-1 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="col-span-2 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded cursor-pointer"
                >
                  Atualizar Saldos do Cartão
                </button>
              </form>
            )}
          </div>

          {/* Quick Debit Trigger */}
          {!isPeriodClosed && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddingTx(!isAddingTx)}
                className="w-full py-2 px-3 flex items-center justify-between text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/15 rounded-lg transition-colors cursor-pointer"
              >
                <span>+ Debitar Compra neste Benefício</span>
                {isAddingTx ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {isAddingTx && (
                <form onSubmit={handleSubmitTx} className="mt-2.5 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      placeholder="Valor R$ (ex: 45.90)"
                      className="px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100"
                    />
                    <input
                      type="date"
                      required
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      className="px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={txDesc}
                      onChange={(e) => setTxDesc(e.target.value)}
                      placeholder="Estabelecimento / Compra..."
                      className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md whitespace-nowrap cursor-pointer"
                    >
                      Lançar
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Transactions Feed */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 flex-1">
            {activeWallet.transactions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                Nenhuma compra debitada neste cartão no mês.
              </div>
            ) : (
              [...activeWallet.transactions]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 sm:px-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="block text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {tx.description}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                        <span>{formatShortDate(tx.date)}</span>
                        {tx.merchantCategory && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-sans">{tx.merchantCategory}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                        -{formatCurrencyBRL(tx.amount)}
                      </span>
                      {!isPeriodClosed && (
                        <button
                          type="button"
                          onClick={() =>
                            onDeleteBenefitTransaction(activeWallet.id, tx.id)
                          }
                          title="Excluir débito do benefício"
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-sm text-slate-500">
          Nenhum cartão de benefício cadastrado.
        </div>
      )}
    </div>
  );
};
