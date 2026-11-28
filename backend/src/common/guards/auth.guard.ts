import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { lerCookieSessao } from '../../auth/sessao-cookie.js';
import { SessoesService } from '../../auth/sessoes.service.js';
import type { RequisicaoComUsuario } from '../requisicao.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly sessoes: SessoesService) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const request = contexto.switchToHttp().getRequest<RequisicaoComUsuario>();
    const usuario = await this.sessoes.usuarioDaSessao(lerCookieSessao(request.headers.cookie));
    if (!usuario) throw new UnauthorizedException('Sessão inválida ou expirada.');

    request.usuario = usuario;
    return true;
  }
}
