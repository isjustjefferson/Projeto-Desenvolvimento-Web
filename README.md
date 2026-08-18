# FiscalizaContrato 

## Resumo do Projeto
O **FiscalizaContrato** é uma solução GovTech desenvolvida como projeto acadêmico que visa transformar o acompanhamento de contratos públicos em um fluxo estruturado e rastreável. O escopo do sistema é estritamente focado na execução da fiscalização, e não visa ser um ERP completo de gestão financeira, compras ou licitações.
A plataforma busca resolver o problema do acompanhamento fragmentado — criando uma memória operacional do contrato.A solução permite que fiscais, gestores e o setor administrativo acompanhem obrigações, preencham checklists de inspeção, registrem ocorrências e anexem evidências concretas.

---

## Levantamento de Requisitos (MVP)

### Requisitos Funcionais (RF)
* RF01: O sistema deve permitir o cadastro e o gerenciamento de contratos, fornecedores e fiscais responsáveis.
* RF02: O sistema deve permitir o vínculo de obrigações específicas a cada contrato e a geração de um calendário de acompanhamento.
* RF03: O sistema deve disponibilizar checklists padronizados para a realização da fiscalização periódica.
* RF04: O sistema deve permitir o upload de arquivos e imagens como evidências durante as inspeções contratuais.
* RF05: O sistema deve permitir o registro de ocorrências e a geração de notificações em caso de falhas ou irregularidades do fornecedor.
* RF06: O sistema deve manter um histórico consolidado das ações executadas e exibir um dashboard gerencial com os indicadores do contrato.

### Requisitos Não Funcionais (RNF)
* RNF01: O sistema deve possuir um controle de acesso baseado em papéis (RBAC forte), garantindo o isolamento das informações por secretaria.
* RNF02: O sistema deve proteger o acesso a documentos privados e manter um log de auditoria para rastrear todas as alterações sensíveis.
* RNF03: A interface do usuário deve ser construída de forma responsiva para a estruturação e interatividade das telas.
* RNF04: A API e a lógica de negócio central devem assegurar o processamento ágil e a fácil integração de regras.
* RNF05: Os dados relacionais do sistema devem ser modelados e armazenados de forma persistente.
* RNF06: A aplicação deve ser totalmente conteinerizada com Docker para padronizar os ambientes de desenvolvimento e produção.

---

## Insights de Arquitetura e Decisões Iniciais
* Arquitetura: Microsserviços.
* Frontend: React, Vite, TypeScript, Tailwind CSS.
* Backend / API: -- 
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
| **Vinícius Castro** | Desenvolvedor Frontend | [@vinicastro](https://github.com/vinicastro) |

---
*Projeto desenvolvido para a disciplina de Projeto Web.*
