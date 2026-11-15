# 🛡️ Diretório de Garantia da Qualidade (QA)

**Responsável:** Arthur José ([@ArthurJoseV](https://github.com/ArthurJoseV))  
**Projeto:** Sistema de Gestão de Chamados de Manutenção Predial  
**Stack de Testes:** Vitest, Postman, Playwright  

---

## 📌 Estrutura do Diretório de QA

Este diretório centraliza todas as estratégias, artefatos, documentações e automações de testes do sistema:

```text
qa/
├── README.md                      # Este guia geral de QA
├── plano-de-testes.md             # Plano de Testes formal (matriz de rastreabilidade, massa de dados e casos de teste)
├── package.json                   # Comandos para executar as suítes a partir de qa/
├── backend/
│   ├── unit/                      # Testes unitários, organizados pelos módulos do backend
│   ├── e2e/                       # Testes de integração da API e helpers (Supertest)
│   ├── tsconfig.json              # Configuração TypeScript dos testes do backend
│   ├── vitest.config.mjs          # Configuração dos testes unitários
│   └── vitest.config.e2e.mjs      # Configuração dos testes da API
├── frontend/
│   ├── api/                       # Testes de schemas e fixtures em __fixtures__/
│   ├── components/                # Testes de componentes
│   ├── hooks/                     # Testes de hooks
│   ├── pages/                     # Testes de páginas
│   ├── *.test.ts(x)               # Testes de guards, helpers e permissões
│   ├── setupTests.ts              # Setup e limpeza do DOM
│   ├── tsconfig.json              # Configuração TypeScript dos testes do frontend
│   └── vitest.config.mjs          # Configuração Vitest + Testing Library
├── postman/                       # Validação e testes de regressão de API
│   ├── Gestao_Chamados.postman_collection.json
│   ├── Local.postman_environment.json
│   └── README.md                  # Instruções de execução no Postman e Newman
└── e2e/                           # Planejamento dos testes de navegador (Playwright)
    └── README.md                  # Especificação e roteiro dos fluxos E2E
```

---

## 🎯 Entregas de QA no Projeto

| Entrega | Ferramenta / Arquivo | Status | Descrição |
| :--- | :--- | :---: | :--- |
| **Plano de Testes** | [plano-de-testes.md](./plano-de-testes.md) | ✅ Concluído | Mapeamento de RF01 a RF06, RN01 a RN04 e casos de teste detalhados |
| **Testes de API** | [postman/](./postman/) | ✅ Concluído | Coleção com 24 asserções automatizadas cobrindo 100% dos endpoints |
| **Testes E2E (Web)** | [e2e/](./e2e/) | 🟡 Em planejamento | Automação do fluxo completo de ponta a ponta com Playwright |
| **Auditoria & Bugs** | Seção 6 do Plano de Testes | ✅ Mapeado | Identificação e documentação de 5 bugs e vulnerabilidades de segurança |

---

## 🚀 Como Executar os Testes

### 1. Testes de API (Postman)
Consulte o guia dedicado em [postman/README.md](./postman/README.md) para importar a coleção e rodar via Runner.

### 2. Testes Existentes da Aplicação (Backend e Frontend)
Instale primeiro as dependências do backend e do frontend, a partir da raiz do repositório:

```powershell
npm ci --prefix backend
npm ci --prefix frontend
```

Não é necessário instalar dependências em `qa/`: as configurações reutilizam as versões já declaradas em cada aplicação, sem alterar seus lockfiles.

Para executar as suítes a partir de `qa/`:

```powershell
cd qa

# Todas as suítes, em sequência; interrompe se uma delas falhar.
npm test

# Suítes individuais.
npm run test:backend
npm run test:api
npm run test:frontend
```

Os comandos existentes nas aplicações continuam disponíveis e apontam para os arquivos em `qa/`:

```powershell
# A partir da raiz do repositório.
npm --prefix backend test
npm --prefix backend run test:e2e
npm --prefix backend run test:cov
npm --prefix frontend test
```

Os relatórios de cobertura são gravados em `qa/coverage/`, ignorado pelo Git. Os testes da API usam o modo de teste em memória, sem precisar de PostgreSQL ou dos servidores de desenvolvimento em execução.
