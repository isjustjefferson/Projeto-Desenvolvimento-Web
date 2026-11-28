import type { NextFunction, Request, Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { COOKIE_SESSAO, lerCookieSessao } from '../auth/sessao-cookie.js';

const rotasFinanceiras = /^\/api\/(?:chamados\/[^/]+\/(?:despesas|orcamentos)|relatorios\/despesas)(?:\/|$)/i;
const transicaoComDependenciaFinanceira = /^\/api\/chamados\/[^/]+\/(?:iniciar|concluir)\/?$/i;
const headerInterno = 'x-financeiro-token';

export function autenticarChamados(token: string) {
  const esperado = Buffer.from(token);

  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method === 'GET' && req.path === '/api/health') {
      next();
      return;
    }

    const recebido = Buffer.from(req.get(headerInterno) ?? '');
    if (recebido.length !== esperado.length || !timingSafeEqual(recebido, esperado)) {
      res.status(401).json({ message: 'Credencial de serviço inválida.' });
      return;
    }
    next();
  };
}

export function encaminharFinanceiro(
  endereco: string,
  token: string,
  validarSessao: (sessao: string | undefined) => Promise<boolean>,
) {
  const origem = new URL(endereco);
  if (!['http:', 'https:'].includes(origem.protocol) || origem.username || origem.password) {
    throw new Error('FINANCEIRO_URL deve ser uma URL HTTP(S) sem credenciais.');
  }

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const financeira = rotasFinanceiras.test(req.path);
    const transicao = req.method === 'POST' && transicaoComDependenciaFinanceira.test(req.path);
    const sessao = lerCookieSessao(req.get('cookie'));
    if ((transicao || financeira) && (!sessao || !(await validarSessao(sessao)))) {
      res.status(401).json({ message: 'Sessão inválida ou expirada.' });
      return;
    }
    if (!financeira) {
      if (transicao) {
        try {
          const resposta = await fetch(new URL('/api/health', origem), {
            redirect: 'error',
            signal: AbortSignal.timeout(3_000),
          });
          if (!resposta.ok) throw new Error('Health check do Financeiro indisponível.');
        } catch {
          res.status(503).json({ message: 'Serviço financeiro indisponível. Tente novamente.' });
          return;
        }
      }
      next();
      return;
    }

    const headers = new Headers({ [headerInterno]: token });
    if (sessao) {
      headers.set('cookie', `${COOKIE_SESSAO}=${sessao}`);
    }

    let body: string | undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body !== undefined) {
      headers.set('content-type', 'application/json');
      body = JSON.stringify(req.body);
    }

    try {
      const resposta = await fetch(origem.origin + req.originalUrl, {
        method: req.method,
        headers,
        body,
        redirect: 'error',
        signal: AbortSignal.timeout(15_000),
      });
      res.status(resposta.status);
      res.set('cache-control', 'no-store');
      const tipo = resposta.headers.get('content-type');
      if (tipo) res.set('content-type', tipo);
      res.send(Buffer.from(await resposta.arrayBuffer()));
    } catch {
      res.status(503).json({ message: 'Serviço financeiro indisponível. Tente novamente.' });
    }
  };
}
