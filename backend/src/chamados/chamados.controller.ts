import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import type { UsuarioInterno } from '../dados/seed.js';
import { ChamadosService } from './chamados.service.js';
import {
  AprovarChamadoDto,
  ConcluirChamadoDto,
  CriarChamadoDto,
  FiltrosChamadosDto,
} from './dto/chamados.dto.js';

@Controller('chamados')
@UseGuards(AuthGuard, RolesGuard)
export class ChamadosController {
  constructor(private readonly chamados: ChamadosService) {}

  @Get()
  listar(
    @Query() filtros: FiltrosChamadosDto,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.chamados.listar(usuario, filtros);
  }

  @Get(':id')
  obter(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.chamados.obterPorId(id, usuario);
  }

  @Post()
  @Roles('SOLICITANTE', 'ADMINISTRADOR')
  criar(
    @Body() dto: CriarChamadoDto,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.chamados.criar(usuario, dto);
  }

  @Post(':id/aprovar')
  @Roles('GESTOR', 'ADMINISTRADOR')
  aprovar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AprovarChamadoDto,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.chamados.aprovar(id, usuario, dto);
  }

  @Post(':id/iniciar')
  @Roles('GESTOR', 'TECNICO', 'ADMINISTRADOR')
  iniciar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.chamados.iniciar(id, usuario);
  }

  @Post(':id/concluir')
  @Roles('TECNICO', 'ADMINISTRADOR')
  concluir(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConcluirChamadoDto,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.chamados.concluir(id, usuario, dto);
  }
}