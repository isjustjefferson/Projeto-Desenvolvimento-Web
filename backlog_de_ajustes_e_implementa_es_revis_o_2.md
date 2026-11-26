# Levantamento de Ajustes e Implementações do Sistema (Revisão 2)

Este documento reúne todos os novos pontos de melhoria, correções e funcionalidades discutidas durante a segunda revisão do sistema de gestão de chamados condominiais, organizados por área de responsabilidade.

## 💻 Frontend

* [ ] **Leitura de QR Code e Upload de Nota Fiscal:**
  * Implementar suporte para leitura do QR Code da Nota Fiscal Eletrônica diretamente pela câmera quando o usuário estiver acessando pelo celular.
  * Garantir o fluxo no desktop/notebook para envio de foto/arquivo (PDF ou JPEG) da nota fiscal para carregamento automático dos dados.
* [x] **Seletor de quantidade de itens por página:** Embora a paginação já esteja funcionando com o padrão de 6 chamados por página, adicionar um seletor na interface para que o usuário possa escolher quantos elementos deseja visualizar por página.
* [x] **Remoção do ícone flutuante ("esferas"/chat):** Remover da tela o componente visual de teste (`stack` / botão flutuante em formato de esfera).
* [x] **Melhoria na responsividade Mobile:** Refinar o layout para telas de celular, ajustando componentes e tabelas/cards que ainda ficam espremidos ou desalinhados em resoluções menores.

## ⚙️ Backend

* [ ] **Integração com API de Nota Fiscal e Parse de XML:**
  * A partir da chave de acesso de 44 dígitos (ou do link lido pelo QR Code), consultar a API da Fazenda/Receita Estadual (para notas de produto) ou Municipal (para notas de serviço) para obter o XML da nota fiscal.
  * Implementar o *parse* do XML para extrair e listar automaticamente os itens comprados, fornecedor e valores gastos.
* [ ] **Extração de dados da Nota Fiscal via OCR / Visão Computacional (Fallback):** Caso haja restrição de acesso às APIs governamentais ou o usuário envie apenas uma foto/PDF/JPEG do comprovante, processar a imagem via OCR/Visão Computacional para extrair o texto e detalhar os gastos e itens da nota.

## 🚀 FullStack

* [x] **Funcionalidade de Recusar Chamado na Triagem:** Adicionar o botão de "Recusar chamado" na tela do Síndico (Gestor) e a respectiva rota/regra de negócio no backend, permitindo que um chamado aberto por um condômino seja recusado durante a triagem caso não proceda.
* [x] **Validador de CPF e CNPJ no cadastro de despesas:** Implementar a validação matemática (dígitos verificadores) e máscara nos campos de CPF e CNPJ do fornecedor ao lançar uma despesa no chamado, bloqueando documentos inválidos tanto no formulário quanto na API.

## 🏗️ Arquitetura e Infra

* [ ] **Pesquisa de viabilidade de APIs Fiscais vs. OCR:** Avaliar a disponibilidade, custos e restrições técnicas (como exigência de certificado digital A1/A3) das APIs de consulta de NF-e/NFC-e/NFS-e por chave de acesso, definindo a arquitetura de *fallback* para o motor de OCR/Visão Computacional.
* [ ] **Monitoramento do banco em nuvem (Supabase):** Manter o acompanhamento da integração recém-migrada para o Supabase para garantir estabilidade nas novas operações de armazenamento de notas e anexos.

## 🗄️ DBA (Banco de Dados)

* [ ] **Ampliação da carga de dados (*Seed*) de Prestadores de Serviço:** Cadastrar novos prestadores de serviço no banco de dados contemplando outras especialidades além das duas atuais (Elétrica e Hidráulica), tornando o sistema e as demonstrações mais dinâmicos.
* [ ] **Estrutura para itens detalhados da Nota Fiscal:** Ajustar/criar tabelas ou colunas necessárias para armazenar o detalhamento dos itens extraídos via XML/OCR da nota fiscal e o status/motivo de chamados recusados na triagem.

## 🧪 QA (Quality Assurance)

* [x] **Testes de validação de CPF/CNPJ:** Testar a inserção de CPFs e CNPJs inválidos, incompletos ou com dígitos repetidos no formulário de despesas para garantir que o validador bloqueie o envio.
* [x] **Testes do fluxo de recusa de chamado:** Validar o comportamento do sistema quando o Síndico recusa um chamado (verificando atualização de status, histórico e visualização para o Condômino).
* [x] **Testes de paginação dinâmica:** Validar a troca do limite de itens por página (além do padrão de 6 itens) combinada com os filtros de categoria e modos de exibição (lista vs. blocos).
* [x] **Testes de responsividade e câmera em dispositivos móveis:** Validar a usabilidade das telas em diferentes tamanhos de tela mobile e testar a abertura da câmera para leitura de QR Code de notas fiscais.