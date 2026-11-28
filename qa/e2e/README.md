# 🎭 Testes End-to-End (E2E) com Playwright

**Responsável:** Arthur José (QA)  
**Status:** ✅ Automatizado  
**Versão:** 2.0.0  

Esta pasta contém os testes automatizados de ponta a ponta que simulam as ações de usuários reais nos navegadores Chromium, Firefox e WebKit.

---

## 📁 Estrutura

```
e2e/
├── playwright.config.ts              # Configuração global (baseURL, backend+frontend webServer, browsers)
├── package.json                      # Dependências: @playwright/test, dotenv
├── tsconfig.json                     # Configuração TypeScript
├── .env.test.example                 # Modelo de credenciais E2E
├── .env.test                         # Credenciais locais (ignorado pelo git)
│
├── fixtures/
│   └── auth.ts                       # Credenciais do README + fixtures de login por role
│
├── pages/                            # Page Objects (padrão POM)
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   ├── ChamadosPage.ts
│   └── ChamadoDetalhePage.ts
│
└── tests/                            # Specs de teste
    ├── auth.spec.ts                  # CT-AUTH-01 a CT-AUTH-05 (login, cadastro, reset, rotas)
    ├── chamados.spec.ts              # CT-CHAM-01, 02, 09 (abertura, classificação e filtros)
    ├── ciclo-vida.spec.ts            # CT-CHAM-03 ao 08 (fluxo completo + recusa + histórico)
    ├── orcamentos-despesas.spec.ts   # CT-ORC-01..03 (RN05) e CT-DESP-01..02
    ├── rbac.spec.ts                  # CT-RBAC-01 ao 07 (controle de acesso por perfil)
    ├── dashboard.spec.ts             # CT-DASH-01, 02 (métricas e fila de triagem)
    └── ui.spec.ts                    # CT-UI-01 (responsividade mobile/tablet e senha)
```

---

## 🚀 Como Usar

O `playwright.config.ts` já sobe **backend** (`http://localhost:3000`) e **frontend** (`http://localhost:5173`) automaticamente se não estiverem ativos, ou reutiliza os servidores que você já iniciou manualmente.

### Instalação

```bash
# Na pasta qa/e2e/
npm install

# Instala os navegadores (apenas na primeira vez)
npm run install:browsers
```

### Executando os testes

```bash
# Modo interativo com UI do Playwright
npm run test:ui

# Apenas Chromium (headless)
npm run test:chromium

# Todos os browsers configurados
npm test

# Modo headed (abre o navegador visualmente)
npm run test:headed

# Spec específico
npm run test:auth
npm run test:chamados
npm run test:ciclo
npm run test:rbac
npm run test:dashboard
npm run test:ui-spec

# Ver relatório HTML após os testes
npm run report
```

---

## 👥 Usuários de Teste (README.md / `.env.test`)

Todos os usuários padrão utilizam a senha `123456` (configurável em `.env.test`):

| Role | E-mail | Senha |
|:---|:---|:---|
| `CONDOMINO` | `ana@predial.com` | `123456` |
| `CONDOMINO` (2) | `carlos@predial.com` | `123456` |
| `PRESTADOR` (Elétrica) | `joao@predial.com` | `123456` |
| `PRESTADOR` (Hidráulica) | `marta@predial.com` | `123456` |
| `SINDICO` | `ricardo@predial.com` | `123456` |
| `ADMINISTRADOR` | `tiago@predial.com` | `123456` |

---

## 📋 Cenários Automatizados

- `auth.spec.ts`: login de todos os 6 perfis, erro de credenciais, cadastro/exclusão de conta, recuperação de senha indisponível sem expor token e redirecionamentos de rota.
- `chamados.spec.ts`: abertura de chamado com sugestão automática, validação de campos obrigatórios, filtros por status e alternância cards/lista.
- `ciclo-vida.spec.ts`: fluxo completo determinístico (criação → aprovação/atribuição → início → validação RN04 → conclusão → histórico auditável) e recusa na triagem.
- `orcamentos-despesas.spec.ts`: envio/aprovação de orçamento, bloqueio de início com orçamento pendente (RN05), lançamento/aprovação de despesa e bloqueio de conclusão com despesa pendente.
- `rbac.spec.ts`: isolamento por perfil (RN01–RN03) e bloqueio de rotas `/usuarios` e `/relatorios/despesas`.
- `dashboard.spec.ts`: métricas e visibilidade da fila de triagem por perfil.
- `ui.spec.ts`: responsividade mobile (`375×667`), tablet (`768×1024`) e botão mostrar/ocultar senha.
