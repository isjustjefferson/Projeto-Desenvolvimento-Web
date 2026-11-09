import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Repository } from 'typeorm';
import { StoreService } from '../../dados/store.service.js';
import { UsuarioEntity } from '../../database/entities/usuario.entity.js';
import { mapUsuarioToInterno } from '../../database/mappers/usuario.mapper.js';
import type { RequisicaoComUsuario } from '../requisicao.js';

// Autenticação simples: lê o header "x-usuario-id", resolve o usuário
// (DB em execução normal; memória em testes) e injeta em "request.usuario".
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly store: StoreService,
    @Inject('USUARIO_REPO') private readonly usuarioRepo: Repository<UsuarioEntity>,
  ) {}

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

    const usuario = await this.resolverUsuario(id);
    if (!usuario) {
      throw new UnauthorizedException(
        'Usuário não encontrado para o x-usuario-id informado.',
      );
    }

    request.usuario = usuario;
    return true;
  }

  private async resolverUsuario(id: number) {
    if (process.env.NODE_ENV === 'test' || !!process.env.VITEST) {
      return this.store.getUsuarioInternoPorId(id);
    }
    const entidade = await this.usuarioRepo.findOne({ where: { id } });
    return entidade ? mapUsuarioToInterno(entidade) : undefined;
  }
}