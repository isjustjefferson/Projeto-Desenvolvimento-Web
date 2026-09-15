import { ForbiddenException, Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';
import type { Role } from '../../contrato.js';
import { RolesGuard } from './roles.guard.js';

type Contexto = Parameters<RolesGuard['canActivate']>[0];

function contexto(role?: Role) {
  const request = {
    usuario: role ? { id: 1, role } : undefined,
  };
  const ctx: Contexto = {
    getHandler: () => () => undefined,
    getClass: () => class {} as Type,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as Contexto;
  return ctx;
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  it('libera quando não exige roles (@Roles ausente)', () => {
    vi.spyOn(Reflector.prototype, 'getAllAndOverride').mockReturnValueOnce(
      undefined,
    );
    expect(guard.canActivate(contexto('SOLICITANTE'))).toBe(true);
  });

  it('libera quando o perfil do usuário está entre os exigidos', () => {
    vi.spyOn(Reflector.prototype, 'getAllAndOverride').mockReturnValueOnce([
      'GESTOR',
      'ADMINISTRADOR',
    ] as Role[]);
    expect(guard.canActivate(contexto('GESTOR'))).toBe(true);
  });

  it('bloqueia perfil que não está entre os exigidos', () => {
    vi.spyOn(Reflector.prototype, 'getAllAndOverride').mockReturnValueOnce([
      'ADMINISTRADOR',
    ] as Role[]);
    expect(() => guard.canActivate(contexto('TECNICO'))).toThrow(
      ForbiddenException,
    );
  });

  it('bloqueia quando não há usuário autenticado', () => {
    vi.spyOn(Reflector.prototype, 'getAllAndOverride').mockReturnValueOnce([
      'ADMINISTRADOR',
    ] as Role[]);
    expect(() => guard.canActivate(contexto(undefined))).toThrow(
      ForbiddenException,
    );
  });
});