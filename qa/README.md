# 🛡️ Diretório de Garantia da Qualidade (QA)

**Responsável:** Arthur José ([@ArthurJoseV](https://github.com/ArthurJoseV))  
**Projeto:** Sistema de Gestão de Chamados de Manutenção Predial  
**Stack de Testes:** Vitest, Postman, Playwright  

---

## 📌 Estrutura do Diretório de QA

Este diretório centraliza todas as estratégias, artefatos, documentações e automações de testes do sistema:

```text
qa/
├── README.md                      # Este guia geral de QA
├── plano-de-testes.md             # Plano de Testes formal (matriz de rastreabilidade, massa de dados e casos de teste)
├── postman/                       # Validação e testes de regressão de API
│   ├── Gestao_Chamados.postman_collection.json
│   ├── Local.postman_environment.json
│   └── README.md                  # Instruções de execução no Postman e Newman
└── e2e/                           # Testes End-to-End automatizados no navegador (Playwright)
    └── README.md                  # Especificação e roteiro dos fluxos E2E
```

---

## 🎯 Entregas de QA no Projeto

| Entrega | Ferramenta / Arquivo | Status | Descrição |
| :--- | :--- | :---: | :--- |
| **Plano de Testes** | [plano-de-testes.md](file:///c:/Users/arthu/OneDrive/Área de Trabalho/PDW/qa/plano-de-testes.md) | ✅ Concluído | Mapeamento de RF01 a RF06, RN01 a RN04 e casos de teste detalhados |
| **Testes de API** | [postman/](file:///c:/Users/arthu/OneDrive/Área de Trabalho/PDW/qa/postman) | ✅ Concluído | Coleção com 24 asserções automatizadas cobrindo 100% dos endpoints |
| **Testes E2E (Web)** | [e2e/](file:///c:/Users/arthu/OneDrive/Área de Trabalho/PDW/qa/e2e) | 🟡 Em planejamento | Automação do fluxo completo de ponta a ponta com Playwright |
| **Auditoria & Bugs** | Seção 6 do Plano de Testes | ✅ Mapeado | Identificação e documentação de 5 bugs e vulnerabilidades de segurança |

---

## 🚀 Como Executar os Testes

### 1. Testes de API (Postman)
Consulte o guia dedicado em [qa/postman/README.md](file:///c:/Users/arthu/OneDrive/Área de Trabalho/PDW/qa/postman/README.md) para importar a coleção e rodar via Runner.

### 2. Testes Existentes da Aplicação (Backend e Frontend)
Para rodar todos os testes unitários e de integração existentes no projeto:

```powershell
# No Backend (Vitest - 80 testes)
cd backend
npm test
npm run test:e2e

# No Frontend (Vitest - 59 testes)
cd ../frontend
npm test
```
