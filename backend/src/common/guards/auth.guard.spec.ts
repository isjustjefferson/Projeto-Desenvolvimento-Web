import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { StoreService } from '../../dados/store.service.js';
import { AuthGuard } from './auth.guard.js';

type Contexto = Parameters<AuthGuard['canActivate']>[0];

function contexto(header?: string) {
  const request: any = { headers: {} };
  if (header !== undefined) request.headers['x-usuario-id'] = header;
  const ctx: Contexto = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as Contexto;
  return { ctx, request };
}

describe('AuthGuard', () => {
  const guard = new AuthGuard(new StoreService());

  it('nega sem header x-usuario-id', async () => {
    const { ctx } = contexto(undefined);
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('nega header não numérico', async () => {
    const { ctx } = contexto('abc');
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('nega usuário inexistente', async () => {
    const { ctx } = contexto('999');
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('aceita usuário válido e injeta na request', async () => {
    const { ctx, request } = contexto('1');
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.usuario.id).toBe(1);
    expect(request.usuario.role).toBe('SOLICITANTE');
  });
});