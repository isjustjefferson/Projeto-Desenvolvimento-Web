/**
 * CT-DASH-01, CT-DASH-02
 * Testes do Dashboard para diferentes perfis de usuário.
 */
import { test, expect } from '../fixtures/auth';
import { DashboardPage } from '../pages/DashboardPage';

// ---------------------------------------------------------------------------
// CT-DASH-01 — Dashboard do Síndico exibe métricas e fila de triagem
// ---------------------------------------------------------------------------
test('CT-DASH-01: síndico vê cards de métricas e fila de triagem no dashboard', async ({
  asSindico: page,
}) => {
  const dash = new DashboardPage(page);
  await dash.aguardarCarregamento();

  await expect(page.getByText('Total de Chamados Abertos')).toBeVisible();
  await expect(page.getByText('Chamados Fechados / Concluídos')).toBeVisible();
  await expect(dash.secaoFilaTriagem).toBeVisible();

  const temChamados = (await dash.secaoFilaTriagem.locator('a').count()) > 0;
  const estadoVazio = await dash.secaoFilaTriagem
    .getByText(/nenhum chamado aguardando aprovação/i)
    .isVisible()
    .catch(() => false);
  expect(temChamados || estadoVazio).toBeTruthy();
});

// ---------------------------------------------------------------------------
// CT-DASH-02 — Dashboard do Condômino não exibe fila de triagem
// ---------------------------------------------------------------------------
test('CT-DASH-02: condômino não vê fila de triagem no dashboard', async ({
  asCondomino: page,
}) => {
  const dash = new DashboardPage(page);
  await dash.aguardarCarregamento();

  await expect(page.getByText('Total de Chamados Abertos')).toBeVisible();
  await expect(dash.secaoFilaTriagem).toBeHidden();
});

// ---------------------------------------------------------------------------
// Extra — Dashboard do Administrador tem acesso completo
// ---------------------------------------------------------------------------
test('CT-DASH-01 [admin]: administrador vê métricas e fila de triagem', async ({
  asAdmin: page,
}) => {
  const dash = new DashboardPage(page);
  await dash.aguardarCarregamento();

  await expect(page.getByText('Total de Chamados Abertos')).toBeVisible();
  await expect(dash.secaoFilaTriagem).toBeVisible();
});

// ---------------------------------------------------------------------------
// Extra — Dashboard do Prestador (sem fila de triagem)
// ---------------------------------------------------------------------------
test('CT-DASH-02 [prestador]: prestador não vê fila de triagem', async ({
  asPrestador: page,
}) => {
  const dash = new DashboardPage(page);
  await dash.aguardarCarregamento();

  await expect(page.getByText('Total de Chamados Abertos')).toBeVisible();
  await expect(dash.secaoFilaTriagem).toBeHidden();
});
