# 📮 Coleção Postman — Validação de API (QA)

**Responsável:** Arthur José (QA)  
**Projeto:** Sistema de Gestão de Chamados de Manutenção Predial  

Esta pasta contém a suíte oficial de testes de API do projeto, cobrindo autenticação, controle de permissões (RBAC) e o ciclo de vida dos chamados (RN01 a RN04).

---

## 📂 Arquivos Disponíveis

1. `Gestao_Chamados.postman_collection.json`: Coleção contendo todas as requisições organizadas por módulos, com scripts de teste automatizados em JavaScript (`pm.test`).
2. `Local.postman_environment.json`: Variáveis de ambiente configuradas para o backend rodando localmente em `http://localhost:3000`.

---

## 🚀 Como Importar e Usar no Postman (Passo a Passo)

### 1. Importar no Postman
1. Abra o **Postman**.
2. Clique no botão **Import** (canto superior esquerdo).
3. Arraste os dois arquivos desta pasta (`Gestao_Chamados.postman_collection.json` e `Local.postman_environment.json`) para a janela do Postman.

### 2. Selecionar o Ambiente
No canto superior direito do Postman, onde diz *"No Environment"*, selecione:
👉 **`Gestão Chamados - Local`**

### 3. Executar os Testes
Você pode:
* **Executar requisição por requisição:** Abrir qualquer requisição e clicar no botão azul **Send**.
* **Executar toda a suíte automaticamente (Runner):**
  1. Clique com o botão direito na coleção **"Sistema de Gestão de Chamados - API"**.
  2. Selecione **Run collection**.
  3. Clique no botão **Run Sistema de Gestão de Chamados**.
  4. O Postman executará todos os testes e exibirá o relatório verde de testes aprovados.

---

## 🧪 Cenários Automatizados na Coleção

* **01 - Autenticação & Perfil:**
  * Login com sucesso (salva o ID dinamicamente no ambiente e valida que a senha não é exposta)
  * Login com senha incorreta (validação de `401 Unauthorized`)
  * Auto-registro de novo Solicitante
  * Recuperação de senha
  * Consulta do perfil logado (`GET /api/me`)
* **02 - Chamados (Ciclo de Vida):**
  * Criação de chamado pelo Solicitante (`POST /api/chamados`)
  * Validação de isolamento do Solicitante — RN01 (`GET /api/chamados`)
  * Aprovação e atribuição de prioridade/técnico pelo Gestor — RN02 (`POST /aprovar`)
  * Início de atendimento pelo Técnico — RN03 (`POST /iniciar`)
  * Bloqueio de encerramento sem solução e materiais — RN04 (`POST /concluir` -> `400 Bad Request`)
  * Conclusão com sucesso informando materiais e solução — RN04 (`POST /concluir` -> `200 OK`)
* **03 - Gestão de Usuários:**
  * Listagem autorizada para Administrador
  * Bloqueio `403 Forbidden` para perfis comuns
* **04 - Health & Infra:**
  * Health check e tempo de resposta inferior a 500ms
