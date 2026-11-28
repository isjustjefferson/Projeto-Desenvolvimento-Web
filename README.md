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
- Login, cadastro e gestão da própria conta (dados, foto, exclusão). A recuperação automática aguarda um canal seguro de entrega.
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

A SPA React usa a API NestJS. O ambiente local pode executar a API em um processo ou separar Chamados e Financeiro em dois processos. O código fica no mesmo repositório.

## Estrutura do repositório

```text
.
├── backend/    API NestJS (src/)
├── frontend/   SPA React + Vite
├── db/         Modelo de dados, DDL e script de provisionamento
├── qa/         Testes de backend/frontend, fixtures, configurações, Postman e plano de testes
└── BACKLOG.md  Ajustes e implementações planejados
```

---

## Como rodar localmente

### Com Docker Compose

Na raiz do repositório, use Docker Compose v2 para iniciar Chamados, Financeiro e PostgreSQL local com dados fictícios.

```powershell
$env:FINANCEIRO_TOKEN = [guid]::NewGuid().ToString('N')
docker compose -p predial-local -f compose.yaml -f compose.financeiro.yaml up -d --build --wait
Invoke-RestMethod http://127.0.0.1:3000/api/health
Invoke-RestMethod http://127.0.0.1:3001/api/health
```

Os dois health checks devem retornar `status: ok` e `database: up`. Um retorno `503` com `schema: incomplete` indica que falta a tabela de sessões ou de trabalhos OCR. Em um volume novo, o Compose aplica os scripts de `db/` automaticamente.

Para testar a interface, instale as dependências do frontend com Node.js 24.15 ou superior na série 24 e abra `http://127.0.0.1:5173`. O proxy do Vite encaminha `/api` para Chamados na porta 3000.

```powershell
npm ci --prefix frontend
npm --prefix frontend run dev -- --host 127.0.0.1
```

Em modo separado, Chamados encaminha as rotas de orçamentos, despesas e relatórios ao Financeiro. O Financeiro exige o token da comunicação interna e aplica as permissões de cada operação. A abertura e a consulta de chamados continuam disponíveis se o Financeiro parar. O início e a conclusão ficam bloqueados enquanto o Financeiro estiver indisponível. Chamados e Financeiro ainda usam o mesmo PostgreSQL local nesta etapa, porque as tabelas financeiras têm chaves estrangeiras para chamados e usuários e as transições consultam as pendências no banco atual. A migração para um banco do Financeiro depende da substituição dessas dependências por contratos entre os serviços.

Se o volume local já existir, aplique as migrações de OCR e de sessões antes de atualizar os serviços. Em seguida, execute novamente o comando de subida do Compose.

```powershell
docker compose -p predial-local up -d --wait postgres-chamados
Get-Content -Raw db/11_trabalhos_ocr.sql,db/12_sessoes_autenticacao.sql |
  docker compose -p predial-local exec -T postgres-chamados psql -U chamados_local -d chamados -v ON_ERROR_STOP=1 --single-transaction -f -
```

### Worker PaddleOCR no computador

Use Python 3.11 e defina `OCR_WORKER_TOKEN` antes de subir o Compose. O processo da API e o worker precisam do mesmo valor. Mantenha essa credencial fora do Git. No mesmo terminal, defina também `FINANCEIRO_TOKEN` como na seção anterior.

```powershell
py -3.11 -m venv ocr-worker/.venv
.\ocr-worker\.venv\Scripts\python.exe -m pip install -r ocr-worker/requirements.txt
$env:OCR_WORKER_TOKEN = [guid]::NewGuid().ToString('N')
docker compose -p predial-local -f compose.yaml -f compose.financeiro.yaml up -d --build --wait
.\ocr-worker\.venv\Scripts\python.exe ocr-worker/worker.py --url http://127.0.0.1:3000
```

Depois de salvar uma despesa com imagem JPEG ou PNG, abra **OCR no computador** no anexo e solicite a análise. Os itens aparecem como sugestões de conferência. Os valores financeiros continuam sendo confirmados pela pessoa que usa o sistema. Se o worker parar durante a leitura, outro worker pode retomar o trabalho após o prazo da reserva.

Na primeira execução, o PaddleOCR baixa os modelos e usa o cache local de `ocr-worker`. Se já tiver os modelos do protótipo baixados, defina `OCR_MODELOS_DIR` com o caminho para a pasta `official_models` antes de iniciar o worker.

Para usar com a versão publicada futuramente, aplique a migração no banco de demonstração, publique as alterações do backend e do frontend e configure o token no ambiente da API. Rode o worker com `--url` apontando para a origem HTTPS da API. O computador faz conexões de saída e pode ficar atrás do roteador residencial.

### Sem Docker

**Pré-requisitos:** Node.js 24.15 ou superior na série 24, npm e PostgreSQL 14+.

### 1. Banco de dados
```powershell
.\db\scripts\iniciar-banco.ps1
```
Detalhes e carga das contas de teste em [`db/README.md`](db/README.md).

### 2. Backend
```bash
cd backend
npm ci
# crie o .env seguindo backend/.env.example (DATABASE_URL ou DB_HOST/DB_USER/...)
npm run start:dev
```
Para um PostgreSQL local sem TLS, deixe `DB_SSL` vazio e use uma URL sem `sslmode`. A API sobe em `http://localhost:3000/api`. Verifique com `GET /api/health`.

### 3. Frontend
```bash
cd frontend
npm ci
npm run dev -- --host 127.0.0.1
```
A interface abre em `http://127.0.0.1:5173`. O Vite redireciona `/api` para o backend.

### Usuários de teste
No Compose de desenvolvimento e nos testes automatizados, estas contas de teste usam a senha pública `123456`. Para uma demo publicada, prepare credenciais individuais conforme o [guia do banco na nuvem](db/DEPLOY_NUVEM_SUPABASE.md).

| Usuário | E-mail | Perfil |
| :--- | :--- | :--- |
| Ana Souza | `ana@predial.com` | Condômino |
| Carlos Lima | `carlos@predial.com` | Condômino |
| João Eletricista | `joao@predial.com` | Prestador de Serviços (Elétrica) |
| Marta Encanadora | `marta@predial.com` | Prestador de Serviços (Hidráulica) |
| Ricardo Síndico | `ricardo@predial.com` | Síndico |
| Tiago TI | `tiago@predial.com` | Administrador |

### Testes

Os arquivos e configurações de testes ficam em [`qa/`](qa/README.md). Após instalar as dependências do backend e do frontend, execute a partir da raiz do repositório:

```bash
npm --prefix qa test                   # todas as suítes
npm --prefix qa run test:backend       # unitários do backend
npm --prefix qa run test:api           # integração da API
npm --prefix qa run test:frontend      # componentes, hooks e páginas
```

---

## Principais rotas da API

Todas sob `/api`. O login e o cadastro criam uma sessão de 8 horas e enviam o cookie HttpOnly `predial_sessao`. Chamados e Financeiro validam a sessão e o perfil no banco. O logout revoga a sessão. Clientes de API podem manter o cookie entre requisições usando um armazenamento de cookies.

Em produção, configure `NODE_ENV=production` no backend e sirva o frontend e o proxy de `/api` na mesma origem HTTPS. O proxy público deve preservar `Set-Cookie` nas respostas de login, cadastro e logout e encaminhar `Cookie` nas requisições. O Compose local permite o cookie por HTTP somente para desenvolvimento.

| Método | Rota | Acesso |
| :--- | :--- | :--- |
| GET | `/health` | Público |
| POST | `/auth/login`, `/auth/register`, `/auth/logout` | Sessão |
| POST | `/auth/forgot-password`, `/auth/reset-password` | Recuperação indisponível até configurar um canal seguro |
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
