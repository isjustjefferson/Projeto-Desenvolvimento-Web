# 📋 Plano de Testes de Software (QA)

**Projeto:** Sistema de Gestão de Chamados de Manutenção Predial  
**Versão:** 1.0.0  
**Responsável QA:** Arthur José ([@ArthurJoseV](https://github.com/ArthurJoseV))  
**Branch Base:** `development`  
**Última Atualização:** Outubro/2026  

---

## 1. Introdução e Objetivos

Este documento formaliza a estratégia, o planejamento e os casos de teste do **Sistema de Gestão de Chamados de Manutenção Predial**, garantindo que as regras de negócio, a segurança e a usabilidade atendam aos requisitos especificados.

### Objetivos de Qualidade
* **Validação de Regras de Negócio (RN01 a RN04):** Garantir que restrições de perfis e integridade de chamados sejam respeitadas no Backend e no Frontend.
* **Cobertura E2E (Playwright):** Automatizar o fluxo crítico de vida do chamado na interface web.
* **Validação de API (Postman):** Criar suíte de testes de regressão de API para todos os endpoints.
* **Segurança e RBAC:** Identificar e mitigar brechas de autorização e exposição indevida de dados sensíveis.

---

## 2. Escopo e Ferramentas

### 2.1 O que está no escopo de testes
* **Módulo de Autenticação e Perfis (RF01):** Login, Logout, Auto-registro, Recuperação de senha e RBAC.
* **Módulo de Chamados (RF02, RF03, RF04, RF06):** Criação, listagem, filtros, histórico e transições de status.
* **Módulo de Dashboard e Métricas (RF05):** Contadores de status, chamados críticos e tempo médio de resolução (MTTR).
* **Módulo de Gestão de Usuários:** CRUD de usuários (exclusivo para perfil Administrador).
* **Responsividade (RNF01):** Visualização e usabilidade mobile e desktop.
* **Health Check e Observabilidade (RNF02):** Rota `/health` e consistência de logs.

### 2.2 Ferramentas e Tecnologias de QA
| Camada / Tipo | Ferramenta | Responsabilidade |
| :--- | :--- | :--- |
| **Testes Unitários / Integração** | Vitest (Backend & Frontend) | Cobertura de lógica de componentes, schemas e serviços |
| **Validação e Regressão de API** | Postman | Coleção de requests com asserções de status, contrato e tempo de resposta |
| **Automação End-to-End (E2E)** | Playwright (TypeScript) | Simulação de jornadas completas de usuário nos navegadores (Chromium, Firefox, WebKit) |
| **Testes Exploratórios** | Navegador (DevTools) | Testes de usabilidade, layout responsivo e inspeção de rede |
| **Gestão de Defeitos** | GitHub Issues | Registro, priorização e acompanhamento de bugs |

---

## 3. Matriz de Rastreabilidade (Requisitos x Regras de Negócio)

| ID | Descrição do Requisito / Regra | Tipo | Casos de Teste Associados |
| :--- | :--- | :---: | :--- |
| **RF01** | Cadastro e login segmentado por perfis | Funcional | `CT-AUTH-01`, `CT-AUTH-02`, `CT-AUTH-03`, `CT-AUTH-04` |
| **RF02** | Abertura de chamados com categoria, local e descrição | Funcional | `CT-CHAM-01`, `CT-CHAM-02` |
| **RF03** | Gestão de status do ciclo de vida | Funcional | `CT-CHAM-03`, `CT-CHAM-04`, `CT-CHAM-05`, `CT-CHAM-06` |
| **RF04** | Histórico auditável de movimentações | Funcional | `CT-CHAM-07` |
| **RF05** | Dashboard com métricas (abertos, críticos, MTTR) | Funcional | `CT-DASH-01` |
| **RF06** | Busca e filtros avançados | Funcional | `CT-CHAM-08` |
| **RN01** | Solicitante só visualiza e interage com seus próprios chamados | Regra de Negócio | `CT-RBAC-01`, `CT-RBAC-02` |
| **RN02** | Apenas Gestor pode aprovar, priorizar crítica ou atribuir técnico | Regra de Negócio | `CT-RBAC-03`, `CT-RBAC-04` |
| **RN03** | Técnico só altera chamado atribuído a ele | Regra de Negócio | `CT-RBAC-05` |
| **RN04** | Bloquear encerramento sem solução e materiais registrados | Regra de Negócio | `CT-RN04-01`, `CT-RN04-02` |
| **RNF01** | Interface responsiva mobile-first | Não-Funcional | `CT-UI-01` |
| **RNF02** | Rota `/health` e logs estruturados | Não-Funcional | `CT-API-HEALTH-01` |

---

## 4. Massa de Dados Padrão (Ambiente de Testes)

Credenciais e perfis seedados para uso nos testes automatizados e manuais:

| Nome | E-mail | Perfil | Senha | Finalidade do Teste |
| :--- | :--- | :--- | :--- | :--- |
| **Ana Souza** | `ana@predial.com` | `SOLICITANTE` | `123456` | Validação de restrição RN01 e abertura de chamados |
| **Carlos Lima** | `carlos@predial.com` | `SOLICITANTE` | `123456` | Segundo solicitante para testes de isolamento |
| **João Eletricista** | `joao@predial.com` | `TECNICO` | `123456` | Atendimento, RN03 e conclusão RN04 |
| **Ricardo Síndico** | `ricardo@predial.com` | `GESTOR` | `123456` | Triagem, atribuição de técnicos e RN02 |
| **Tiago TI** | `tiago@predial.com` | `ADMINISTRADOR`| `123456` | CRUD de usuários e visão global do sistema |

---

## 5. Casos de Teste Detalhados

### 5.1 Módulo: Autenticação e Gestão de Acesso

#### `CT-AUTH-01` — Login com credenciais válidas
* **Pré-condição:** Usuário cadastrado no banco.
* **Passos:**
  1. Acessar `/login`.
  2. Informar e-mail `ana.solicitante@empresa.com` e senha `senha123`.
  3. Clicar em "Entrar".
* **Resultado Esperado:** Redirecionar para `/dashboard` com nome do usuário e perfil exibidos na barra superior.

#### `CT-AUTH-02` — Login com credenciais inválidas
* **Passos:** Informar e-mail existente com senha incorreta.
* **Resultado Esperado:** Exibir mensagem clara de erro ("E-mail ou senha inválidos") e permanecer na tela de login.

#### `CT-AUTH-03` — Auto-registro de novo solicitante
* **Passos:** Acessar `/register`, preencher nome, e-mail institucional, unidade, setor, senha e submeter.
* **Resultado Esperado:** Usuário criado com perfil `SOLICITANTE` e redirecionado para dashboard autenticado.

#### `CT-AUTH-04` — Fluxo de recuperação de senha
* **Passos:**
  1. Acessar `/forgot-password`, informar e-mail cadastrado.
  2. Utilizar o token gerado para acessar `/reset-password`.
  3. Cadastrar nova senha e realizar login.
* **Resultado Esperado:** Senha redefinida com sucesso. A senha antiga deve ser rejeitada.

---

### 5.2 Módulo: Gestão de Chamados e Ciclo de Vida

#### `CT-CHAM-01` — Abertura de chamado válido (Solicitante)
* **Usuário:** Ana (`SOLICITANTE`)
* **Passos:**
  1. Clicar em "Novo Chamado".
  2. Preencher título, descrição, categoria (ex: Elétrica), local (Prédio A, 2º andar, Sala 204).
  3. Clicar em "Enviar Chamado".
* **Resultado Esperado:** Chamado criado com status inicial `ABERTO`, prioridade padrão `MEDIA`, e visível na listagem da Ana.

#### `CT-CHAM-02` — Validação de campos obrigatórios na abertura
* **Passos:** Tentar enviar formulário de abertura sem preencher título ou categoria.
* **Resultado Esperado:** Formulário bloqueia o envio com indicação visual de campos obrigatórios.

#### `CT-CHAM-03` — Triagem e Aprovação pelo Gestor (RN02)
* **Usuário:** Beatriz (`GESTOR`)
* **Passos:**
  1. Localizar chamado em status `ABERTO`.
  2. Abrir o detalhe do chamado.
  3. Definir prioridade `ALTA` ou `CRITICA` e atribuir ao técnico Carlos.
  4. Clicar em "Aprovar / Atribuir".
* **Resultado Esperado:** Status transiciona para `EM_ANDAMENTO`, técnico atribuído registrado no histórico.

#### `CT-CHAM-04` — Início de atendimento pelo Técnico (RN03)
* **Usuário:** Carlos (`TECNICO`)
* **Passos:** Acessar chamado atribuído a ele e clicar em "Iniciar Atendimento".
* **Resultado Esperado:** Ação confirmada e registrada no histórico com data/hora.

#### `CT-CHAM-05` — Conclusão de atendimento válida (RN04)
* **Usuário:** Carlos (`TECNICO`)
* **Passos:**
  1. Clicar em "Concluir Chamado".
  2. Preencher a solução aplicada: *"Substituição de reator e lâmpada LED danificada"*.
  3. Preencher materiais: *"1x Reator 40W, 1x Lâmpada tubular LED"*.
  4. Confirmar conclusão.
* **Resultado Esperado:** Status transiciona para `RESOLVIDO` / `ENCERRADO` e dados gravados com sucesso.

#### `CT-CHAM-06` — Bloqueio de encerramento sem solução/materiais (RN04)
* **Usuário:** Carlos (`TECNICO`)
* **Passos:**
  1. Clicar em "Concluir Chamado".
  2. Deixar campo de solução ou de materiais em branco.
  3. Tentar submeter.
* **Resultado Esperado:** Backend retorna erro `400 Bad Request` e interface bloqueia a ação exigindo os dois campos.

---

### 5.3 Módulo: Controle de Acesso e Regras de Negócio (RBAC)

#### `CT-RBAC-01` — Isolamento de chamados do Solicitante (RN01)
* **Usuário:** Ana (`SOLICITANTE`)
* **Passos:** Listar chamados na tela inicial ou via `GET /api/chamados`.
* **Resultado Esperado:** Ana **apenas** visualiza chamados abertos por ela. Chamados de outros solicitantes não aparecem.

#### `CT-RBAC-02` — Tentativa de acesso direto a chamado alheio (RN01)
* **Usuário:** Ana (`SOLICITANTE`)
* **Passos:** Tentar acessar via URL ou requisição `GET /api/chamados/:id` de um chamado pertencente a outro usuário.
* **Resultado Esperado:** Retornar erro `403 Forbidden` ou `404 Not Found`.

#### `CT-RBAC-03` — Bloqueio de Solicitante/Técnico elevar prioridade para Crítica (RN02)
* **Usuário:** Ana ou Carlos
* **Passos:** Tentar enviar requisição de alteração de prioridade para `CRITICA`.
* **Resultado Esperado:** Operação rejeitada com status `403 Forbidden`.

#### `CT-RBAC-04` — Bloqueio de Solicitante/Técnico atribuir responsável (RN02)
* **Usuário:** Ana ou Carlos
* **Passos:** Tentar enviar requisição de atribuição de técnico.
* **Resultado Esperado:** Operação rejeitada com status `403 Forbidden`.

#### `CT-RBAC-05` — Técnico tentando alterar chamado de outro técnico (RN03)
* **Usuário:** Técnico B
* **Passos:** Tentar iniciar ou concluir chamado atribuído ao técnico Carlos.
* **Resultado Esperado:** Operação rejeitada com status `403 Forbidden`.

---

### 5.4 Módulo: Painel e Dashboard

#### `CT-DASH-01` — Consistência de métricas do Dashboard (RF05)
* **Usuário:** Beatriz (`GESTOR`)
* **Passos:**
  1. Acessar `/dashboard`.
  2. Comparar total de chamados em aberto e críticos pendentes com a lista filtrada.
* **Resultado Esperado:** Indicadores numéricos correspondem exatamente à quantidade real de registros.

---

## 6. Bugs Conhecidos e Débito Técnico de Segurança (Backlog de QA)

| ID | Severidade | Módulo | Descrição do Problema | Impacto |
| :--- | :---: | :--- | :--- | :--- |
| **BUG-01** | 🔴 Crítica | `backend/auth` | Autenticação baseada em header simples `x-usuario-id` sem JWT/assinatura criptográfica. | Qualquer cliente pode forjar identidade e assumir perfil `ADMINISTRADOR`. |
| **BUG-02** | 🔴 Crítica | `backend/auth` | Rota de recuperação de senha retorna o `token` de reset no corpo do JSON da resposta. | Qualquer pessoa que saiba o e-mail de um usuário obtém o token sem acesso à caixa postal. |
| **BUG-03** | 🟡 Média | `backend/auth` | Na função de registro de usuário, o campo `setor` recebe acidentalmente o valor de `unidade`. | Inconsistência nos dados de novos solicitantes cadastrados. |
| **BUG-04** | 🟡 Média | `backend/seed` | Chamado #4 da seed possui status `REVISAO` com data de encerramento já preenchida. | Inconsistência de integridade de ciclo de vida. |
| **BUG-05** | 🟢 Baixa | `frontend/lint` | Warnings de `setState` síncrono disparado dentro de `useEffect` em [ContaModal.tsx](file:///c:/Users/arthu/OneDrive/Área de Trabalho/PDW/frontend/src/components/ContaModal.tsx) e [AuthContext.tsx](file:///c:/Users/arthu/OneDrive/Área de Trabalho/PDW/frontend/src/context/AuthContext.tsx). | Risco de cascata de re-renderizações e lentidão na interface. |

---

## 7. Critérios de Aceite e Definição de Pronto (Definition of Done - QA)

Para que uma entrega ou sprint seja considerada aprovada por QA:
1. Todos os testes unitários e de integração existentes continuam passando (100% pass).
2. Novos cenários possuem cobertura de testes (Postman ou Playwright).
3. Nenhuma regressão nas regras **RN01 a RN04**.
4. Testes E2E do fluxo principal executam com sucesso em modo headless.
5. Todos os bugs críticos (severidade alta/crítica) foram corrigidos ou mitigados.
