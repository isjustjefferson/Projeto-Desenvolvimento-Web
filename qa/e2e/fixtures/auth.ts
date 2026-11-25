import { config } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as base, type Page } from '@playwright/test';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Carrega as credenciais do arquivo .env.test (fica em qa/e2e/.env.test).
// Se o arquivo não existir, usa as credenciais padrão documentadas no README.md.
// ---------------------------------------------------------------------------
config({ path: resolve(__dirname, '..', '.env.test') });

function env(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

// ---------------------------------------------------------------------------
// Credenciais padrão documentadas no README.md (todos usam senha 123456).
// Podem ser sobrescritas em qa/e2e/.env.test se o banco usar senhas próprias.
// ---------------------------------------------------------------------------
export const USUARIOS = {
  condomino: {
    email: env('E2E_CONDOMINO_EMAIL', 'ana@predial.com'),
    senha: env('E2E_CONDOMINO_SENHA', '123456'),
    nome: 'Ana Souza',
  },
  condomino2: {
    email: env('E2E_CONDOMINO2_EMAIL', 'carlos@predial.com'),
    senha: env('E2E_CONDOMINO2_SENHA', '123456'),
    nome: 'Carlos Lima',
  },
  prestador: {
    email: env('E2E_PRESTADOR_EMAIL', 'joao@predial.com'),
    senha: env('E2E_PRESTADOR_SENHA', '123456'),
    nome: 'João Eletricista',
  },
  prestador2: {
    email: env('E2E_PRESTADOR2_EMAIL', 'marta@predial.com'),
    senha: env('E2E_PRESTADOR2_SENHA', '123456'),
    nome: 'Marta Encanadora',
  },
  sindico: {
    email: env('E2E_SINDICO_EMAIL', 'ricardo@predial.com'),
    senha: env('E2E_SINDICO_SENHA', '123456'),
    nome: 'Ricardo Síndico',
  },
  admin: {
    email: env('E2E_ADMIN_EMAIL', 'tiago@predial.com'),
    senha: env('E2E_ADMIN_SENHA', '123456'),
    nome: 'Tiago TI',
  },
} as const;

export type UsuarioKey = keyof typeof USUARIOS;

// ---------------------------------------------------------------------------
// Helper: faz login via UI e falha imediatamente com mensagem clara se o
// backend retornar erro de autenticação (evita ficar travado esperando URL).
// ---------------------------------------------------------------------------
export async function loginUI(
  page: Page,
  usuario: { email: string; senha: string },
): Promise<void> {
  await page.goto('/login');

  await page.locator('#login-email').fill(usuario.email);
  await page.locator('#login-senha').fill(usuario.senha);
  await page.getByRole('button', { name: /^entrar$/i }).click();

  const bannerErro = page.locator('form .rounded-lg.bg-red-500');
  const resultado = await Promise.race([
    page.waitForURL('/', { timeout: 15_000 }).then(() => 'ok' as const),
    bannerErro.waitFor({ state: 'visible', timeout: 15_000 }).then(async () => ({
      erro: (await bannerErro.textContent()) ?? 'Erro desconhecido no login',
    })),
  ]);

  if (resultado !== 'ok') {
    throw new Error(
      `Falha ao autenticar "${usuario.email}": ${resultado.erro}. Verifique o backend e qa/e2e/.env.test (credenciais no README.md).`,
    );
  }
}

export async function sairUI(page: Page): Promise<void> {
  const botaoSair = page.locator('button:visible', { hasText: /sair/i }).first();
  if (await botaoSair.isVisible().catch(() => false)) {
    await botaoSair.click();
    await page.waitForURL('/login', { timeout: 10_000 });
    return;
  }
  await page.evaluate(() => localStorage.removeItem('predial.usuarioId'));
  await page.goto('/login');
}

// ---------------------------------------------------------------------------
// Fixtures tipadas que injetam usuários já logados em cada test
// ---------------------------------------------------------------------------
type AuthFixtures = {
  asCondomino: Page;
  asSindico: Page;
  asPrestador: Page;
  asAdmin: Page;
};

export const test = base.extend<AuthFixtures>({
  asCondomino: async ({ page }, use) => {
    await loginUI(page, USUARIOS.condomino);
    await use(page);
  },
  asSindico: async ({ page }, use) => {
    await loginUI(page, USUARIOS.sindico);
    await use(page);
  },
  asPrestador: async ({ page }, use) => {
    await loginUI(page, USUARIOS.prestador);
    await use(page);
  },
  asAdmin: async ({ page }, use) => {
    await loginUI(page, USUARIOS.admin);
    await use(page);
  },
});

export { expect } from '@playwright/test';
