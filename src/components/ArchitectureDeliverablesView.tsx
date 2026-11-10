/**
 * Copyright (c) 2026 Arthur Araujo and contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Copy, Check, Download, Database, ShieldCheck, Terminal } from 'lucide-react';
import {
  DRIZZLE_SCHEMA_CODE,
  ENV_AND_EXECUTION_GUIDE,
  POSTGRES_RLS_SQL_CODE,
} from '../data/architectureDocs';

type DocTab = 'drizzle' | 'sql_rls' | 'env_guide';

export const ArchitectureDeliverablesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DocTab>('drizzle');
  const [copied, setCopied] = useState(false);

  const getActiveContent = () => {
    if (activeTab === 'drizzle') return DRIZZLE_SCHEMA_CODE;
    if (activeTab === 'sql_rls') return POSTGRES_RLS_SQL_CODE;
    return ENV_AND_EXECUTION_GUIDE;
  };

  const getFilename = () => {
    if (activeTab === 'drizzle') return 'schema.ts';
    if (activeTab === 'sql_rls') return '0001_multi_tenant_rls.sql';
    return '.env.example';
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getActiveContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([getActiveContent()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getFilename();
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      aria-label="Arquitetura de Banco de Dados, Drizzle ORM e Políticas RLS"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden"
    >
      <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
            Especificação Técnica: PostgreSQL + Drizzle ORM + Row Level Security (RLS)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Esquema completo multi-tenant (`user_id` em todas as tabelas), constraints relacionais e instruções de execução.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Código</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="px-3.5 py-2 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar {getFilename()}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('drizzle')}
          className={`px-3.5 py-2 inline-flex items-center gap-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'drizzle'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>1. Drizzle ORM Schema (schema.ts)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sql_rls')}
          className={`px-3.5 py-2 inline-flex items-center gap-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'sql_rls'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>2. PostgreSQL DDL + Políticas RLS</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('env_guide')}
          className={`px-3.5 py-2 inline-flex items-center gap-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'env_guide'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>3. Variáveis .env & Instruções de Execução</span>
        </button>
      </div>

      {/* Code Viewer */}
      <div className="p-5 bg-slate-950 text-slate-100 overflow-x-auto max-h-[620px]">
        <pre className="text-xs font-mono leading-relaxed">
          <code>{getActiveContent()}</code>
        </pre>
      </div>
    </section>
  );
};
