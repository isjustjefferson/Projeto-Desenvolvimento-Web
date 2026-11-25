import type { Page, Locator } from '@playwright/test';

/**
 * Page Object para a tela de detalhe de um chamado (/chamados/:id).
 */
export class ChamadoDetalhePage {
  readonly page: Page;

  // Informações gerais
  readonly tituloChamado: Locator;
  readonly statusBadge: Locator;
  readonly mensagemSemPermissao: Locator;
  readonly mensagemNaoEncontrado: Locator;

  // Ações do Síndico
  readonly botaoAprovar: Locator;
  readonly botaoRecusar: Locator;

  // Ações do Prestador
  readonly botaoIniciar: Locator;
  readonly botaoConcluir: Locator;

  // Orçamentos e Despesas
  readonly botaoEnviarOrcamento: Locator;
  readonly botaoAdicionarDespesa: Locator;

  // Histórico
  readonly secaoHistorico: Locator;

  constructor(page: Page) {
    this.page = page;

    // Geral
    this.tituloChamado = page.locator('h1').first();
    this.statusBadge = page
      .locator('span')
      .filter({
        hasText: /^(Aguardando Aprovação|Revisado|Em Andamento|Concluído|Recusado)$/,
      })
      .first();
    this.mensagemSemPermissao = page.getByText(
      /você não tem permissão para visualizar este chamado/i,
    );
    this.mensagemNaoEncontrado = page.getByText(/chamado não encontrado/i);

    // Síndico
    this.botaoAprovar = page.getByRole('button', {
      name: /aprovar e liberar chamado/i,
    });
    this.botaoRecusar = page.getByRole('button', { name: /recusar chamado/i });

    // Prestador
    this.botaoIniciar = page.getByRole('button', { name: /iniciar atendimento/i });
    this.botaoConcluir = page.getByRole('button', { name: /concluir chamado/i });

    // Orçamentos & Despesas
    this.botaoEnviarOrcamento = page.getByRole('button', {
      name: /enviar orçamento/i,
    });
    this.botaoAdicionarDespesa = page.getByRole('button', {
      name: /adicionar despesa/i,
    });

    // Histórico
    this.secaoHistorico = page.getByRole('heading', { name: /^histórico$/i });
  }

  async abrir(id: number) {
    await this.page.goto(`/chamados/${id}`);
  }

  private modalPorTitulo(titulo: RegExp): Locator {
    return this.page
      .locator('.fixed.inset-0')
      .filter({ has: this.page.getByRole('heading', { name: titulo }) });
  }

  /**
   * Fluxo de aprovação completo via modal "Aprovar chamado".
   * A prioridade é escolhida via botões e o prestador via <select>.
   */
  async aprovarChamado(prioridade: 'Baixa' | 'Média' | 'Alta' | 'Crítica', nomePrestador: string) {
    await this.botaoAprovar.click();

    const modal = this.modalPorTitulo(/aprovar chamado/i);
    await modal.waitFor({ state: 'visible' });

    await modal.getByRole('button', { name: prioridade, exact: true }).click();

    const selectPrest = modal.locator('select');
    const optionValue = await selectPrest
      .locator('option')
      .evaluateAll((opts, alvo) => {
        const achado = opts.find((o) =>
          (o.textContent ?? '').toLowerCase().includes(alvo.toLowerCase()),
        );
        return achado ? (achado as HTMLOptionElement).value : '';
      }, nomePrestador);

    if (!optionValue) {
      throw new Error(`Prestador "${nomePrestador}" não encontrado no select de aprovação.`);
    }
    await selectPrest.selectOption(optionValue);

    await modal.getByRole('button', { name: /aprovar e atribuir/i }).click();
    await modal.waitFor({ state: 'hidden' });
  }

  /**
   * Fluxo de recusa completo via modal "Recusar chamado".
   */
  async recusarChamado(motivo: string) {
    await this.botaoRecusar.click();

    const modal = this.modalPorTitulo(/recusar chamado/i);
    await modal.waitFor({ state: 'visible' });
    await modal.getByPlaceholder(/informe o motivo da recusa/i).fill(motivo);
    await modal.getByRole('button', { name: /^recusar$/i }).click();
    await modal.waitFor({ state: 'hidden' });
  }

  /**
   * Inicia o atendimento. Se não houver orçamento enviado, confirma o modal
   * "Iniciar sem orçamento?".
   */
  async iniciarChamado() {
    await this.botaoIniciar.click();
    const modalSemOrcamento = this.modalPorTitulo(/iniciar sem orçamento/i);
    const apareceu = await modalSemOrcamento
      .waitFor({ state: 'visible', timeout: 2_000 })
      .then(() => true)
      .catch(() => false);
    if (apareceu) {
      await modalSemOrcamento
        .getByRole('button', { name: /iniciar mesmo assim/i })
        .click();
      await modalSemOrcamento.waitFor({ state: 'hidden' });
    }
  }

  /**
   * Abre o modal "Concluir chamado", preenche solução e materiais e envia.
   */
  async concluirChamado(solucao: string, materiais: string) {
    await this.botaoConcluir.click();

    const modal = this.modalPorTitulo(/concluir chamado/i);
    await modal.waitFor({ state: 'visible' });
    await modal
      .getByPlaceholder(/descreva como o problema foi resolvido/i)
      .fill(solucao);
    await modal
      .getByPlaceholder(/tomada, fita isolante/i)
      .fill(materiais);
    await modal.getByRole('button', { name: /^concluir$/i }).click();
  }

  async enviarOrcamento(descricao: string, digitosValor: string) {
    await this.botaoEnviarOrcamento.click();
    const modal = this.modalPorTitulo(/enviar orçamento/i);
    await modal.waitFor({ state: 'visible' });
    await modal.getByPlaceholder(/troca de tomada/i).fill(descricao);
    await modal.locator('input').fill(digitosValor);
    await modal.getByRole('button', { name: /enviar orçamento/i }).click();
    await modal.waitFor({ state: 'hidden' });
  }

  async adicionarDespesaSimples(descricao: string, digitosValor: string) {
    await this.botaoAdicionarDespesa.click();
    const modal = this.modalPorTitulo(/adicionar despesa/i);
    await modal.waitFor({ state: 'visible' });
    await modal.getByLabel('Descrição').fill(descricao);
    await modal.getByLabel('Valor (R$)').fill(digitosValor);
    await modal.getByRole('button', { name: /salvar despesa/i }).click();
    await modal.waitFor({ state: 'hidden' });
  }
}
