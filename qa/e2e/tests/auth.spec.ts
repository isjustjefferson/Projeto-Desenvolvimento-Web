/**
 * CT-AUTH-01 a CT-AUTH-05
 * Testes de autenticação: login, cadastro, recuperação de senha, proteção de rotas e redirecionamentos.
 */
import { test as baseTest } from '@playwright/test';
import { test, expect, USUARIOS, loginUI } from '../fixtures/auth';
import { LoginPage } from '../pages/LoginPage';

// ---------------------------------------------------------------------------
// CT-AUTH-01 — Login com credenciais válidas (todos os perfis do README.md)
// ---------------------------------------------------------------------------
const perfis = [
  { key: 'condomino', nome: USUARIOS.condomino.nome },
  { key: 'condomino2', nome: USUARIOS.condomino2.nome },
  { key: 'prestador', nome: USUARIOS.prestador.nome },
  { key: 'prestador2', nome: USUARIOS.prestador2.nome },
  { key: 'sindico', nome: USUARIOS.sindico.nome },
  { key: 'admin', nome: USUARIOS.admin.nome },
] as const;

for (const { key, nome } of perfis) {
  baseTest(
    `CT-AUTH-01 [${key}]: login com ${nome} redireciona para o dashboard`,
    async ({ page }) => {
      await loginUI(page, USUARIOS[key]);
      await expect(page).toHaveURL('/');
      await expect(
        page.getByRole('heading', { name: /dashboard geral/i }),
      ).toBeVisible();
      await expect(page.getByText(nome, { exact: false }).first()).toBeVisible();
    },
  );
}

// ---------------------------------------------------------------------------
// CT-AUTH-02 — Login com credenciais inválidas
// ---------------------------------------------------------------------------
baseTest('CT-AUTH-02: login com senha inválida exibe mensagem de erro', async ({ page }) => {
  const login = new LoginPage(page);
  await login.abrir();

  await login.login(USUARIOS.condomino.email, 'senha-errada-123');

  await expect(page).toHaveURL('/login');
  const erro = await login.aguardarErro();
  expect(erro).toBeTruthy();
});

baseTest('CT-AUTH-02 (e-mail inexistente): exibe mensagem de erro', async ({ page }) => {
  const login = new LoginPage(page);
  await login.abrir();

  await login.login('nao-existe@predial.com', '123456');

  await expect(page).toHaveURL('/login');
  const erro = await login.aguardarErro();
  expect(erro).toBeTruthy();
});

// ---------------------------------------------------------------------------
// CT-AUTH-03 — Cadastro de novo condômino e exclusão da própria conta
// ---------------------------------------------------------------------------
baseTest(
  'CT-AUTH-03: cadastro de novo condômino redireciona para o dashboard e permite exclusão',
  async ({ page }) => {
    const ts = Date.now();
    const emailTemp = `playwright_${ts}@predial.com`;

    await page.goto('/register');
    await page.locator('#reg-nome').fill(`Teste Playwright ${ts}`);
    await page.locator('#reg-email').fill(emailTemp);
    await page.locator('#reg-unidade').fill('Bloco Teste, Ap 999');
    await page.locator('#reg-senha').fill('123456');
    await page.locator('#reg-confirmar').fill('123456');
    await page.getByRole('button', { name: /criar conta/i }).click();

    await expect(page).toHaveURL('/', { timeout: 15_000 });
    await expect(
      page.getByRole('heading', { name: /dashboard geral/i }),
    ).toBeVisible();

    // Limpeza: exclui a conta temporária pela própria UI ("Minha conta")
    await page.locator('button:visible', { hasText: /minha conta/i }).first().click();
    await page.getByRole('button', { name: /apagar conta/i }).click();
    await page.getByRole('button', { name: /apagar definitivamente/i }).click();
    await expect(page).toHaveURL('/login', { timeout: 10_000 });
  },
);

// ---------------------------------------------------------------------------
// CT-AUTH-04 — Recuperação aguarda um canal de entrega seguro
// ---------------------------------------------------------------------------
baseTest('CT-AUTH-04: recuperação de senha informa que está indisponível', async ({ page, request }) => {
  await page.goto('/forgot-password');
  await expect(page.getByText(/recuperação automática de senha está indisponível/i)).toBeVisible();
  const resposta = await request.post('/api/auth/forgot-password', {
    data: { email: USUARIOS.condomino.email },
  });
  expect(resposta.status()).toBe(503);
  expect((await resposta.json()).token).toBeUndefined();
});

// ---------------------------------------------------------------------------
// CT-AUTH-04 (rotas públicas) — Usuário autenticado é redirecionado
// ---------------------------------------------------------------------------
test('CT-AUTH-04: usuário autenticado é redirecionado ao tentar acessar /login', async ({
  asCondomino: page,
}) => {
  await page.goto('/login');
  await expect(page).toHaveURL('/');
});

test('CT-AUTH-04: usuário autenticado é redirecionado ao tentar acessar /register', async ({
  asCondomino: page,
}) => {
  await page.goto('/register');
  await expect(page).toHaveURL('/');
});

// ---------------------------------------------------------------------------
// CT-AUTH-05 — Rota protegida redireciona para login sem sessão
// ---------------------------------------------------------------------------
baseTest(
  'CT-AUTH-05: acesso a /chamados sem autenticação redireciona para /login',
  async ({ page }) => {
    await page.goto('/chamados');
    await expect(page).toHaveURL('/login');
  },
);

baseTest(
  'CT-AUTH-05: acesso a / sem autenticação redireciona para /login',
  async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  },
);
