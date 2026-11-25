/**
 * CT-CHAM-03 ao CT-CHAM-08
 * Testes determinísticos e idempotentes do ciclo de vida completo de um chamado:
 * Condômino abre → Síndico aprova → Prestador inicia → Valida RN04 → Prestador conclui → Verifica histórico.
 * Também cobre a recusa na triagem pelo Síndico (CT-CHAM-04).
 */
import { test as baseTest } from '@playwright/test';
import { expect, USUARIOS, loginUI, sairUI } from '../fixtures/auth';
import { ChamadosPage } from '../pages/ChamadosPage';
import { ChamadoDetalhePage } from '../pages/ChamadoDetalhePage';

// ---------------------------------------------------------------------------
// CT-CHAM-03, 05, 06, 07, 08 — Fluxo completo fim-a-fim (idempotente)
// ---------------------------------------------------------------------------
baseTest(
  'CT-CHAM-03/05/06/07/08: ciclo completo Condômino → Síndico → Prestador com validação RN04 e histórico',
  async ({ page }) => {
    const ts = Date.now();
    const titulo = `[E2E] Ciclo Completo ${ts}`;

    // 1. Condômino (Ana) abre um chamado novo
    await loginUI(page, USUARIOS.condomino);
    const listaPage = new ChamadosPage(page);
    await listaPage.abrirFormulario();
    await listaPage.preencherFormulario({
      titulo,
      categoria: 'Elétrica',
      bloco: 'Bloco A',
      andar: '3º andar',
      lugar: 'Sala 301',
      descricao: 'Interruptor com mau contato intermitente.',
    });
    const chamadoId = await listaPage.submeter();

    const detalhe = new ChamadoDetalhePage(page);
    await expect(detalhe.statusBadge).toHaveText('Aguardando Aprovação');
    await sairUI(page);

    // 2. Síndico (Ricardo) aprova e atribui para João Eletricista (CT-CHAM-03)
    await loginUI(page, USUARIOS.sindico);
    await detalhe.abrir(chamadoId);
    await expect(detalhe.botaoAprovar).toBeVisible();
    await detalhe.aprovarChamado('Alta', USUARIOS.prestador.nome);

    await expect(detalhe.statusBadge).toHaveText('Revisado');
    await expect(page.getByText(/aprovado e liberado/i)).toBeVisible();
    await sairUI(page);

    // 3. Prestador (João) inicia atendimento (CT-CHAM-05)
    await loginUI(page, USUARIOS.prestador);
    await detalhe.abrir(chamadoId);
    await expect(detalhe.botaoIniciar).toBeVisible();
    await detalhe.iniciarChamado();

    await expect(detalhe.statusBadge).toHaveText('Em Andamento');

    // 4. Validação RN04 — Botão Concluir fica desabilitado sem solução e materiais (CT-CHAM-07)
    await detalhe.botaoConcluir.click();
    const modalConcluir = page
      .locator('.fixed.inset-0')
      .filter({ has: page.getByRole('heading', { name: /concluir chamado/i }) });
    await modalConcluir.waitFor({ state: 'visible' });

    const btnConfirmar = modalConcluir.getByRole('button', { name: /^concluir$/i });
    await expect(btnConfirmar).toBeDisabled();

    // Preenche apenas solução; sem materiais deve continuar desabilitado
    await modalConcluir
      .getByPlaceholder(/descreva como o problema foi resolvido/i)
      .fill('Substituição do interruptor simples.');
    await expect(btnConfirmar).toBeDisabled();

    // Fecha o modal para testar a conclusão via Page Object (CT-CHAM-06)
    await modalConcluir.getByRole('button', { name: /fechar/i }).click();
    await modalConcluir.waitFor({ state: 'hidden' });

    // 5. Prestador conclui informando solução e materiais (CT-CHAM-06)
    await detalhe.concluirChamado(
      'Substituição completa do interruptor simples e aperto dos bornes.',
      '1x interruptor 10A, fita isolante.',
    );

    await expect(detalhe.statusBadge).toHaveText('Concluído');
    await expect(page.getByText(/solução aplicada/i)).toBeVisible();

    // 6. Verifica histórico auditável com todas as transições (CT-CHAM-08)
    await expect(detalhe.secaoHistorico).toBeVisible();
    await expect(page.getByText(/abriu o chamado/i)).toBeVisible();
    await expect(
      page.getByText(/alterou de Aguardando Aprovação para Revisado/i),
    ).toBeVisible();
    await expect(
      page.getByText(/alterou de Revisado para Em Andamento/i),
    ).toBeVisible();
    await expect(
      page.getByText(/alterou de Em Andamento para Concluído/i),
    ).toBeVisible();
  },
);

// ---------------------------------------------------------------------------
// CT-CHAM-04 — Recusa de chamado na triagem pelo Síndico
// ---------------------------------------------------------------------------
baseTest(
  'CT-CHAM-04: síndico recusa chamado recém-aberto informando motivo',
  async ({ page }) => {
    const ts = Date.now();

    // 1. Condômino cria chamado para recusa
    await loginUI(page, USUARIOS.condomino);
    const listaPage = new ChamadosPage(page);
    await listaPage.abrirFormulario();
    await listaPage.preencherFormulario({
      titulo: `[E2E] Pedido Duplicado ${ts}`,
      categoria: 'Outros',
      bloco: 'Bloco B',
      andar: 'Térreo',
      lugar: 'Garagem',
      descricao: 'Solicitação aberta em duplicidade para teste de recusa.',
    });
    const chamadoId = await listaPage.submeter();
    await sairUI(page);

    // 2. Síndico recusa com justificativa
    await loginUI(page, USUARIOS.sindico);
    const detalhe = new ChamadoDetalhePage(page);
    await detalhe.abrir(chamadoId);
    await expect(detalhe.botaoRecusar).toBeVisible();
    await detalhe.recusarChamado('Solicitação duplicada conforme chamado anterior.');

    await expect(detalhe.statusBadge).toHaveText('Recusado');
    await expect(page.getByText(/recusado: solicitação duplicada/i)).toBeVisible();
  },
);
