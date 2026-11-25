/**
 * CT-RBAC-01 ao CT-RBAC-07
 * Testes de controle de acesso baseado em perfis (RBAC).
 */
import { test, expect, USUARIOS, loginUI } from '../fixtures/auth';
import { ChamadoDetalhePage } from '../pages/ChamadoDetalhePage';

// ---------------------------------------------------------------------------
// CT-RBAC-01 — Isolamento de chamados do Condômino (Ana só vê os seus)
// ---------------------------------------------------------------------------
test('CT-RBAC-01: condômino vê apenas seus próprios chamados na lista', async ({
  asCondomino: page,
}) => {
  await page.goto('/chamados');
  await expect(page.getByRole('heading', { name: /^chamados$/i })).toBeVisible();

  // Chamados do seed de Carlos Lima (IDs 2 e 4) não podem aparecer para Ana Souza
  await expect(page.getByText('Vazamento no banheiro')).toBeHidden();
  await expect(page.getByText('Cadeira quebrada')).toBeHidden();
});

// ---------------------------------------------------------------------------
// CT-RBAC-02 — Acesso direto a chamado alheio bloqueado para Condômino
// ---------------------------------------------------------------------------
test('CT-RBAC-02: condômino não visualiza chamado de outro condômino (404 / sem permissão)', async ({
  asCondomino: page,
}) => {
  // Chamado #2 pertence a Carlos Lima; o backend retorna 404 para ocultar existência
  const detalhe = new ChamadoDetalhePage(page);
  await detalhe.abrir(2);

  await expect(
    detalhe.mensagemNaoEncontrado.or(detalhe.mensagemSemPermissao),
  ).toBeVisible();
  await expect(page.getByText('Vazamento no banheiro')).toBeHidden();
});

// ---------------------------------------------------------------------------
// CT-RBAC-03 — Condômino não visualiza botões de aprovação
// ---------------------------------------------------------------------------
test('CT-RBAC-03: condômino não vê botões de aprovar/recusar no detalhe do chamado', async ({
  asCondomino: page,
}) => {
  const detalhe = new ChamadoDetalhePage(page);
  await detalhe.abrir(3);

  await expect(detalhe.tituloChamado).toBeVisible();
  await expect(detalhe.botaoAprovar).toBeHidden();
  await expect(detalhe.botaoRecusar).toBeHidden();
});

// ---------------------------------------------------------------------------
// CT-RBAC-04 — Prestador não visualiza botões de aprovação de chamado
// ---------------------------------------------------------------------------
test('CT-RBAC-04: prestador não vê botões de aprovar/recusar no detalhe do chamado', async ({
  asPrestador: page,
}) => {
  // Chamado #4 está REVISADO no seed (visível ao prestador), sem permissão de triagem
  const detalhe = new ChamadoDetalhePage(page);
  await detalhe.abrir(4);

  await expect(detalhe.tituloChamado).toBeVisible();
  await expect(detalhe.botaoAprovar).toBeHidden();
  await expect(detalhe.botaoRecusar).toBeHidden();
});

// ---------------------------------------------------------------------------
// CT-RBAC-05 — Prestador não pode alterar ou ver chamado atribuído a outro prestador
// ---------------------------------------------------------------------------
test('CT-RBAC-05: prestador Marta não acessa chamado atribuído a João', async ({ page }) => {
  await loginUI(page, USUARIOS.prestador2);

  // Chamado #1 está CONCLUIDO e atribuído ao João (#3)
  const detalhe = new ChamadoDetalhePage(page);
  await detalhe.abrir(1);

  await expect(
    detalhe.mensagemNaoEncontrado.or(detalhe.mensagemSemPermissao),
  ).toBeVisible();
});

// ---------------------------------------------------------------------------
// CT-RBAC-06 — Rota /usuarios bloqueada para não-administradores
// ---------------------------------------------------------------------------
test('CT-RBAC-06: síndico é redirecionado ao tentar acessar /usuarios', async ({
  asSindico: page,
}) => {
  await page.goto('/usuarios');
  await expect(page).toHaveURL('/');
});

test('CT-RBAC-06: condômino é redirecionado ao tentar acessar /usuarios', async ({
  asCondomino: page,
}) => {
  await page.goto('/usuarios');
  await expect(page).toHaveURL('/');
});

test('CT-RBAC-06: prestador é redirecionado ao tentar acessar /usuarios', async ({
  asPrestador: page,
}) => {
  await page.goto('/usuarios');
  await expect(page).toHaveURL('/');
});

test('CT-RBAC-06 [admin]: administrador acessa /usuarios com sucesso', async ({
  asAdmin: page,
}) => {
  await page.goto('/usuarios');
  await expect(page).toHaveURL('/usuarios');
  await expect(
    page.getByRole('heading', { name: /usuários e perfis/i }),
  ).toBeVisible();
});

// ---------------------------------------------------------------------------
// CT-RBAC-07 — Rota /relatorios/despesas bloqueada para condôminos e prestadores
// ---------------------------------------------------------------------------
test('CT-RBAC-07: condômino é redirecionado ao tentar acessar /relatorios/despesas', async ({
  asCondomino: page,
}) => {
  await page.goto('/relatorios/despesas');
  await expect(page).toHaveURL('/');
});

test('CT-RBAC-07: prestador é redirecionado ao tentar acessar /relatorios/despesas', async ({
  asPrestador: page,
}) => {
  await page.goto('/relatorios/despesas');
  await expect(page).toHaveURL('/');
});

test('CT-RBAC-07 [sindico]: síndico acessa /relatorios/despesas', async ({
  asSindico: page,
}) => {
  await page.goto('/relatorios/despesas');
  await expect(page).toHaveURL('/relatorios/despesas');
  await expect(
    page.getByRole('heading', { name: /relatório de despesas/i }),
  ).toBeVisible();
});
