import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import type { UsuarioInterno } from '../dados/seed.js';
import { AuthService } from './auth.service.js';
import { AtualizarContaDto } from './dto/auth.dto.js';
import { COOKIE_SESSAO, opcoesCookieSessao } from './sessao-cookie.js';

@Controller('me')
@UseGuards(AuthGuard)
export class MeController {
  constructor(private readonly auth: AuthService) {}

  @Get()
  obter(@UsuarioAtual() usuario: UsuarioInterno) {
    return this.auth.obterMe(usuario.id);
  }

  @Patch()
  atualizar(
    @UsuarioAtual() usuario: UsuarioInterno,
    @Body() dto: AtualizarContaDto,
  ) {
    return this.auth.atualizarConta(usuario.id, dto);
  }

  @Delete()
  async excluir(@UsuarioAtual() usuario: UsuarioInterno, @Res({ passthrough: true }) res: Response) {
    const resultado = await this.auth.excluirConta(usuario.id);
    res.clearCookie(COOKIE_SESSAO, opcoesCookieSessao());
    return resultado;
  }
}
