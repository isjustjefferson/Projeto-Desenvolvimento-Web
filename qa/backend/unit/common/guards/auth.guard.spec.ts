import { UnauthorizedException } from '@nestjs/common';
import type { DataSource, Repository } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';
import { DURACAO_SESSAO_MS, SessoesService } from '../../../../../backend/src/auth/sessoes.service.js';
import { StoreService } from '../../../../../backend/src/dados/store.service.js';
import type { UsuarioEntity } from '../../../../../backend/src/database/entities/usuario.entity.js';
import { AuthGuard } from '../../../../../backend/src/common/guards/auth.guard.js';

type Contexto = Parameters<AuthGuard['canActivate']>[0];

function contexto(cookie?: string) {
  const request = { headers: { cookie, 'x-usuario-id': '6' }, usuario: undefined as { id: number } | undefined };
  const ctx = { switchToHttp: () => ({ getRequest: () => request }) } as unknown as Contexto;
  return { ctx, request };
}

function preparar() {
  const store = new StoreService();
  const sessoes = new SessoesService(store, {} as Repository<UsuarioEntity>, {} as DataSource);
  return { store, sessoes, guard: new AuthGuard(sessoes) };
}

describe('AuthGuard', () => {
  it('recusa o identificador enviado sozinho ou um cookie desconhecido', async () => {
    const { guard } = preparar();
    await expect(guard.canActivate(contexto().ctx)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(guard.canActivate(contexto('predial_sessao=' + 'a'.repeat(43)).ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('usa o usuário da sessão e recusa a sessão de usuário desativado', async () => {
    const { store, sessoes, guard } = preparar();
    const token = await sessoes.criar(1);
    const { ctx, request } = contexto(`outro=ignorar; predial_sessao=${token}`);
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.usuario?.id).toBe(1);
    store.atualizarUsuario({ ...store.getUsuarioInternoPorId(1)!, ativo: false });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('recusa sessão expirada', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      const { sessoes, guard } = preparar();
      const token = await sessoes.criar(1);
      vi.setSystemTime(Date.now() + DURACAO_SESSAO_MS);
      await expect(guard.canActivate(contexto(`predial_sessao=${token}`).ctx)).rejects.toBeInstanceOf(UnauthorizedException);
    } finally {
      vi.useRealTimers();
    }
  });
});
