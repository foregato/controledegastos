# FluxoCaixa Pro — Gestão Financeira Pessoal & Previsibilidade Mensal

Plataforma SaaS financeira B2C mobile-first e multi-colunas em desktop que substitui planilhas mensais estáticas por um motor vivo de previsibilidade de caixa, controle de contas fixas/parceladas, diário de microgastos e carteiras de benefícios isoladas (VR/VA) com transição automatizada entre ciclos mensais.

### User Review & Critical Decisions

> [!IMPORTANT]
> As decisões abaixo consolidam suas respostas da etapa de alinhamento e definem o comportamento exato do motor financeiro e da arquitetura de dados antes da implementação.

- **Acesso Imediato & Arquitetura de Banco (Confirmado)**: A aplicação iniciará imediatamente com persistência local reativa pré-populada com dados realistas do ciclo `11/2026` (permitindo testar cadastros, baixas e fechamento de mês sem fricção de login), acompanhada de um módulo inspecionável e exportável contendo o **Schema Drizzle ORM completo + SQL DDL PostgreSQL + Políticas RLS (Row Level Security)** prontos para produção.
- **Automação Completa no Fechamento de Mês (Confirmado)**: Ao acionar **"Encerrar Mês"**, o motor executará a transição atômica para o mês seguinte (`12/2026`):
  1. Calcula o `Saldo Operacional Real` final da conta corrente e o injeta como `Saldo Remanescente do Mês Anterior` no novo período.
  2. Clona todas as contas com `recorrente_mensal = true` com status resetado para `Pendente`.
  3. Avança automaticamente os parcelamentos ativos (`parcela_atual + 1` até `total_parcelas`), marcando a última parcela com o indicador contextual `"Última!"` e omitindo parcelamentos já concluídos.
  4. Transfere o saldo remanescente de cada carteira de benefício (Pluxee, Flash, VR) para o campo `saldo_mes_anterior` do ciclo seguinte.
- **Tema Adaptável Light / Dark (Confirmado)**: Interface com alternância instantânea entre **Modo Claro Editorial** (inspirado em ledgers financeiros de alta legibilidade) e **Modo Escuro Fintech** (ardósia profunda e contrastes em verde esmeralda), utilizando variáveis semânticas e `@custom-variant dark` no Tailwind CSS v4.

---

### 1. Overview & Core Concept

- **O Que Faz**: Centraliza a operação financeira mensal em torno de um seletor temporal (`MonthContext`), separando rigorosamente o caixa da conta corrente principal dos saldos de cartões de benefícios (VR/VA), e confrontando em tempo real o **Saldo Operacional Atual** (realizado) contra o **Saldo Projetado ao Fim do Mês** (previsibilidade).
- **Público-Alvo / Persona**: Profissionais e famílias que controlam o orçamento mensal em planilhas detalhadas e precisam de agilidade mobile para lançar microgastos diários, dar baixa em contas fixas, acompanhar parcelas a vencer e saber exatamente quanto sobrará no fim do mês.
- **Valor Principal**: Elimina o trabalho manual de duplicar abas de planilhas todo mês, evita erros de soma entre dinheiro livre em conta e saldo de vale-refeição, e oferece lançamento rápido focado em teclado numérico em menos de 3 segundos.

---

### 2. User Experience & Visual Design

- **Fluxos Principais do Usuário**:
  1. **Navegação Temporal e Diagnóstico Instantâneo**: No topo, o usuário alterna entre meses (`< Novembro 2026 >`), visualiza o status do período (`Aberto` ou `Encerrado`) e confere o indicador de **Saldo Projetado**. Logo abaixo, uma faixa de cartões executivos exibe: *Entradas Totais (Receita Nova + Rollover)*, *Despesas Previstas vs. Executadas*, *Saldo Operacional em Conta* e *Saldo Livre Projetado*.
  2. **Operação nas 4 Colunas / Abas Financeiras**:
     - **Coluna 1 — Contas Fixas & Parcelamentos**: Lista ordenada por vencimento com ação rápida de 1 clique para alternar status (`Pendente` → `Pago` → `Isento / Terceiros`), exibindo forma de pagamento (`Pix`, `Crédito`, `Boleto`, `Débito`, `Dinheiro`), progresso da parcela (`3/10` ou alerta `"Última!"`) e filtro rápido por status.
     - **Coluna 2 — Entradas & Receitas**: Destaque visual separado para o card de **Saldo Remanescente do Mês Anterior** (rollover automático) seguido pelas receitas novas do mês (`Salário`, `Freelas`, `Comissões`, `FGTS`, `Ajudas de Custo`) com confirmação de recebimento.
     - **Coluna 3 — Diário de Microgastos**: Feed cronológico agrupado por data com subtotalizador diário no cabeçalho de cada dia e divisão por categorias (`Alimentação/Comida`, `Mercado`, `Lazer`, `Gastos Pessoais/Outros`).
     - **Coluna 4 — Carteiras de Benefícios Isoladas**: Módulo independente para cartões como Pluxee/Sodexo/Flash, mostrando *Saldo Anterior + Recarga do Mês - Gastos no Benefício = Saldo Disponível no Cartão*, com lançamento dedicado de compras no voucher sem afetar a conta corrente.
  3. **Quick Action (Acesso Rápido Mobile-First)**: Botão de ação rápida sempre acessível na zona de alcance do polegar que abre uma gaveta/modal com foco imediato no valor numérico para: *Adicionar Gasto Diário*, *Registrar Entrada*, *Nova Conta Fixa/Parcelada* ou *Debitar do Vale-Benefício*.
  4. **Fechamento e Virada de Mês**: Modal de revisão de fechamento que apresenta o resumo de conciliação do mês atual (contas pagas, saldo transferível em conta, saldo transferível em benefícios e lista de contas/parcelas que serão geradas no próximo mês) antes de confirmar a transição.
  5. **Inspecionador de Arquitetura & Exportação SQL/Drizzle**: Gaveta técnica dedicada onde o usuário ou engenheiro pode copiar ou baixar o código completo do schema Drizzle ORM (`schema.ts`), a migration SQL PostgreSQL com políticas RLS e o módulo puro de cálculos.

- **Identidade Visual & Tema**:
  - *Direção Estética*: Utilitarismo refinado de alta precisão numérica (combinando a densidade limpa de um ledger financeiro no desktop `1440px` com a ergonomia tátil de um app mobile `375px–430px`).
  - *Regra de Cores 60-30-10 & Dual-Theme*:
    - **60% Canvas Neutro**: `bg-slate-50` no modo claro e `dark:bg-slate-950` no modo escuro.
    - **30% Superfícies Estruturais**: Cartões planos de elevação única (`bg-white dark:bg-slate-900`) delimitados por divisórias sutis de `1px` (`border-slate-200 dark:border-slate-800`), sem aninhamento de cartões dentro de cartões e sem barras laterais grossas coloridas.
    - **10% Orçamento de Acento Semântico**: Esmeralda (`#10B981` / `emerald-600`) para receitas, saldos positivos e ações primárias; Âmbar (`#D97706` / `amber-600`) para contas pendentes próximas do vencimento; Carmesim (`#E11D48` / `rose-600`) para vencidos ou projeção negativa; Índigo (`#4F46E5`) para carteiras de benefícios isoladas.
  - *Tipografia & Disciplina Tabular*:
    - **Display & Títulos**: `Plus Jakarta Sans` (pesos 600/700, `tracking-tight`) para cabeçalhos e valores principais.
    - **Corpo & Interface**: `DM Sans` (pesos 400/500) para leitura rápida de descrições e categorias.
    - **Valores Monetários, Datas e Parcelas**: `JetBrains Mono` com `font-variant-numeric: tabular-nums` obrigatório em todos os valores em `R$`, contadores de parcelas (`04/12`) e datas (`10/11`), garantindo alinhamento vertical perfeito das casas decimais.
  - *Zero-Pill Discipline & Ergonomia Mobile*:
    - Metadados informativos (forma de pagamento, data, origem, categoria) são exibidos como texto limpo separado por pontos tipográficos (`Pix · Vence 15/11 · Parcela 4/6`), reservando botões segmentados apenas para controles interativos de filtro e status.
    - Todos os alvos de toque possuem área mínima de `44x44px` na visualização mobile, respeitando o limite máximo de 15% de altura de tela para elementos fixos.

---

### 3. Key Product Decisions & Trade-Offs

- **Decisão 1: Motor de Cálculo Financeiro em Funções Puras Determinísticas**
  - *Abordagem Escolhida*: Isolar toda a matemática de saldos (`calculateMonthlySummary`, `calculateBenefitWalletSummary`, `computeMonthRolloverPayload`) em um módulo puro e sem efeitos colaterais, consumido tanto pela interface quanto pelo fechamento de mês.
  - *Por Quê*: Garante zero divergência entre o número exibido nos cards de resumo, as barras de execução orçamentária e o valor transferido ao encerrar o mês, além de tratar valores em centavos/arredondamento monetário de forma segura.
- **Decisão 2: Tratamento de Contas Isentas ("Mãe Pagou / Terceiros") no Cálculo de Caixa**
  - *Abordagem Escolhida*: Quando uma conta fixa tem status `exempt` (`Isento / Terceiros`), ela permanece visível no histórico do mês para controle patrimonial, mas seu valor é abatido da necessidade de desembolso do `Saldo Operacional Atual` e do `Saldo Projetado`, evitando distorcer o caixa livre do usuário.
  - *Por Quê*: Reflete fielmente a prática real das planilhas mensais onde uma conta foi quitada por um familiar ou reembolsada sem sair do saldo bancário próprio.
- **Decisão 3: Isolamento Estrito entre Conta Corrente e Benefícios (VR/VA)**
  - *Abordagem Escolhida*: Gastos lançados na carteira de benefícios reduzem exclusivamente o saldo do respectivo voucher (`benefit_wallets`), nunca o `Saldo Operacional Atual` da conta bancária.
  - *Por Quê*: Impede a falsa sensação de liquidez (achar que há dinheiro para pagar um boleto quando parte do saldo está travada em vale-refeição).

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Arquitetura do Sistema e Hierarquia de Componentes**:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      TOP BAR & TEMPORAL CONTEXT HEADER                        │
│  [FluxoCaixa Pro]   [Visão Geral · Lançamentos · Benefícios · Schema SQL]    │
│  [< Novembro 2026 >] · Status: Aberto · [Tema Claro/Escuro] · [Encerrar Mês] │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                  PURE FINANCIAL CALCULATION ENGINE (TS)                      │
│  • Total Previsto vs Executado      • Saldo Operacional Atual (Realizado)    │
│  • Saldo Projetado Fim do Mês       • Isolamento de Carteiras (VR/VA)        │
│  • Gerador Automático de Rollover (Clonagem + Avanço de Parcelas + Saldos)   │
└───────────────┬──────────────────────────────────────────────┬───────────────┘
                │                                              │
                ▼                                              ▼
┌───────────────────────────────────────────┐  ┌───────────────────────────────┐
│      EXECUTIVE PREDICTABILITY STRIP       │  │   QUICK ACTION SHEET / MODAL  │
│  • Card 1: Entradas (Rollover + Novas)    │  │  • Input Numérico Instantâneo │
│  • Card 2: Saídas (Fixas + Microgastos)   │  │  • Abas: Microgasto | Entrada │
│  • Card 3: Saldo Operacional em Conta     │  │          Conta Fixa | Voucher │
│  • Card 4: Saldo Livre Projetado (Fim)    │  └───────────────┬───────────────┘
└───────────────┬───────────────────────────┘                  │
                │                                              │ Mutates
                ▼                                              ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│           RESPONSIVE 4-COLUMN WORKSPACE (TABS ON MOBILE / GRID ON LG)        │
├──────────────────┬──────────────────┬───────────────────┬────────────────────┤
│ 1. CONTAS FIXAS  │ 2. ENTRADAS      │ 3. DIÁRIO GASTOS  │ 4. BENEFÍCIOS (VR) │
│ • Toggle 1-Click │ • Card Rollover  │ • Agrupado p/ Dia │ • Pluxee / Flash   │
│   (Pago/Pendente │   Mês Anterior   │ • Subtotal Diário │ • Saldo Anterior + │
│   /Terceiros)    │ • Lista Receitas │ • Filtro Rápido   │   Recarga - Gastos │
│ • Badge Parcelas │   Confirmadas vs │   por Categoria   │ • Extrato e Recarga│
│   (3/10, Última!)│   Pendentes      │   (Mercado, etc.) │   Independentes    │
└──────────────────┴──────────────────┴───────────────────┴────────────────────┘
```

- **Modelo de Dados Multi-Tenant (PostgreSQL / Drizzle ORM & Estado Reativo)**:
  - `users`: Identificador do tenant (`id`, `email`, `full_name`, `currency_code` padrão `'BRL'`, `theme_preference`).
  - `monthly_periods`: Ciclo mensal (`id`, `user_id`, `month`, `year`, `starting_balance`, `status` `'open' | 'closed'`, `closed_at`). Constraint única por `(user_id, year, month)`.
  - `incomes`: Entradas do período (`id`, `user_id`, `period_id`, `description`, `category`, `amount`, `received_date`, `origin`, `is_confirmed`, `is_recurring`).
  - `fixed_expenses`: Compromissos fixos e parcelados (`id`, `user_id`, `period_id`, `title`, `amount`, `payment_method` `'pix' | 'credit' | 'debit' | 'boleto' | 'cash'`, `due_day`, `payment_status` `'pending' | 'paid' | 'exempt'`, `paid_by_note`, `current_installment`, `total_installments`, `is_recurring`, `parent_expense_id`).
  - `daily_expenses`: Microgastos variáveis (`id`, `user_id`, `period_id`, `description`, `amount`, `expense_date`, `category` `'food' | 'groceries' | 'leisure' | 'personal'`).
  - `benefit_wallets` & `benefit_transactions`: Carteiras isoladas (`id`, `user_id`, `period_id`, `provider_name`, `previous_balance`, `monthly_credit`) e seus lançamentos dedicados (`id`, `wallet_id`, `description`, `amount`, `transaction_date`).

- **Mapeamento Interativo de Componentes e Estados**:
  - **Seletor Temporal (`MonthSelector`)**: Permite navegar entre meses existentes (ex.: `Outubro 2026` encerrado, `Novembro 2026` aberto) ou criar/inspecionar períodos futuros; bloqueia edições acidentais em meses encerrados com opção explícita de `"Reabrir Mês"` caso o usuário precise ajustar um lançamento retroativo.
  - **Lista de Contas (`FixedExpensesColumn`)**: Clique direto no botão de status alterna entre `Pendente`, `Pago` e `Isento (Terceiros)` recalculando instantaneamente o `Saldo Operacional Atual`; inclui filtros segmentados (`Todas`, `Pendentes`, `Pagas`, `Parceladas`) e exclusão/edição inline.
  - **Diário de Microgastos (`DailyExpensesColumn`)**: Filtro por categoria (`Todas`, `Alimentação`, `Mercado`, `Lazer`, `Pessoais`), busca textual instantânea e agrupamento automático por data com soma diária em fonte tabular.
  - **Carteiras de Benefícios (`BenefitWalletsColumn`)**: Permite alternar entre múltiplos cartões (ex.: *Pluxee Refeição* e *Flash Alimentação*), registrar nova recarga ou debitar compra diretamente no voucher selecionado.
  - **Fluxo de Fechamento (`CloseMonthModal`)**: Calcula e exibe o preview exato da transição antes da confirmação; ao confirmar, marca o mês atual como `closed`, gera o registro do mês seguinte (ou atualiza se já existir) e navega automaticamente para o novo ciclo mensal recém-criado.
