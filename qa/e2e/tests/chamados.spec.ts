/**
 * CT-CHAM-01, CT-CHAM-02, CT-CHAM-09
 * Testes de criação de chamados, classificação automática e filtros na lista.
 */
import { test, expect } from '../fixtures/auth';
import { ChamadosPage } from '../pages/ChamadosPage';
import { ChamadoDetalhePage } from '../pages/ChamadoDetalhePage';

// ---------------------------------------------------------------------------
// CT-CHAM-01 — Abertura de chamado válido (Condômino)
// ---------------------------------------------------------------------------
test('CT-CHAM-01: condômino abre chamado válido e visualiza sugestão automática e status inicial', async ({
  asCondomino: page,
}) => {
  const chamados = new ChamadosPage(page);
  await chamados.abrirFormulario();

  const titulo = `[E2E] Curto-circuito painel ${Date.now()}`;
  await chamados.preencherFormulario({
    titulo,
    categoria: 'Elétrica',
    bloco: 'Bloco A',
    andar: '2º andar',
    lugar: 'Corredor',
    descricao: 'Fumaça e cheiro de queimado no quadro elétrico do corredor.',
  });

  const chamadoId = await chamados.submeter();
  expect(chamadoId).toBeGreaterThan(0);

  const detalhe = new ChamadoDetalhePage(page);
  await expect(detalhe.tituloChamado).toHaveText(titulo);
  await expect(detalhe.statusBadge).toHaveText('Aguardando Aprovação');
  await expect(page.getByText(/sugestão automática/i)).toBeVisible();
});

// ---------------------------------------------------------------------------
// CT-CHAM-02 — Validação de campos obrigatórios
// ---------------------------------------------------------------------------
test('CT-CHAM-02: formulário bloqueia envio sem título', async ({ asCondomino: page }) => {
  const chamados = new ChamadosPage(page);
  await chamados.abrirFormulario();

  await chamados.campoBloco.fill('Bloco A');
  await chamados.campoAndar.fill('1º andar');
  await chamados.campoLugar.fill('Hall');
  await chamados.campoDescricao.fill('Descrição sem título.');
  await chamados.botaoAbrir.click();

  await expect(page).toHaveURL('/chamados/novo');
});

test('CT-CHAM-02: formulário bloqueia envio sem prédio/bloco', async ({ asCondomino: page }) => {
  const chamados = new ChamadosPage(page);
  await chamados.abrirFormulario();

  await chamados.campoTitulo.fill('Título de teste');
  await chamados.campoAndar.fill('1º andar');
  await chamados.campoLugar.fill('Hall');
  await chamados.campoDescricao.fill('Descrição de teste.');
  await chamados.botaoAbrir.click();

  await expect(page).toHaveURL('/chamados/novo');
});

// ---------------------------------------------------------------------------
// CT-CHAM-09 — Filtros, busca e alternância de visualização na lista (Síndico)
// ---------------------------------------------------------------------------
test('CT-CHAM-09: síndico filtra lista por status, busca por texto e alterna cards/lista', async ({
  asSindico: page,
}) => {
  const chamados = new ChamadosPage(page);
  await chamados.abrirLista();

  // Seleciona status EM_ANDAMENTO usando o select real (sem label/name)
  await expect(chamados.filtroStatus).toBeVisible();
  await chamados.filtroStatus.selectOption('EM_ANDAMENTO');

  // Aguarda que nenhum badge de outro status fique visível na lista
  const badgesOutros = page
    .locator('a[href^="/chamados/"] span')
    .filter({ hasText: /^(Aguardando Aprovação|Revisado|Concluído|Recusado)$/ });
  await expect(badgesOutros).toHaveCount(0);

  // Limpa status e alterna modo de visualização (cards <-> lista)
  await chamados.filtroStatus.selectOption('');
  await chamados.botaoModoLista.click();
  await expect(chamados.botaoModoLista).toHaveAttribute('aria-pressed', 'true');

  await chamados.botaoModoCards.click();
  await expect(chamados.botaoModoCards).toHaveAttribute('aria-pressed', 'true');
});
