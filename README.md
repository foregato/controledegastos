# FluxoCaixa Pro — Gestão Financeira Pessoal & Previsibilidade Mensal

[![License](https://img.shields.io/badge/License-Apache_2.0-emerald.svg)](./LICENSE)
[![OSI Approved](https://img.shields.io/badge/OSI-Approved_Open_Source-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178C6.svg)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)

**FluxoCaixa Pro** é uma plataforma SaaS Open Source, mobile-first e multi-colunas em desktop para **Gestão Financeira Pessoal e Previsibilidade Mensal de Caixa**, projetada para substituir e evoluir o controle financeiro tradicional em planilhas mensais.

---

## Sumário

1. [Visão Geral e os 5 Pilares de Domínio](#1-visão-geral-e-os-5-pilares-de-domínio)
2. [Fórmulas do Motor de Previsibilidade Financeira](#2-fórmulas-do-motor-de-previsibilidade-financeira)
3. [Arquitetura e Stack Tecnológica](#3-arquitetura-e-stack-tecnológica)
4. [Esquema de Banco de Dados (PostgreSQL + Drizzle ORM + RLS)](#4-esquema-de-banco-de-dados-postgresql--drizzle-orm--rls)
5. [Instalação e Execução Local](#5-instalação-e-execução-local)
6. [Governança Open Source, Licença e Aviso Legal](#6-governança-open-source-licença-e-aviso-legal)

---

## 1. Visão Geral e os 5 Pilares de Domínio

O sistema opera em ciclos mensais (`MonthContext`: ex.: `11/2026`) com transição contínua de caixa (rollover automatizado) estruturado em 5 pilares fundamentais:

1. **Contas Fixas, Recorrentes e Parcelamentos (`fixed_expenses`)**:
   - Controle de vencimento, forma de pagamento (`Pix`, `Crédito`, `Débito`, `Boleto`, `Dinheiro`), status (`Pendente`, `Pago`, `Isento / Terceiros`), progresso de parcelas (`parcela_atual` / `total_parcelas`) e alerta automático de parcela final (`"Última!"`).
   - Suporte a despesas assumidas por terceiros (ex.: `"Mãe Pagou"`), preservando o histórico sem distorcer o caixa operacional próprio.
2. **Entradas, Receitas e Rollover (`incomes` + `starting_balance`)**:
   - Distinção explícita entre **Saldo Remanescente do Mês Anterior** (rollover cumulativo) e **Receitas Novas do Mês** (`Salário`, `FGTS`, `Freelas`, `Comissões`, `Ajudas de Custo`).
3. **Diário de Microgastos Categorizados (`daily_expenses`)**:
   - Lançamentos rápidos do dia a dia agrupados cronologicamente com subtotalizador diário e categorização em `Alimentação/Comida`, `Mercado`, `Lazer` e `Gastos Pessoais/Outros`.
4. **Carteiras de Benefícios / Vouchers Isolados (`benefit_wallets`)**:
   - Módulo separado para cartões como Pluxee/Sodexo, Flash e VR (`Saldo Anterior + Recarga do Mês - Gastos Dedicados = Saldo Restante no Cartão`), sem misturar com o saldo da conta corrente.
5. **Automação de Fechamento de Mês (`Rollover Engine`)**:
   - Calcula o saldo operacional real final do mês e gera automaticamente o ciclo do mês seguinte, transferindo o saldo em conta e dos benefícios, clonando contas recorrentes e avançando parcelas ativas.

---

## 2. Fórmulas do Motor de Previsibilidade Financeira

Todas as regras financeiras residem em funções puras e determinísticas em `src/lib/financialEngine.ts`:

- **Total de Despesas Previstas**:
  $$\text{Despesas Previstas} = \sum \text{Contas Fixas Exigíveis (Pagas + Pendentes)} + \sum \text{Microgastos Diários}$$
- **Total de Despesas Executadas**:
  $$\text{Despesas Executadas} = \sum \text{Contas Fixas Pagas} + \sum \text{Microgastos Diários}$$
- **Saldo Operacional Atual (Real em Conta)**:
  $$\text{Saldo Operacional} = (\text{Saldo Anterior} + \text{Entradas Confirmadas}) - \text{Despesas Executadas}$$
- **Saldo Projetado ao Fim do Mês**:
  $$\text{Saldo Projetado} = (\text{Saldo Anterior} + \text{Todas as Entradas}) - \text{Despesas Previstas}$$

---

## 3. Arquitetura e Stack Tecnológica

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4 (com suporte nativo a tema adaptável Light/Dark via `@custom-variant dark`), Lucide Icons.
- **Tipografia & Disciplina Numérica**: `Plus Jakarta Sans` (Display), `DM Sans` (Interface) e `JetBrains Mono` (`tabular-nums`) para alinhamento vertical de casas decimais.
- **Camada de Dados & Persistência**:
  - Execução imediata no navegador com estado reativo persistido e pré-populado com dados de demonstração (`10/2026` e `11/2026`).
  - Especificação completa de produção em **PostgreSQL 16+ / Drizzle ORM** com **Row Level Security (RLS)** multi-tenant inspecionável e exportável diretamente pela aba **Schema & SQL**.

---

## 4. Esquema de Banco de Dados (PostgreSQL + Drizzle ORM + RLS)

As tabelas projetadas com isolamento multi-tenant (`user_id` + políticas RLS) incluem:
- `users`: Metadados do titular e configuração de moeda (`BRL`).
- `monthly_periods`: Ciclo mensal (`month`, `year`, `starting_balance`, `status`, `closed_at`).
- `incomes`: Entradas confirmadas ou previstas do período.
- `fixed_expenses`: Contas fixas, recorrentes e parcelamentos.
- `daily_expenses`: Microgastos diários categorizados.
- `benefit_wallets` & `benefit_transactions`: Controle isolado de cartões de benefícios (VR/VA/Flex).

> Os scripts completos (`schema.ts` e `0001_multi_tenant_rls.sql`) estão disponíveis em `src/data/architectureDocs.ts` e podem ser baixados diretamente na interface da aplicação.

---

## 5. Instalação e Execução Local

### Pré-requisitos
- Node.js `>= 20.x`
- npm `>= 10.x`

### Passo a Passo

```bash
# 1. Clone o repositório
git clone https://github.com/arthur-araujo/fluxocaixa-pro.git
cd fluxocaixa-pro

# 2. Instale as dependências
npm install

# 3. Copie o arquivo de variáveis de ambiente de exemplo
cp .env.example .env

# 4. Inicie o servidor de desenvolvimento na porta 3000
npm run dev
```

Para validar tipos e gerar o bundle de produção:

```bash
npm run lint
npm run build
```

---

## 6. Governança Open Source, Licença e Aviso Legal

- **Como Contribuir**: Leia nosso [Guia de Contribuição (CONTRIBUTING.md)](./CONTRIBUTING.md).
- **Código de Conduta**: Este projeto adota o [Contributor Covenant v2.1 (CODE_OF_CONDUCT.md)](./CODE_OF_CONDUCT.md).
- **Atribuições de Terceiros**: Consulte o arquivo [NOTICE](./NOTICE) para a relação completa de bibliotecas open source utilizadas.
- **Licença**: Distribuído sob a licença **Apache License, Version 2.0**. Veja o arquivo [LICENSE](./LICENSE) para o texto legal completo.

```text
Copyright (c) 2026 Arthur Araujo and contributors
SPDX-License-Identifier: Apache-2.0
```
