import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import type { UsuarioInterno } from '../dados/seed.js';
import { AuthService } from './auth.service.js';
import { AtualizarContaDto } from './dto/auth.dto.js';

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
  excluir(@UsuarioAtual() usuario: UsuarioInterno) {
    return this.auth.excluirConta(usuario.id);
  }
}