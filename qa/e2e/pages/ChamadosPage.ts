import type { Page, Locator } from '@playwright/test';

/**
 * Page Object para a lista de chamados (/chamados) e formulário de novo chamado (/chamados/novo).
 */
export class ChamadosPage {
  readonly page: Page;

  // --- Lista ---
  readonly tituloPagina: Locator;
  readonly campoBusca: Locator;
  readonly filtroStatus: Locator;
  readonly filtroPrioridade: Locator;
  readonly filtroCategoria: Locator;
  readonly botaoModoCards: Locator;
  readonly botaoModoLista: Locator;

  // --- Formulário Novo Chamado ---
  readonly campoTitulo: Locator;
  readonly campoCategoria: Locator;
  readonly campoBloco: Locator;
  readonly campoAndar: Locator;
  readonly campoLugar: Locator;
  readonly campoDescricao: Locator;
  readonly botaoAbrir: Locator;
  readonly botaoCancelar: Locator;
  readonly mensagemErro: Locator;

  constructor(page: Page) {
    this.page = page;

    // Lista (os selects de filtro em ChamadosLista.tsx não possuem label/name)
    this.tituloPagina = page.getByRole('heading', { name: /^chamados$/i });
    this.campoBusca = page.getByPlaceholder(/buscar por título ou local/i);
    this.filtroStatus = page
      .locator('select')
      .filter({ has: page.locator('option[value="AGUARDANDO_APROVACAO"]') });
    this.filtroPrioridade = page
      .locator('select')
      .filter({ has: page.locator('option[value="CRITICA"]') });
    this.filtroCategoria = page
      .locator('select')
      .filter({ has: page.locator('option[value="ELETRICA"]') });
    this.botaoModoCards = page.getByRole('button', { name: 'Visualização em cards' });
    this.botaoModoLista = page.getByRole('button', { name: 'Visualização em lista' });

    // Formulário
    this.campoTitulo = page.getByPlaceholder(/tomada sem energia/i);
    this.campoCategoria = page.locator('form select').first();
    this.campoBloco = page.getByPlaceholder(/bloco\/torre/i);
    this.campoAndar = page.getByPlaceholder(/^andar$/i);
    this.campoLugar = page.getByPlaceholder(/^lugar$/i);
    this.campoDescricao = page.getByPlaceholder(/descreva o que está acontecendo/i);
    this.botaoAbrir = page.getByRole('button', { name: /abrir chamado/i });
    this.botaoCancelar = page.getByRole('button', { name: /cancelar/i });
    this.mensagemErro = page.locator('form .rounded-lg.bg-red-500');
  }

  async abrirLista() {
    await this.page.goto('/chamados');
    await this.tituloPagina.waitFor({ state: 'visible' });
  }

  async abrirFormulario() {
    await this.page.goto('/chamados/novo');
    await this.campoTitulo.waitFor({ state: 'visible' });
  }

  async preencherFormulario(dados: {
    titulo: string;
    categoria?: string;
    bloco: string;
    andar?: string;
    lugar?: string;
    descricao: string;
  }) {
    await this.campoTitulo.fill(dados.titulo);
    if (dados.categoria) {
      await this.campoCategoria.selectOption({ label: dados.categoria });
    }
    await this.campoBloco.fill(dados.bloco);
    if (dados.andar) await this.campoAndar.fill(dados.andar);
    if (dados.lugar) await this.campoLugar.fill(dados.lugar);
    await this.campoDescricao.fill(dados.descricao);
  }

  async submeter(): Promise<number> {
    await this.botaoAbrir.click();
    await this.page.waitForURL(/\/chamados\/\d+/, { timeout: 15_000 });
    const match = this.page.url().match(/\/chamados\/(\d+)/);
    return Number(match?.[1]);
  }
}
