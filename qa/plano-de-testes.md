# 📋 Plano de Testes de Software (QA)

**Projeto:** Sistema de Gestão de Chamados de Manutenção Predial  
**Versão:** 2.0.0  
**Responsável QA:** Arthur José ([@ArthurJoseV](https://github.com/ArthurJoseV))  
**Branch Base:** `development`  
**Última Atualização:** Novembro/2026  

---

## 1. Introdução e Objetivos

Este documento formaliza a estratégia, o planejamento e os casos de teste do **Sistema de Gestão de Chamados de Manutenção Predial**, garantindo que as regras de negócio, a segurança e a usabilidade atendam aos requisitos especificados.

### Objetivos de Qualidade
* **Validação de Regras de Negócio (RN01 a RN05):** Garantir que restrições de perfis e integridade de chamados sejam respeitadas no Backend e no Frontend.
* **Cobertura E2E (Playwright):** Automatizar o fluxo crítico de vida do chamado na interface web — login → abertura → triagem → aprovação → atendimento → conclusão.
* **Validação de API (Postman / vitest E2E):** Suíte de testes de regressão de API para todos os endpoints.
* **Segurança e RBAC:** Identificar e mitigar brechas de autorização e exposição indevida de dados sensíveis.

---

## 2. Escopo e Ferramentas

### 2.1 O que está no escopo de testes
* **Módulo de Autenticação e Perfis (RF01):** Login, Logout, Cadastro de condômino, Recuperação de senha e RBAC.
* **Módulo de Chamados (RF02, RF03, RF04, RF06):** Criação, listagem, filtros, histórico e transições de status (`AGUARDANDO_APROVACAO → REVISADO → EM_ANDAMENTO → CONCLUIDO`).
* **Módulo de Orçamentos:** Envio de orçamento pelo prestador, aprovação/rejeição pelo síndico.
* **Módulo de Despesas e Notas Fiscais:** Lançamento, aprovação, rejeição e correção OCR.
* **Módulo de Dashboard e Métricas (RF05):** Contadores de status, chamados críticos e dados de triagem.
* **Módulo de Gestão de Usuários:** CRUD de usuários (exclusivo para perfil `ADMINISTRADOR`).
* **Responsividade (RNF01):** Visualização e usabilidade mobile e desktop.
* **Health Check (RNF02):** Rota `/health`.

### 2.2 Perfis de Usuário (Roles Reais do Sistema)
| Role | Descrição | Permissões Chave |
| :--- | :--- | :--- |
| `CONDOMINO` | Morador/solicitante | Abre chamados, visualiza **apenas os seus** |
| `PRESTADOR` | Técnico/empresa de manutenção | Envia orçamentos, inicia e conclui chamados atribuídos a ele |
| `SINDICO` | Gestor predial | Aprova/recusa chamados, atribui prestadores, aprova orçamentos e despesas |
| `ADMINISTRADOR` | TI / Super-admin | Tudo do síndico + CRUD de usuários |

> ⚠️ **Versão anterior do plano usava roles incorretos** (`SOLICITANTE`, `GESTOR`, `TECNICO`). Todos os casos de teste foram corrigidos para refletir os roles reais do sistema.

### 2.3 Ferramentas e Tecnologias de QA
| Camada / Tipo | Ferramenta | Responsabilidade |
| :--- | :--- | :--- |
| **Testes Unitários / Integração** | Vitest (Backend & Frontend) | Cobertura de lógica de componentes, schemas e serviços |
| **Validação e Regressão de API** | Postman + vitest E2E | Coleção de requests com asserções de status, contrato e tempo de resposta |
| **Automação End-to-End (E2E)** | Playwright (TypeScript) | Simulação de jornadas completas de usuário nos navegadores (Chromium, Firefox, WebKit) |
| **Testes Exploratórios** | Navegador (DevTools) | Testes de usabilidade, layout responsivo e inspeção de rede |
| **Gestão de Defeitos** | GitHub Issues | Registro, priorização e acompanhamento de bugs |

---

## 3. Matriz de Rastreabilidade (Requisitos x Regras de Negócio)

| ID | Descrição do Requisito / Regra | Tipo | Casos de Teste Associados |
| :--- | :--- | :---: | :--- |
| **RF01** | Cadastro e login segmentado por perfis | Funcional | `CT-AUTH-01`, `CT-AUTH-02`, `CT-AUTH-03`, `CT-AUTH-04` |
| **RF02** | Abertura de chamados com categoria, local e descrição | Funcional | `CT-CHAM-01`, `CT-CHAM-02` |
| **RF03** | Gestão de status do ciclo de vida | Funcional | `CT-CHAM-03`, `CT-CHAM-04`, `CT-CHAM-05`, `CT-CHAM-06`, `CT-CHAM-07` |
| **RF04** | Histórico auditável de movimentações | Funcional | `CT-CHAM-08` |
| **RF05** | Dashboard com métricas (total, abertos, concluídos) | Funcional | `CT-DASH-01`, `CT-DASH-02` |
| **RF06** | Busca e filtros avançados de chamados | Funcional | `CT-CHAM-09` |
| **RF07** | Orçamentos enviados por prestador | Funcional | `CT-ORC-01`, `CT-ORC-02`, `CT-ORC-03` |
| **RF08** | Despesas e notas fiscais por chamado | Funcional | `CT-DESP-01`, `CT-DESP-02` |
| **RN01** | Condômino só visualiza e interage com seus próprios chamados | Regra de Negócio | `CT-RBAC-01`, `CT-RBAC-02` |
| **RN02** | Apenas Síndico/Admin pode aprovar, recusar e atribuir prestador | Regra de Negócio | `CT-RBAC-03`, `CT-RBAC-04` |
| **RN03** | Prestador só altera chamado atribuído a ele | Regra de Negócio | `CT-RBAC-05` |
| **RN04** | Bloquear conclusão sem solução e materiais preenchidos | Regra de Negócio | `CT-RN04-01`, `CT-RN04-02` |
| **RN05** | Orçamentos pendentes bloqueiam início do atendimento | Regra de Negócio | `CT-ORC-03` |
| **RNF01** | Interface responsiva mobile-first | Não-Funcional | `CT-UI-01` |
| **RNF02** | Rota `/health` e logs estruturados | Não-Funcional | `CT-API-HEALTH-01` |

---

## 4. Massa de Dados Padrão (Ambiente de Testes)

Credenciais e perfis seedados para uso nos testes automatizados e manuais:

| Nome | E-mail | Role | Senha | Finalidade do Teste |
| :--- | :--- | :--- | :--- | :--- |
| **Ana Souza** | `ana@predial.com` | `CONDOMINO` | `123456` | Abertura de chamados, validação de RN01 |
| **Carlos Lima** | `carlos@predial.com` | `CONDOMINO` | `123456` | Segundo condômino p/ testes de isolamento |
| **João Eletricista** | `joao@predial.com` | `PRESTADOR` | `123456` | Atendimento (especialidade: Elétrica), RN03, RN04 |
| **Marta Encanadora** | `marta@predial.com` | `PRESTADOR` | `123456` | Segundo prestador p/ testes de isolamento (Hidráulica) |
| **Ricardo Síndico** | `ricardo@predial.com` | `SINDICO` | `123456` | Triagem, aprovação, atribuição de prestador, RN02 |
| **Tiago TI** | `tiago@predial.com` | `ADMINISTRADOR` | `123456` | CRUD de usuários e visão global do sistema |

---

## 5. Casos de Teste Detalhados

### 5.1 Módulo: Autenticação e Gestão de Acesso

#### `CT-AUTH-01` — Login com credenciais válidas
* **Automated:** ✅ Playwright (`auth.spec.ts`)
* **Pré-condição:** Usuário seedado no banco.
* **Passos:**
  1. Acessar `/login`.
  2. Informar e-mail `ana@predial.com` e senha `123456`.
  3. Clicar em "Entrar".
* **Resultado Esperado:** Redirecionar para `/` (Dashboard) com nome da usuária e perfil exibidos na barra superior.

#### `CT-AUTH-02` — Login com credenciais inválidas
* **Automated:** ✅ Playwright (`auth.spec.ts`)
* **Passos:** Informar e-mail existente com senha incorreta.
* **Resultado Esperado:** Exibir mensagem clara de erro e permanecer na tela de login.

#### `CT-AUTH-03` — Cadastro de novo condômino
* **Automated:** ✅ Playwright (`auth.spec.ts`)
* **Passos:** Acessar `/register`, preencher nome, e-mail, unidade/bloco, senha e confirmar senha. Submeter.
* **Resultado Esperado:** Usuário criado com role `CONDOMINO` e redirecionado para dashboard autenticado.

#### `CT-AUTH-04` — Recuperação de senha e proteção de rotas públicas
* **Automated:** ✅ Playwright (`auth.spec.ts`)
* **Passos:**
  1. Acessar `/forgot-password` e solicitar redefinição com e-mail cadastrado.
  2. Seguir para `/reset-password` e cadastrar nova senha.
  3. Validar que usuário autenticado redireciona para `/` ao acessar `/login` ou `/register`.
* **Resultado Esperado:** Senha redefinida e aceita no login (nota: em PostgreSQL atualmente falha por `BUG-07`).

#### `CT-AUTH-05` — Proteção de rota autenticada sem sessão
* **Automated:** ✅ Playwright (`auth.spec.ts`)
* **Passos:** Usuário não autenticado tenta acessar `/chamados`.
* **Resultado Esperado:** Redirecionado para `/login`.

---

### 5.2 Módulo: Gestão de Chamados e Ciclo de Vida

#### `CT-CHAM-01` — Abertura de chamado válido (Condômino)
* **Automated:** ✅ Playwright (`chamados.spec.ts`)
* **Usuário:** Ana (`CONDOMINO`)
* **Passos:**
  1. Autenticar como Ana.
  2. Navegar para `/chamados/novo` ou clicar em "Novo Chamado".
  3. Preencher título, categoria (ex: Elétrica), bloco/torre, andar, lugar e descrição.
  4. Clicar em "Abrir chamado".
* **Resultado Esperado:** Chamado criado com status `AGUARDANDO_APROVACAO`, `prioridade` indefinida (`null`) com sugestão automática de criticidade, e redireciona para o detalhe.

#### `CT-CHAM-02` — Validação de campos obrigatórios na abertura
* **Automated:** ✅ Playwright (`chamados.spec.ts`)
* **Passos:** Tentar enviar formulário de abertura sem preencher título ou bloco/torre.
* **Resultado Esperado:** Formulário bloqueia o envio com indicação visual de campos obrigatórios.

#### `CT-CHAM-03` — Triagem e Aprovação pelo Síndico (RN02)
* **Automated:** ✅ Playwright (`ciclo-vida.spec.ts`)
* **Usuário:** Ricardo (`SINDICO`)
* **Passos:**
  1. Autenticar como Ricardo.
  2. Abrir o detalhe do chamado em `AGUARDANDO_APROVACAO`.
  3. Clicar em "Aprovar e Liberar Chamado".
  4. Selecionar prioridade (botões) e prestador João Eletricista.
  5. Clicar em "Aprovar e atribuir".
* **Resultado Esperado:** Status transiciona para `REVISADO`. Histórico registra a ação do síndico.

#### `CT-CHAM-04` — Recusa de chamado pelo Síndico
* **Automated:** ✅ Playwright (`ciclo-vida.spec.ts`)
* **Usuário:** Ricardo (`SINDICO`)
* **Passos:** Clicar em "Recusar chamado" e informar motivo.
* **Resultado Esperado:** Status transiciona para `RECUSADO`. Motivo registrado no histórico.

#### `CT-CHAM-05` — Início de atendimento pelo Prestador (RN03)
* **Automated:** ✅ Playwright (`ciclo-vida.spec.ts`)
* **Usuário:** João (`PRESTADOR`)
* **Passos:** Acessar chamado atribuído a ele (status `REVISADO`) e clicar em "Iniciar atendimento" (confirmando "Iniciar mesmo assim" caso não haja orçamento).
* **Resultado Esperado:** Status transiciona para `EM_ANDAMENTO`. Ação registrada no histórico.

#### `CT-CHAM-06` — Conclusão de atendimento válida (RN04)
* **Automated:** ✅ Playwright (`ciclo-vida.spec.ts`)
* **Usuário:** João (`PRESTADOR`)
* **Passos:**
  1. Acessar chamado em status `EM_ANDAMENTO` atribuído a ele.
  2. Clicar em "Concluir chamado".
  3. Preencher solução e materiais.
  4. Confirmar em "Concluir".
* **Resultado Esperado:** Status transiciona para `CONCLUIDO`. Solução e materiais gravados.

#### `CT-CHAM-07` — Bloqueio de conclusão sem solução/materiais (RN04)
* **Automated:** ✅ Playwright (`ciclo-vida.spec.ts`)
* **Usuário:** João (`PRESTADOR`)
* **Passos:** Tentar confirmar conclusão com campos de solução ou materiais em branco.
* **Resultado Esperado:** Botão "Concluir" permanece desabilitado enquanto os campos estiverem vazios.

#### `CT-CHAM-08` — Histórico auditável do chamado
* **Automated:** ✅ Playwright (`ciclo-vida.spec.ts`)
* **Passos:** Após fluxo completo, verificar seção de histórico no detalhe do chamado.
* **Resultado Esperado:** Cada transição de status (`abriu o chamado`, `Aguardando Aprovação → Revisado`, `Revisado → Em Andamento`, `Em Andamento → Concluído`) consta no histórico.

#### `CT-CHAM-09` — Filtros na lista de chamados
* **Automated:** ✅ Playwright (`chamados.spec.ts`)
* **Usuário:** Ricardo (`SINDICO`)
* **Passos:** Aplicar filtro de status `EM_ANDAMENTO` e alternar entre visualização em cards e lista.
* **Resultado Esperado:** Apenas chamados com o status selecionado aparecem na listagem e alternância de visualização funciona.

---

### 5.3 Módulo: Orçamentos e Despesas

#### `CT-ORC-01` — Envio de orçamento pelo Prestador
* **Automated:** ✅ Playwright (`orcamentos-despesas.spec.ts`)
* **Usuário:** João (`PRESTADOR`)
* **Passos:** Acessar chamado em `REVISADO` atribuído a ele e clicar em "Enviar orçamento".
* **Resultado Esperado:** Orçamento criado com status `PENDENTE`.

#### `CT-ORC-02` — Aprovação de orçamento pelo Síndico
* **Automated:** ✅ Playwright (`orcamentos-despesas.spec.ts`)
* **Usuário:** Ricardo (`SINDICO`)
* **Passos:** Aprovar orçamento pendente no detalhe do chamado.
* **Resultado Esperado:** Orçamento fica com status `APROVADO`.

#### `CT-ORC-03` — Bloqueio de início com orçamentos pendentes (RN05)
* **Automated:** ✅ Playwright (`orcamentos-despesas.spec.ts`)
* **Usuário:** Síndico ou Prestador
* **Passos:** Verificar chamado que tem orçamento com status `PENDENTE`.
* **Resultado Esperado:** Botão "Iniciar atendimento" fica desabilitado até o síndico aprovar ou rejeitar.

#### `CT-DESP-01` — Lançamento e aprovação de despesa em chamado em andamento
* **Automated:** ✅ Playwright (`orcamentos-despesas.spec.ts`)
* **Usuário:** João (`PRESTADOR`) e Ricardo (`SINDICO`)
* **Passos:** Prestador lança despesa (`CampoMoeda`) em chamado `EM_ANDAMENTO`; síndico aprova.
* **Resultado Esperado:** Despesa aparece como `Pendente` e após aprovação muda para `Aprovada`.

#### `CT-DESP-02` — Bloqueio de conclusão com despesa pendente
* **Automated:** ✅ Playwright (`orcamentos-despesas.spec.ts`)
* **Usuário:** João (`PRESTADOR`)
* **Passos:** Tentar concluir chamado enquanto existe despesa com status `PENDENTE`.
* **Resultado Esperado:** API rejeita com erro (`despesas pendentes de aprovação`) e chamado segue `EM_ANDAMENTO`.

---

### 5.4 Módulo: Controle de Acesso e Regras de Negócio (RBAC)

#### `CT-RBAC-01` — Isolamento de chamados do Condômino (RN01)
* **Automated:** ✅ Playwright (`rbac.spec.ts`)
* **Usuário:** Ana (`CONDOMINO`)
* **Passos:** Listar chamados na tela do Dashboard e na lista de chamados.
* **Resultado Esperado:** Ana **apenas** visualiza chamados abertos por ela. Chamados de Carlos não aparecem.

#### `CT-RBAC-02` — Tentativa de acesso direto a chamado alheio (RN01)
* **Automated:** ✅ Playwright (`rbac.spec.ts`)
* **Usuário:** Ana (`CONDOMINO`)
* **Passos:** Tentar acessar via URL o detalhe de um chamado pertencente a Carlos.
* **Resultado Esperado:** Backend retorna `404` para não vazar existência e interface exibe "Chamado não encontrado." (ou "sem permissão").

#### `CT-RBAC-03` — Condômino não visualiza botões de aprovação (RN02)
* **Automated:** ✅ Playwright (`rbac.spec.ts`)
* **Usuário:** Ana (`CONDOMINO`)
* **Passos:** Acessar detalhe de chamado próprio em `AGUARDANDO_APROVACAO`.
* **Resultado Esperado:** Botões "Aprovar e Liberar Chamado" e "Recusar chamado" **não aparecem** na interface.

#### `CT-RBAC-04` — Prestador não visualiza botões de aprovação de chamado (RN02)
* **Automated:** ✅ Playwright (`rbac.spec.ts`)
* **Usuário:** João (`PRESTADOR`)
* **Passos:** Acessar chamado `REVISADO`.
* **Resultado Esperado:** Botões de aprovação/recusa não aparecem.

#### `CT-RBAC-05` — Prestador não pode acessar chamado atribuído a outro prestador (RN03)
* **Automated:** ✅ Playwright (`rbac.spec.ts`)
* **Usuário:** Marta (`PRESTADOR`)
* **Passos:** Tentar acessar via URL o chamado de Elétrica concluído e atribuído a João.
* **Resultado Esperado:** Backend retorna `404` e interface exibe "Chamado não encontrado." (ou "sem permissão").

#### `CT-RBAC-06` — Rota de usuários bloqueada para não-administradores
* **Automated:** ✅ Playwright (`rbac.spec.ts`)
* **Passos:** Usuário com role `SINDICO` tenta acessar `/usuarios`.
* **Resultado Esperado:** Redirecionado para `/`.

#### `CT-RBAC-07` — Rota de relatórios bloqueada para condôminos
* **Automated:** ✅ Playwright (`rbac.spec.ts`)
* **Passos:** Usuário com role `CONDOMINO` tenta acessar `/relatorios/despesas`.
* **Resultado Esperado:** Redirecionado para `/`.

---

### 5.5 Módulo: Painel e Dashboard

#### `CT-DASH-01` — Dashboard do Síndico exibe métricas e fila de triagem
* **Automated:** ✅ Playwright (`dashboard.spec.ts`)
* **Usuário:** Ricardo (`SINDICO`)
* **Passos:** Acessar `/`.
* **Resultado Esperado:** Cards de métricas visíveis (Total, Abertos, Concluídos) e seção "Fila de Triagem" com chamados `AGUARDANDO_APROVACAO`.

#### `CT-DASH-02` — Dashboard do Condômino não exibe fila de triagem
* **Automated:** ✅ Playwright (`dashboard.spec.ts`)
* **Usuário:** Ana (`CONDOMINO`)
* **Passos:** Acessar `/`.
* **Resultado Esperado:** Cards de métricas visíveis. Seção "Fila de Triagem" **não** aparece.

---

### 5.6 Módulo: Responsividade e UI

#### `CT-UI-01` — Responsividade mobile na página de login
* **Automated:** ✅ Playwright (`ui.spec.ts`) — viewport mobile
* **Passos:** Acessar `/login` em viewport 375×667 (iPhone SE).
* **Resultado Esperado:** Formulário renderizado corretamente, sem overflow horizontal, campos utilizáveis.

---

## 6. Bugs Conhecidos e Débito Técnico de Segurança

| ID | Severidade | Módulo | Descrição do Problema | Impacto |
| :--- | :---: | :--- | :--- | :--- |
| **BUG-01** | 🔴 Crítica | `backend/auth` | Autenticação baseada em header simples `x-usuario-id` sem JWT/assinatura criptográfica. | Qualquer cliente pode forjar identidade e assumir role `ADMINISTRADOR`. |
| **BUG-02** | 🔴 Crítica | `backend/auth` | Rota de recuperação de senha retorna o `token` de reset no corpo do JSON da resposta. | Token obtido sem acesso à caixa postal do usuário. |
| **BUG-03** | 🟡 Média | `backend/auth` | Campo `setor` recebe acidentalmente o valor de `unidade` no registro. | Inconsistência nos dados de novos condôminos cadastrados. |
| **BUG-04** | 🟡 Média | `backend/seed` | Chamado #4 possui status `REVISADO` mas sem prestador atribuído, impedindo início de atendimento. | Inconsistência de ciclo de vida no ambiente de desenvolvimento. |
| **BUG-05** | 🟢 Baixa | `frontend/lint` | Warnings de `setState` síncrono em `ContaModal.tsx` e `AuthContext.tsx`. | Risco de cascata de re-renderizações. |
| **BUG-06** | 🟡 Média | `qa/plano-de-testes` | Plano v1 referenciava roles inexistentes (`SOLICITANTE`, `GESTOR`, `TECNICO`). | Casos de teste inconsistentes com o código real. **Corrigido nesta versão.** |
| **BUG-07** | 🔴 Crítica | `backend/db` | `TokenResetEntity` mapeia colunas `id`, `usado_em` e `criado_em`, mas `db/02_tabelas.sql` cria `tokens_reset` só com `(token, usuario_id, expira_em)`. | `/api/auth/forgot-password` e `/reset-password` quebram com erro SQL 500 em PostgreSQL (detectado no `CT-AUTH-04`). |
| **BUG-08** | 🟠 Alta | `backend/relatorios` | `RelatoriosService.despesas` lê apenas do `StoreService` em memória e não consulta TypeORM. | `/api/relatorios/despesas` retorna vazio quando o sistema roda com PostgreSQL. |
| **BUG-09** | 🟡 Média | `backend/chamados` | Métodos de despesas no `ChamadosService` usam apenas repositórios TypeORM, sem fallback para `StoreService` em modo `NODE_ENV=test`. | Testes E2E de API de despesas dependem de mock ou banco real. |
| **BUG-10** | 🟢 Baixa | `frontend/lint` & `backend/lint` | Erro `@typescript-eslint/no-explicit-any` em `frontend/src/api/despesas.ts:119`; `oxlint` no backend falha com caminho `../qa/backend/`. | `npm run lint` retorna exit code 1 em ambos os pacotes. |

---

## 7. Estrutura dos Arquivos de Teste Playwright

```
qa/
└── e2e/
    ├── playwright.config.ts           # Configuração global (baseURL, backend+frontend webServer, browsers)
    ├── .env.test / .env.test.example  # Credenciais E2E (padrão README.md)
    ├── fixtures/
    │   └── auth.ts                    # Fixtures reutilizáveis de login por role
    ├── pages/
    │   ├── LoginPage.ts               # Page Object: página de login
    │   ├── DashboardPage.ts           # Page Object: dashboard
    │   ├── ChamadosPage.ts            # Page Object: lista e formulário de chamados
    │   └── ChamadoDetalhePage.ts      # Page Object: detalhe, ações, orçamentos e despesas
    └── tests/
        ├── auth.spec.ts               # CT-AUTH-01 ao 05
        ├── chamados.spec.ts           # CT-CHAM-01, 02, 09
        ├── ciclo-vida.spec.ts         # CT-CHAM-03 ao 08 (fluxo completo + recusa + histórico)
        ├── orcamentos-despesas.spec.ts # CT-ORC-01..03 (RN05) e CT-DESP-01..02
        ├── rbac.spec.ts               # CT-RBAC-01 ao 07
        ├── dashboard.spec.ts          # CT-DASH-01, 02
        └── ui.spec.ts                 # CT-UI-01
```

---

## 8. Critérios de Aceite e Definição de Pronto (Definition of Done — QA)

Para que uma entrega ou sprint seja considerada aprovada por QA:
1. Todos os testes unitários e de integração existentes continuam passando (100% pass).
2. Todos os specs Playwright passam em modo headless (Chromium obrigatório; Firefox e WebKit desejável).
3. Nenhuma regressão nas regras **RN01 a RN05**.
4. Novos cenários possuem cobertura de testes (Postman, vitest E2E ou Playwright).
5. Todos os bugs **Críticos** (🔴) foram corrigidos ou mitigados com workaround documentado.
6. O plano de testes está atualizado com os roles e comportamentos reais do sistema.
