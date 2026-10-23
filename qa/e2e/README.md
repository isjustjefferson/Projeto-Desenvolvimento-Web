# 🎭 Testes End-to-End (E2E) com Playwright

**Responsável:** Arthur José (QA)  
**Status:** Estrutura preparada para automação  

Esta pasta abrigará os testes automatizados de ponta a ponta simulando as ações de usuários reais nos navegadores Chromium, Firefox e WebKit.

---

## 📋 Cenários que serão automatizados aqui

1. **Jornada Completa do Chamado:**
   * Login como **Ana Souza** (*Solicitante*).
   * Abertura de chamado de manutenção com categoria e local.
   * Logout.
   * Login como **Ricardo Síndico** (*Gestor*).
   * Aprovação do chamado e atribuição ao técnico **João Eletricista**.
   * Logout.
   * Login como **João Eletricista** (*Técnico*).
   * Iniciar chamado e Concluir chamado informando materiais e solução (validação de RN04).
   * Logout.
2. **Validação de Permissões Visuais (RBAC):**
   * Solicitante não visualiza botões de aprovação/atribuição.
   * Bloqueio visual para usuários não autenticados.
