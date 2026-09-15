import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequisicaoComUsuario } from '../requisicao.js';

// Injeta o usuário autenticado (setado pelo AuthGuard) no handler.
export const UsuarioAtual = createParamDecorator(
  (_dado: unknown, contexto: ExecutionContext) => {
    const request =
      contexto.switchToHttp().getRequest<RequisicaoComUsuario>();
    return request.usuario;
  },
);