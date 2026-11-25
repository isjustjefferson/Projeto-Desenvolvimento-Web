/**
 * CT-UI-01
 * Testes de responsividade e UI (mobile, tablet e acessibilidade).
 */
import { test, expect } from '@playwright/test';
import { USUARIOS, loginUI } from '../fixtures/auth';

test('CT-UI-01 [mobile]: página de login renderiza sem overflow horizontal', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/login');

  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  expect(overflow).toBeFalsy();

  await expect(page.locator('#login-email')).toBeVisible();
  await expect(page.locator('#login-senha')).toBeVisible();
  await expect(page.getByRole('button', { name: /^entrar$/i })).toBeVisible();
});

test('CT-UI-01 [mobile]: formulário de login e dashboard são utilizáveis em mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await loginUI(page, USUARIOS.sindico);

  await expect(page.getByRole('heading', { name: /dashboard geral/i })).toBeVisible();

  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  expect(overflow).toBeFalsy();
});

test('CT-UI-01 [tablet]: página de chamados renderiza sem overflow em tablet (768×1024)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await loginUI(page, USUARIOS.condomino);

  await page.goto('/chamados');
  await expect(page.getByRole('heading', { name: /^chamados$/i })).toBeVisible();

  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  expect(overflow).toBeFalsy();
});

test('CT-UI-01 [a11y]: botão de mostrar/ocultar senha funciona corretamente', async ({
  page,
}) => {
  await page.goto('/login');

  const campoSenha = page.locator('#login-senha');
  const botaoToggle = page.getByRole('button', { name: 'Mostrar senha' });

  await expect(campoSenha).toHaveAttribute('type', 'password');
  await botaoToggle.click();
  await expect(campoSenha).toHaveAttribute('type', 'text');
  await botaoToggle.click();
  await expect(campoSenha).toHaveAttribute('type', 'password');
});
