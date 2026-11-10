# Guia de Contribuição (Contributing to FluxoCaixa Pro)

Obrigado pelo seu interesse em contribuir com o **FluxoCaixa Pro**! Este projeto é 100% Open Source sob a licença **Apache-2.0** e acolhe contribuições da comunidade para evoluir a gestão financeira pessoal e a previsibilidade mensal de caixa.

---

## 1. Como Contribuir

Você pode contribuir de diversas formas:
- Reportando bugs ou inconsistências matemáticas nos cálculos de fluxo de caixa.
- Sugerindo novas funcionalidades (ex.: importação de OFX/CSV, gráficos de evolução patrimonial, suporte multi-moedas).
- Melhorando a acessibilidade (WCAG AA) e ergonomia mobile-first.
- Aperfeiçoando o schema PostgreSQL / Drizzle ORM e políticas de Row Level Security (RLS).

---

## 2. Configurando o Ambiente de Desenvolvimento

1. **Faça um Fork e Clone o repositório:**
   ```bash
   git clone https://github.com/arthur-araujo/fluxocaixa-pro.git
   cd fluxocaixa-pro
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env
   ```

4. **Inicie o servidor de desenvolvimento (Porta 3000):**
   ```bash
   npm run dev
   ```

5. **Valide a tipagem e o build antes de abrir um Pull Request:**
   ```bash
   npm run lint
   npm run build
   ```

---

## 3. Padrões de Código e Arquitetura

- **Cabeçalho SPDX Obrigatório**: Todo novo arquivo `.ts`, `.tsx` ou `.css` criado em `src/` deve conter o cabeçalho padronizado no topo:
  ```typescript
  /**
   * Copyright (c) 2026 Arthur Araujo and contributors
   * SPDX-License-Identifier: Apache-2.0
   */
  ```
- **Motor Financeiro Puro (`src/lib/financialEngine.ts`)**: Mantenha todas as funções de cálculo de saldo operacional, saldo projetado, carteiras de benefícios (VR/VA) e rollover mensal como **funções puras e determinísticas** (sem efeitos colaterais de UI ou banco), utilizando `roundCurrency` para evitar desvios de ponto flutuante.
- **Disciplina Tipográfica Tabular**: Todos os valores monetários (`R$`), datas e contadores de parcelas devem utilizar `font-mono tabular-nums`.
- **Commits Semânticos (Conventional Commits)**:
  - `feat:` nova funcionalidade financeira ou visual
  - `fix:` correção de bug ou cálculo
  - `docs:` alterações de documentação ou compliance
  - `refactor:` refatoração de código sem mudança de comportamento
  - `chore:` manutenção de dependências ou build

---

## 4. Licenciamento das Contribuições

Conforme a Seção 5 da **Apache License, Version 2.0**, qualquer contribuição intencionalmente submetida para inclusão neste repositório será licenciada sob os mesmos termos da licença Apache-2.0, sem termos ou condições adicionais.
