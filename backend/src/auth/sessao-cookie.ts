import type { CookieOptions } from 'express';

export const COOKIE_SESSAO = 'predial_sessao';

export function opcoesCookieSessao(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production' && process.env.AUTH_COOKIE_INSEGURO_LOCAL !== '1',
    path: '/api',
  };
}

export function lerCookieSessao(header: string | undefined): string | undefined {
  const prefixo = `${COOKIE_SESSAO}=`;
  const cookie = header?.split(';').map((parte) => parte.trim()).find((parte) => parte.startsWith(prefixo));
  const valor = cookie?.slice(prefixo.length);
  return valor && /^[A-Za-z0-9_-]{43}$/.test(valor) ? valor : undefined;
}
