import type { Request, Response } from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  autenticarChamados,
  encaminharFinanceiro,
} from '../../../../backend/src/financeiro/financeiro-http.js';

function requisicao(path: string, method = 'GET', headers: Record<string, string> = {}, body?: unknown) {
  return {
    path: path.split('?')[0],
    originalUrl: path,
    method,
    body,
    get: (nome: string) => headers[nome],
  } as Request;
}

function resposta() {
  const mock = {
    status: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    send: vi.fn(),
    json: vi.fn(),
  };
  return { mock, res: mock as unknown as Response };
}

afterEach(() => vi.unstubAllGlobals());

describe('encaminhamento para o Financeiro', () => {
  const sessao = 'a'.repeat(43);
  const cookie = `predial_sessao=${sessao}`;
  const encaminhar = encaminharFinanceiro(
    'http://financeiro:3000',
    'credencial-de-teste',
    async (valor) => valor === sessao,
  );

  it('preserva o contrato e aplica a credencial interna do servidor', async () => {
    const upstream = vi.fn().mockResolvedValue(new globalThis.Response('{"ok":true}', {
      status: 201,
      headers: { 'content-type': 'application/json' },
    }));
    vi.stubGlobal('fetch', upstream);
    const { mock, res } = resposta();
    const next = vi.fn();
    await encaminhar(requisicao(
      '/api/chamados/25/despesas?exemplo=1', 'POST',
      { cookie: `debug=ignorar; ${cookie}`, 'x-usuario-id': '7', 'x-financeiro-token': 'ignorar', 'x-ocr-worker-token': 'ignorar' },
      { descricao: 'Fictício' },
    ), res, next);

    expect(upstream.mock.calls[0][0]).toBe('http://financeiro:3000/api/chamados/25/despesas?exemplo=1');
    const config = upstream.mock.calls[0][1];
    expect(config.headers.get('x-financeiro-token')).toBe('credencial-de-teste');
    expect(config.headers.get('cookie')).toBe(cookie);
    expect(config.headers.has('x-usuario-id')).toBe(false);
    expect(config.headers.has('x-ocr-worker-token')).toBe(false);
    expect(JSON.parse(config.body)).toEqual({ descricao: 'Fictício' });
    expect(mock.status).toHaveBeenCalledWith(201);
    expect(mock.send.mock.calls[0][0].toString()).toBe('{"ok":true}');
    expect(next).not.toHaveBeenCalled();
  });

  it('mantém a leitura dos chamados quando o Financeiro cai e bloqueia a transição', async () => {
    const upstream = vi.fn().mockRejectedValue(new Error('conexão interrompida'));
    vi.stubGlobal('fetch', upstream);
    const { mock, res } = resposta();
    const next = vi.fn();
    await encaminhar(requisicao('/api/chamados/25'), res, next);
    expect(upstream).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();

    await encaminhar(requisicao('/api/chamados/25/concluir', 'POST', { cookie }), res, next);
    expect(mock.status).toHaveBeenCalledWith(503);
    expect(next).toHaveBeenCalledOnce();
  });

  it('recusa id avulso ou sessão inválida antes de acessar a rede', async () => {
    const upstream = vi.fn();
    vi.stubGlobal('fetch', upstream);
    const { mock, res } = resposta();
    const next = vi.fn();
    await encaminhar(requisicao('/api/chamados/25/despesas', 'GET', { 'x-usuario-id': '6' }), res, next);
    await encaminhar(requisicao('/api/chamados/25/despesas', 'GET', { cookie: 'predial_sessao=' + 'b'.repeat(43) }), res, next);
    expect(mock.status).toHaveBeenCalledWith(401);
    expect(upstream).not.toHaveBeenCalled();
  });

  it('exige a credencial interna para as rotas financeiras', () => {
    const autenticar = autenticarChamados('credencial-de-teste');
    const { mock, res } = resposta();
    const next = vi.fn();
    autenticar(requisicao('/api/chamados/25/despesas'), res, next);
    autenticar(requisicao('/api/health'), res, next);
    autenticar(requisicao('/api/chamados/25/despesas', 'GET', {
      'x-financeiro-token': 'credencial-de-teste',
    }), res, next);
    expect(mock.status).toHaveBeenCalledWith(401);
    expect(next).toHaveBeenCalledTimes(2);
  });
});
