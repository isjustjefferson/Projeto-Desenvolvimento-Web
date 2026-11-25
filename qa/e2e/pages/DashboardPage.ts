import type { Page, Locator } from '@playwright/test';

/**
 * Page Object para o Dashboard (rota raiz /).
 */
export class DashboardPage {
  readonly page: Page;
  readonly titulo: Locator;
  readonly secaoFilaTriagem: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titulo = page.getByRole('heading', { name: /dashboard geral/i });
    this.secaoFilaTriagem = page.getByRole('region', {
      name: /fila de triagem do síndico/i,
    });
  }

  async abrir() {
    await this.page.goto('/');
  }

  async aguardarCarregamento() {
    await this.titulo.waitFor({ state: 'visible', timeout: 15_000 });
  }
}
