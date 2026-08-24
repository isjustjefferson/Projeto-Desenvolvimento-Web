# Sistema de Gestão de Chamados de Manutenção

## Escopo do Projeto
O projeto consiste em uma plataforma web responsiva para centralizar, gerenciar e rastrear chamados de manutenção predial (elétrica, hidráulica, climatização, mobiliário, etc.). O objetivo é substituir fluxos informais de comunicação por um processo auditável e estruturado.

O fluxo de vida do chamado segue uma esteira clara:
1. **Identificação e Abertura:** O usuário identifica o problema e abre o chamado (via mobile ou desktop), detalhando local e categoria.
2. **Triagem:** O gestor avalia a demanda, define a prioridade e faz a atribuição.
3. **Atendimento:** O técnico assume o chamado e, após o conserto, registra a solução e os materiais utilizados.
4. **Encerramento:** O gestor (ou o próprio usuário) encerra o chamado.

---

## Levantamento de Requisitos

### Requisitos Funcionais (RF)
* **RF01:** O sistema deve possuir cadastro e login segmentado por perfis (Solicitante, Técnico, Gestor e Administrador).
* **RF02:** O sistema deve permitir a abertura de chamados com informações detalhadas: categoria (elétrica, hidráulica, etc.), local (prédio, andar, sala) e descrição do problema.
* **RF03:** O sistema deve permitir a gestão de status do chamado (Aberto, Em triagem, Atribuído, Em andamento, Aguardando material, Resolvido, Encerrado).
* **RF04:** O sistema deve manter um histórico de movimentações, registrando quem alterou o status, qual foi a mudança e a data/hora da ação.
* **RF05:** O sistema deve apresentar um painel (dashboard) com métricas de chamados abertos, críticos pendentes, tempo médio de resolução (MTTR) e categorias/locais com mais ocorrências.
* **RF06:** O sistema deve disponibilizar busca e filtros por período, local, categoria, técnico, prioridade e status.

### Regras de Negócio (RN)
* **RN01:** Um usuário Solicitante só pode visualizar e interagir com os seus próprios chamados.
* **RN02:** Apenas o perfil Gestor tem permissão para elevar a prioridade de um chamado para "Crítica" ou atribuí-lo a um Técnico.
* **RN03:** Um Técnico só pode alterar o status de chamados que estejam explicitamente atribuídos a ele.
* **RN04:** O sistema deve bloquear o encerramento de um chamado caso não haja o registro em texto da solução aplicada e dos materiais utilizados.

### Requisitos Não Funcionais (RNF)
* **RNF01:** A interface deve ser "mobile-first" e responsiva, facilitando a abertura de chamados via smartphone no local do problema.
* **RNF02:** O sistema deve expor uma rota `/health` e gerar logs estruturados para ações críticas e transições de status.
* **RNF03:** O repositório deve rodar testes automatizados (permissões e regras de transição de status) via pipeline de CI/CD em cada *Pull Request*.

---

## Insights de Arquitetura e Decisões Iniciais
* Arquitetura: Microsserviços.
* Frontend: React, Vite, TypeScript, Tailwind CSS.
* Backend / API: Node.js, TypeScript, NestJS
* Banco de Dados: PostgreSQL.
* Infraestrutura Local: Docker.
* Testes / QA: Testes manuais exploratórios, Automação End-to-End (E2E) com Playwright e validação de API com Postman.
  
---

## Colaboradores

| Nome | Função no Projeto | GitHub |
| :--- | :--- | :--- |
| **Arthur José** | QA | [@ArthurJoseV](https://github.com/ArthurJoseV) |
| **David Ezequiel** | Desenvolvedor Backend | [@David-DEV2005](https://github.com/David-DEV2005) |
| **Elton Santos** | Arquitetura e Infra | [@Elton-dev01](https://github.com/Elton-dev01) |
| **Enderson Carvalho** | Desenvolvedor Fullstack | [@EndersonCarvalh0](https://github.com/EndersonCarvalh0) |
| **Jefferson Felipe** | DBA | [@isjustjefferson](https://github.com/isjustjefferson) |
| **Ricardo Fragoso** | Desenvolvedor Backend | [@TheCardo](https://github.com/TheCardo) |
| **Vinícius Castro** | Desenvolvedor Frontend | [@vinicastro](https://github.com/vinicastro) |

---

*Projeto desenvolvido para a disciplina de Projeto Web.*
