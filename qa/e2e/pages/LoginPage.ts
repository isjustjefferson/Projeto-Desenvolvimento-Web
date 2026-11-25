import type { Page, Locator } from '@playwright/test';

/**
 * Page Object para a tela de Login (/login).
 */
export class LoginPage {
  readonly page: Page;
  readonly campoEmail: Locator;
  readonly campoSenha: Locator;
  readonly botaoEntrar: Locator;
  readonly linkEsqueciSenha: Locator;
  readonly linkCriarConta: Locator;
  readonly mensagemErro: Locator;

  constructor(page: Page) {
    this.page = page;
    this.campoEmail = page.locator('#login-email');
    this.campoSenha = page.locator('#login-senha');
    this.botaoEntrar = page.getByRole('button', { name: /^entrar$/i });
    this.linkEsqueciSenha = page.getByRole('link', { name: /esqueci a senha/i });
    this.linkCriarConta = page.getByRole('link', { name: /criar conta/i });
    this.mensagemErro = page.locator('form .rounded-lg.bg-red-500');
  }

  async abrir() {
    await this.page.goto('/login');
  }

  async login(email: string, senha: string) {
    await this.campoEmail.fill(email);
    await this.campoSenha.fill(senha);
    await this.botaoEntrar.click();
  }

  async aguardarErro() {
    await this.mensagemErro.waitFor({ state: 'visible' });
    return this.mensagemErro.textContent();
  }
}
