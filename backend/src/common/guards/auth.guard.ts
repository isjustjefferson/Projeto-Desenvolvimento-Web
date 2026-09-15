import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { StoreService } from '../../dados/store.service.js';
import type { RequisicaoComUsuario } from '../requisicao.js';

// Autenticação simples: lê o header "x-usuario-id", resolve o usuário na
// memória e o injeta na request como "request.usuario".
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly store: StoreService) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const request =
      contexto.switchToHttp().getRequest<RequisicaoComUsuario>();
    const raw = request.headers['x-usuario-id'];

    if (typeof raw !== 'string' || raw.trim() === '') {
      throw new UnauthorizedException(
        'Autenticação necessária (header x-usuario-id).',
      );
    }

    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0) {
      throw new UnauthorizedException('x-usuario-id inválido.');
    }

    const usuario = this.store.getUsuarioInternoPorId(id);
    if (!usuario) {
      throw new UnauthorizedException(
        'Usuário não encontrado para o x-usuario-id informado.',
      );
    }

    request.usuario = usuario;
    return true;
  }
}