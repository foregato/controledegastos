/**
 * Copyright (c) 2026 Arthur Araujo and contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Plus } from 'lucide-react';

export type ActiveNavSection = 'overview' | 'ledger' | 'benefits' | 'architecture';

interface TopBarProps {
  activeSection: ActiveNavSection;
  onSelectSection: (section: ActiveNavSection) => void;
  onOpenQuickAction: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeSection,
  onSelectSection,
  onOpenQuickAction,
}) => {
  const navItems: Array<{ id: ActiveNavSection; label: string }> = [
    { id: 'overview', label: 'Painel Mensal' },
    { id: 'ledger', label: 'Quadro 4 Pilares' },
    { id: 'benefits', label: 'Carteiras VR/VA' },
    { id: 'architecture', label: 'Schema & SQL' },
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 h-14 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#top"
        onClick={(e) => {
          e.preventDefault();
          onSelectSection('overview');
        }}
        className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 font-display"
      >
        FluxoCaixa Pro
      </a>

      {/* Zone 2: 4 concise single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSection(item.id)}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                isActive
                  ? 'border-emerald-600 dark:border-emerald-400 text-slate-900 dark:text-slate-100 font-semibold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onOpenQuickAction}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] rounded-lg transition-all whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Lançamento Rápido</span>
        </button>
      </div>
    </header>
  );
};
