# Levantamento de Ajustes e Implementações do Sistema

Este documento reúne todos os pontos de melhoria, correções de fluxo e novas funcionalidades discutidas durante a revisão do sistema de gestão de chamados condominiais, divididos por área de atuação.

---

## 💻 Frontend

* [ ] **Exibição da fila de triagem do gestor:** Ajustar a seção "Fila de triagem do gestor" na tela inicial para exibir diretamente na listagem os chamados que constam como "aguardando aprovação".
* [ ] **Alternância de visualização de chamados:** Criar um botão na tela de chamados para alternar (chavear) entre duas exibições: a visão detalhada em cards (atual, que ocupa mais espaço) e uma visão mais compacta em formato de lista.
* [ ] **Máscara de formatação monetária:** Implementar formatação automática de moeda (R$) durante a digitação nos campos de lançamento de custos/despesas de materiais e mão de obra.
* [ ] **Preenchimento e correção manual do OCR:** Garantir na interface que, caso a leitura automática da nota fiscal (OCR) falhe ou extraia um valor inválido, o usuário tenha a opção de preencher ou corrigir o valor total manualmente.
* [ ] **Aba de orçamento:** Criar uma aba ou seção específica na tela do chamado dedicada exclusivamente ao envio, visualização e gerenciamento de orçamentos.

---

## ⚙️ Backend

* [ ] **Classificador de criticidade com IA:** Substituir a lógica atual baseada em palavras-chave estáticas por um modelo de classificação inteligente para sugerir a criticidade dos chamados automaticamente na abertura.
* [ ] **Extração de dados de Notas Fiscais via OCR:** Implementar um serviço de OCR (Reconhecimento Óptico de Caracteres) para processar as imagens/arquivos das notas fiscais anexadas, extrair o texto e identificar automaticamente o valor total de cada nota, somando ao custo total.
* [ ] **Validação e aprovação de despesas:** Garantir a regra de negócio onde o prestador só pode concluir um chamado que possua despesas/notas fiscais anexadas após a aprovação do gestor ou administrador (permitindo conclusão direta apenas caso não haja despesas pendentes de aprovação).

---

## 🚀 FullStack

* [ ] **Paginação na listagem de chamados:** Implementar paginação tanto na API (Backend) quanto na interface (Frontend) para substituir o carregamento contínuo (*scroll* infinito), evitando sobrecarga de memória e lentidão quando o sistema atingir um grande volume de chamados.
* [ ] **Renomeação de perfis de usuário:** Atualizar a nomenclatura dos perfis em todas as camadas do sistema (telas, rotas, regras de negócio e constantes):
  * Alterar **Solicitante** para **Condômino** (visto que o síndico também pode atuar como solicitante).
  * Alterar **Técnico** para **Prestador de Serviço** (ou **Prestador**), abrangendo tanto profissionais autônomos (CPF, como engenheiros e arquitetos) quanto empresas (CNPJ).
* [ ] **Fluxo e etapa intermediária de Orçamento:** Desenvolver uma etapa opcional no fluxo do chamado onde o prestador de serviço pode submeter um orçamento prévio (ou cobrança de visita técnica) que precisa ser aprovado pelo gestor antes da execução efetiva do serviço.

---

## 🏗️ Arquitetura e Infra

* [ ] **Avaliação e hospedagem de modelos leves (IA e OCR):** Pesquisar e testar a viabilidade técnica de rodar modelos classificadores menores localmente (evitando custos e peso de grandes LLMs), avaliando alternativas *open-source* baseadas na arquitetura JEV (como o **Laya**) ou o treinamento de um classificador próprio.
* [ ] **Infraestrutura para OCR:** Dimensionar e configurar o ambiente para a execução local de um modelo leve de OCR para processamento de imagens das notas fiscais sem exigir hardware de alto custo.

---

## 🗄️ DBA (Banco de Dados)

* [ ] **Atualização de domínios de perfis:** Atualizar os registros, *enums* ou tabelas de domínio referentes aos perfis de acesso para refletir a mudança de `Solicitante` para `Condômino` e de `Técnico` para `Prestador de Serviço`.
* [ ] **Modelagem de Orçamentos e Notas Fiscais:** Estruturar ou ajustar as tabelas do banco de dados para suportar a nova etapa/aba de orçamentos (com seus respectivos status de aprovação/recusa) e armazenar os dados extraídos automaticamente das notas fiscais via OCR.

---

## 🧪 QA (Quality Assurance)

* [ ] **Revisão da acurácia na triagem de criticidade:** Elaborar e validar casos de teste para a classificação automática de prioridade (corrigindo distorções como o cenário demonstrado, onde uma "falta de energia no apartamento" inteiro foi classificada apenas como *média*, quando deveria ter criticidade *alta* ou *crítica* por afetar toda a unidade e não apenas uma tomada isolada).
* [ ] **Testes de fluxo de aprovação e exceções:**
  * Validar o bloqueio de conclusão de chamado pelo prestador enquanto houver despesas pendentes de aprovação.
  * Testar os cenários de aprovação, rejeição e remoção de despesas pelo perfil de Gestor/Administrador.
  * Validar o fluxo opcional de envio e aprovação de orçamento prévio.
  * Realizar testes de fallback (inserção manual) quando o OCR não conseguir ler a nota fiscal anexada.
  * Testar a performance e o funcionamento da paginação na listagem geral de chamados.
