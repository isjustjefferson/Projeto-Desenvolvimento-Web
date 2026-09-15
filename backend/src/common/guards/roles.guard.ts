import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '../../contrato.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import type { RequisicaoComUsuario } from '../requisicao.js';

// Valida se o perfil do usuário autenticado está entre os roles exigidos
// pelo decorator @Roles(...). Sem @Roles, passa.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const exigidos = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);

    if (!exigidos || exigidos.length === 0) return true;

    const request =
      contexto.switchToHttp().getRequest<RequisicaoComUsuario>();
    const usuario = request.usuario;

    if (!usuario || !exigidos.includes(usuario.role)) {
      throw new ForbiddenException(
        'Acesso restrito ao perfil ' + exigidos.join(' ou '),
      );
    }
    return true;
  }
}