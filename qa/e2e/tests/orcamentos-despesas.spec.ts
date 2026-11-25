/**
 * CT-ORC-01, CT-ORC-02, CT-ORC-03 (RN05) e CT-DESP-01, CT-DESP-02
 * Testes E2E dos fluxos de Orçamentos e Despesas no ciclo do chamado.
 */
import { test as baseTest } from '@playwright/test';
import { expect, USUARIOS, loginUI, sairUI } from '../fixtures/auth';
import { ChamadosPage } from '../pages/ChamadosPage';
import { ChamadoDetalhePage } from '../pages/ChamadoDetalhePage';

baseTest(
  'CT-ORC-01/02/03 & CT-DESP-01/02: orçamento pendente bloqueia início (RN05) e despesa pendente bloqueia conclusão',
  async ({ page }) => {
    const ts = Date.now();

    // 1. Condômino abre chamado
    await loginUI(page, USUARIOS.condomino);
    const listaPage = new ChamadosPage(page);
    await listaPage.abrirFormulario();
    await listaPage.preencherFormulario({
      titulo: `[E2E] Orçamento e Despesa ${ts}`,
      categoria: 'Elétrica',
      bloco: 'Bloco A',
      andar: '1º andar',
      lugar: 'Salão de Festas',
      descricao: 'Necessário trocar disjuntor principal do salão.',
    });
    const chamadoId = await listaPage.submeter();
    await sairUI(page);

    // 2. Síndico aprova e atribui para João
    await loginUI(page, USUARIOS.sindico);
    const detalhe = new ChamadoDetalhePage(page);
    await detalhe.abrir(chamadoId);
    await detalhe.aprovarChamado('Média', USUARIOS.prestador.nome);
    await expect(detalhe.statusBadge).toHaveText('Revisado');
    await sairUI(page);

    // 3. Prestador envia orçamento → status PENDENTE e botão Iniciar fica bloqueado (CT-ORC-01 + CT-ORC-03)
    await loginUI(page, USUARIOS.prestador);
    await detalhe.abrir(chamadoId);
    await expect(detalhe.botaoEnviarOrcamento).toBeVisible();
    await detalhe.enviarOrcamento('Mão de obra e disjuntor 63A', '35000');

    await expect(page.getByText('Mão de obra e disjuntor 63A')).toBeVisible();
    await expect(detalhe.botaoIniciar).toBeDisabled();
    await sairUI(page);

    // 4. Síndico aprova orçamento (CT-ORC-02)
    await loginUI(page, USUARIOS.sindico);
    await detalhe.abrir(chamadoId);
    await page.getByRole('button', { name: /^aprovar$/i }).click();
    await expect(page.getByText(/orçamento aprovado/i).first()).toBeVisible();
    await sairUI(page);

    // 5. Prestador inicia atendimento e lança despesa (CT-DESP-01)
    await loginUI(page, USUARIOS.prestador);
    await detalhe.abrir(chamadoId);
    await expect(detalhe.botaoIniciar).toBeEnabled();
    await detalhe.botaoIniciar.click();
    await expect(detalhe.statusBadge).toHaveText('Em Andamento');

    await detalhe.adicionarDespesaSimples('Disjuntor trifásico 63A', '18550');
    await expect(page.getByText('Disjuntor trifásico 63A')).toBeVisible();

    // Tenta concluir com despesa pendente → deve exibir erro e permanecer EM_ANDAMENTO (CT-DESP-02)
    await detalhe.concluirChamado(
      'Disjuntor substituído com sucesso.',
      '1x Disjuntor 63A.',
    );
    await expect(
      page.getByText(/despesas pendentes de aprovação/i),
    ).toBeVisible();
    // Fecha modal de conclusão
    await page.getByRole('button', { name: /fechar/i }).click();
    await expect(detalhe.statusBadge).toHaveText('Em Andamento');
    await sairUI(page);

    // 6. Síndico aprova a despesa (aceita confirm de sem anexo)
    await loginUI(page, USUARIOS.sindico);
    await detalhe.abrir(chamadoId);
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: /^aprovar$/i }).click();
    await expect(page.getByText(/despesa aprovada/i)).toBeVisible();
    await sairUI(page);

    // 7. Agora prestador consegue concluir o chamado
    await loginUI(page, USUARIOS.prestador);
    await detalhe.abrir(chamadoId);
    await detalhe.concluirChamado(
      'Disjuntor substituído e testado sob carga.',
      '1x Disjuntor 63A.',
    );
    await expect(detalhe.statusBadge).toHaveText('Concluído');
  },
);
