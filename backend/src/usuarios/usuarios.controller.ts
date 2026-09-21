import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import type { UsuarioInterno } from '../dados/seed.js';
import { AlterarRoleDto, CriarUsuarioDto } from './dto/usuarios.dto.js';
import { UsuariosService } from './usuarios.service.js';

@Controller('usuarios')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMINISTRADOR')
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get()
  listar() {
    return this.usuarios.listar();
  }

  // Qualquer usuário autenticado pode ver o resumo (nomes/técnicos).
  @Get('resumo')
  @Roles('SOLICITANTE', 'TECNICO', 'GESTOR', 'ADMINISTRADOR')
  listarResumo() {
    return this.usuarios.listarResumo();
  }

  @Post()
  criar(@Body() dto: CriarUsuarioDto) {
    return this.usuarios.criar(dto);
  }

  @Patch(':id/role')
  alterarRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AlterarRoleDto,
    @UsuarioAtual() autenticado: UsuarioInterno,
  ) {
    return this.usuarios.alterarRole(id, dto, autenticado.id);
  }

  @Delete(':id')
  excluir(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() autenticado: UsuarioInterno,
  ) {
    return this.usuarios.excluir(id, autenticado.id);
  }
}