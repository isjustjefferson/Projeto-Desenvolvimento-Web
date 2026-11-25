import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Carrega .env.test antes de tudo — as credenciais precisam estar disponíveis
// no momento em que os workers do Playwright são inicializados.
config({ path: resolve(__dirname, '.env.test') });

const baseURL = process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:5173';
const inMemory = Boolean(process.env['E2E_IN_MEMORY']);

/**
 * Configuração global do Playwright para o projeto de Gestão de Chamados Predial.
 *
 * Uso:
 *   npx playwright test                       # todos os testes
 *   npx playwright test tests/auth.spec.ts    # spec específico
 *   npx playwright test --ui                  # modo interativo
 *   npx playwright test --headed              # modo com navegador visível
 */
export default defineConfig({
  // Pasta raiz dos specs
  testDir: './tests',

  // Paralelismo por arquivo; dentro de cada arquivo, testes rodam em sequência
  fullyParallel: false,

  // Falha imediata em CI se `.only` for esquecido no código
  forbidOnly: !!process.env['CI'],

  // Nenhuma nova tentativa localmente; 2 no CI
  retries: process.env['CI'] ? 2 : 0,

  // 1 worker evita corrida entre login/sessões e mutações sequenciais no mesmo banco
  workers: 1,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    baseURL,

    // Captura trace apenas na primeira nova tentativa
    trace: 'on-first-retry',

    // Screenshot apenas em caso de falha
    screenshot: 'only-on-failure',

    // Vídeo apenas em modo CI
    video: process.env['CI'] ? 'retain-on-failure' : 'off',

    // Tempo máximo para cada ação (clique, fill, etc.)
    actionTimeout: 10_000,

    // Tempo máximo para navegação de página
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Projeto mobile para CT-UI-01
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: '**/ui.spec.ts',
    },
  ],

  // Sobe backend (porta 3000) e frontend (porta 5173) automaticamente caso ainda
  // não estejam rodando. Se você já iniciou um ou ambos manualmente, o Playwright
  // reutiliza os servidores ativos (reuseExistingServer).
  webServer: [
    {
      command: 'npm run start',
      cwd: '../../backend',
      url: 'http://localhost:3000/api/health',
      reuseExistingServer: !process.env['CI'],
      timeout: 90_000,
      ...(inMemory ? { env: { NODE_ENV: 'test' } } : {}),
    },
    {
      command: 'npm run dev',
      cwd: '../../frontend',
      url: baseURL,
      reuseExistingServer: !process.env['CI'],
      timeout: 60_000,
    },
  ],
});
