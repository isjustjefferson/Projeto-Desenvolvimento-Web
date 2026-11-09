# Sistema de Gestão de Chamados de Manutenção

Plataforma web responsiva para centralizar, gerenciar e rastrear chamados de manutenção condominial (elétrica, hidráulica, climatização, mobiliário, estrutural e outros). O objetivo é substituir a comunicação informal por um processo auditável: cada chamado tem dono, prioridade, histórico de movimentações e controle de despesas.

---

## Fluxo do chamado

```text
AGUARDANDO_APROVACAO ──► REVISADO ──► EM_ANDAMENTO ──► CONCLUIDO
  (abertura)            (triagem)     (atendimento)    (solução registrada)
```

1. **Abertura:** o condômino (ou o síndico) abre o chamado pelo celular ou desktop, informando categoria, local (prédio, andar, sala), descrição e, se quiser, uma foto. O sistema sugere uma criticidade automaticamente.
2. **Triagem:** o síndico define a prioridade e atribui um prestador de serviços.
3. **Atendimento:** o prestador inicia o serviço e lança as despesas (materiais, mão de obra), com anexos como nota fiscal e recibo.
4. **Conclusão:** o prestador registra a solução e os materiais usados. Se houver despesa pendente de aprovação do síndico, a conclusão fica bloqueada.

Toda transição de status gera um registro de histórico com autor, data/hora e observação.

## Perfis de acesso

| Perfil | O que pode fazer |
| :--- | :--- |
| **Condômino** | Abre chamados e acompanha apenas os próprios. |
| **Prestador de Serviços** | Vê os chamados da sua especialidade e os atribuídos a ele; inicia, lança despesas e conclui. Pode ser profissional autônomo (CPF) ou empresa (CNPJ). |
| **Síndico** | Faz a triagem (prioridade e atribuição), aprova ou rejeita despesas, abre chamados e acessa os relatórios. |
| **Administrador** | Acesso total, inclusive gestão de usuários e cargos. |

Na API, os perfis são `CONDOMINO`, `PRESTADOR`, `SINDICO` e `ADMINISTRADOR`.

> **Atenção:** no banco de dados, o enum `papel` ainda usa os nomes antigos (`SOLICITANTE`, `TECNICO`, `GESTOR`), assim como a coluna `tecnico_id`. A conversão para os nomes novos é feita em `backend/src/database/mappers/papel.mapper.ts` até a migração do enum.

---

## O que já está implementado

### Frontend (`frontend/`)
- Login, cadastro, recuperação e redefinição de senha; gestão da própria conta (dados, foto, exclusão).
- **Dashboard** com indicadores (abertos, concluídos, aguardando triagem, críticos pendentes), distribuição por status, prioridade e categoria, e a **fila de triagem do síndico** listando os chamados aguardando aprovação.
- **Lista de chamados** com busca e filtros (status, prioridade, categoria e condômino), filtros compartilháveis pela URL, **alternância entre cards e lista compacta** e **paginação**.
- Abertura de chamado com foto; detalhe do chamado com triagem, atendimento, conclusão, histórico e despesas (lançamento, anexos, aprovação e rejeição).
- **Relatório de despesas** para síndico e administrador.
- Gestão de usuários e cargos (administrador).
- Controle de acesso por perfil nas rotas e na interface; validação das respostas da API com Zod.
- Componente de campo monetário com máscara de R$ (`CampoMoeda`).

### Backend (`backend/`)
- API REST em NestJS sob o prefixo `/api`, com validação global dos dados de entrada.
- Autenticação e autorização por perfil (guards `AuthGuard` e `RolesGuard`).
- Regras de negócio do fluxo de chamados, histórico de movimentações e bloqueio de conclusão com despesas pendentes.
- Sugestão automática de criticidade na abertura (classificador por regras e palavras-chave).
- Despesas e anexos com aprovação/rejeição; relatório de despesas.
- Integração com **PostgreSQL via TypeORM** (entidades, repositórios e mappers). A migração dos serviços para o banco está em andamento, e parte dos dados ainda passa pela camada em memória (`StoreService`).

### Banco de dados (`db/`)
- Modelo de dados completo (minimundo, conceitual, lógico e físico) em [`db/modelo-de-dados.md`](db/modelo-de-dados.md).
- DDL em SQL separado por etapa (tipos, tabelas, chaves estrangeiras, CHECK da RN04, índices), incluindo despesas e anexos.
- Script de provisionamento: [`db/scripts/iniciar-banco.ps1`](db/scripts/iniciar-banco.ps1).

### QA (`qa/`)
- [Plano de testes](qa/plano-de-testes.md) com matriz de rastreabilidade e massa de dados.
- Coleção do Postman para testes de API e roteiro de testes E2E com Playwright. Veja [`qa/README.md`](qa/README.md).

---

## Situação dos requisitos

### Requisitos Funcionais (RF)
| Código | Requisito | Situação |
| :--- | :--- | :--- |
| RF01 | Cadastro e login segmentados por perfil | ✅ Implementado |
| RF02 | Abertura de chamado com categoria, local e descrição | ✅ Implementado (com foto opcional) |
| RF03 | Gestão de status do chamado | ✅ Implementado, com 4 status: Aguardando aprovação, Revisado, Em andamento e Concluído |
| RF04 | Histórico de movimentações (quem, o quê, quando) | ✅ Implementado |
| RF05 | Dashboard com métricas de chamados | 🟡 Parcial: abertos, críticos pendentes e categorias. Faltam o MTTR e o ranking de locais |
| RF06 | Busca e filtros por período, local, categoria, prestador, prioridade e status | 🟡 Parcial: todos disponíveis na API; a tela ainda não filtra por período, local e prestador |

### Regras de Negócio (RN)
| Código | Regra | Situação |
| :--- | :--- | :--- |
| RN01 | O condômino só vê e interage com os próprios chamados | ✅ Implementado |
| RN02 | Só o síndico define a prioridade (inclusive "Crítica") e atribui o prestador | ✅ Implementado |
| RN03 | O prestador só altera chamados atribuídos a ele | ✅ Implementado |
| RN04 | A conclusão exige o registro da solução e dos materiais | ✅ Implementado (API e CHECK no banco) |

### Requisitos Não Funcionais (RNF)
| Código | Requisito | Situação |
| :--- | :--- | :--- |
| RNF01 | Interface mobile-first e responsiva | ✅ Implementado |
| RNF02 | Rota `/health` e logs estruturados | 🟡 Parcial: `/health` existe; faltam os logs estruturados |
| RNF03 | Testes automatizados em CI/CD a cada Pull Request | 🟡 Parcial: testes unitários e e2e existem; o pipeline de CI ainda não foi configurado |

O planejamento das próximas entregas está no [**BACKLOG.md**](BACKLOG.md).

---

## Stack

| Camada | Tecnologias |
| :--- | :--- |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, React Router, Zod |
| Backend | Node.js, NestJS, TypeScript, class-validator, bcrypt |
| Banco de dados | PostgreSQL, TypeORM |
| Testes | Vitest e Testing Library (frontend), Vitest e Supertest (backend), Postman, Playwright |

Arquitetura atual: um monólito NestJS (API) e uma SPA React, em repositório único (monorepo).

## Estrutura do repositório

```text
.
├── backend/    API NestJS (src/ e testes e2e em test/)
├── frontend/   SPA React + Vite
├── db/         Modelo de dados, DDL e script de provisionamento
├── qa/         Plano de testes, Postman e roteiro E2E
└── BACKLOG.md  Ajustes e implementações planejados
```

---

## Como rodar localmente

**Pré-requisitos:** Node.js 22+, npm e PostgreSQL 14+.

### 1. Banco de dados
```powershell
.\db\scripts\iniciar-banco.ps1
```
Detalhes e opções em [`db/README.md`](db/README.md).

### 2. Backend
```bash
cd backend
npm install
# crie o .env seguindo backend/.env.example (DATABASE_URL ou DB_HOST/DB_USER/...)
npm run start:dev
```
A API sobe em `http://localhost:3000/api`. Verifique com `GET /api/health`.

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
A interface abre em `http://localhost:5173`. O Vite redireciona `/api` para o backend.

### Usuários de teste
Todos usam a senha `123456`.

| Usuário | E-mail | Perfil |
| :--- | :--- | :--- |
| Ana Souza | `ana@predial.com` | Condômino |
| Carlos Lima | `carlos@predial.com` | Condômino |
| João Eletricista | `joao@predial.com` | Prestador de Serviços (Elétrica) |
| Marta Encanadora | `marta@predial.com` | Prestador de Serviços (Hidráulica) |
| Ricardo Síndico | `ricardo@predial.com` | Síndico |
| Tiago TI | `tiago@predial.com` | Administrador |

### Testes
```bash
# backend
cd backend
npm test            # unitários
npm run test:e2e    # end-to-end da API

# frontend
cd frontend
npm test
npm run lint
```

---

## Principais rotas da API

Todas sob `/api`. As rotas autenticadas exigem o header `x-usuario-id`.

| Método | Rota | Acesso |
| :--- | :--- | :--- |
| GET | `/health` | Público |
| POST | `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password` | Público |
| GET, PATCH, DELETE | `/me` | Autenticado |
| GET | `/usuarios/resumo` | Autenticado |
| GET, POST, PATCH, DELETE | `/usuarios`, `/usuarios/:id/role`, `/usuarios/:id` | Administrador |
| GET | `/chamados`, `/chamados/:id` | Autenticado (recorte por perfil) |
| POST | `/chamados` | Condômino, Síndico, Administrador |
| POST | `/chamados/:id/aprovar` | Síndico, Administrador |
| POST | `/chamados/:id/iniciar` | Prestador, Síndico, Administrador |
| POST | `/chamados/:id/concluir` | Prestador, Administrador |
| GET, POST, PATCH, DELETE | `/chamados/:id/despesas` (e anexos) | Prestador, Síndico, Administrador |
| POST | `/chamados/:id/despesas/:despesaId/aprovar` e `/rejeitar` | Síndico, Administrador |
| GET | `/relatorios/despesas` | Síndico, Administrador |

Filtros de `GET /chamados`: `status`, `prioridade`, `categoria`, `prestadorId`, `predio`, `q` (busca), `de` e `ate` (período).

---

## Colaboradores

| Nome | Função no Projeto | GitHub |
| :--- | :--- | :--- |
| **Arthur José** | QA | [@ArthurJoseV](https://github.com/ArthurJoseV) |
| **David Ezequiel** | Desenvolvedor Backend | [@David-DEV2005](https://github.com/David-DEV2005) |
| **Elton Santos** | Arquitetura e Infra | [@Elton-dev01](https://github.com/Elton-dev01) |
| **Enderson Carvalho** | Desenvolvedor Fullstack | [@EndersonCarvalh0](https://github.com/EndersonCarvalh0) |
| **Jefferson Felipe** | DBA | [@isjustjefferson](https://github.com/isjustjefferson) |
| **Vinícius Castro** | Desenvolvedor Frontend | [@vinicastro](https://github.com/vinicastro) |

---

*Projeto desenvolvido para a disciplina de Projeto Web.*
