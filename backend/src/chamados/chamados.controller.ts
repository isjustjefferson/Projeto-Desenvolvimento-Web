import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
  AnexoDespesaDto,
  AprovarChamadoDto,
  ConcluirChamadoDto,
  CriarChamadoDto,
  CriarDespesaDto,
  EditarDespesaDto,
  FiltrosChamadosDto,
  RejeitarDespesaDto,
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
  @Roles('SOLICITANTE', 'GESTOR', 'ADMINISTRADOR')
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

  @Get(':id/despesas')
  listarDespesas(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.chamados.listarDespesas(id, usuario);
  }

  @Post(':id/despesas')
  @Roles('TECNICO', 'GESTOR', 'ADMINISTRADOR')
  criarDespesa(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CriarDespesaDto,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.chamados.criarDespesa(id, usuario, dto);
  }

  @Patch(':id/despesas/:despesaId')
  @Roles('TECNICO', 'GESTOR', 'ADMINISTRADOR')
  editarDespesa(
    @Param('id', ParseIntPipe) id: number,
    @Param('despesaId', ParseIntPipe) despesaId: number,
    @Body() dto: EditarDespesaDto,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.chamados.editarDespesa(id, despesaId, usuario, dto);
  }

  @Delete(':id/despesas/:despesaId')
  @Roles('TECNICO', 'GESTOR', 'ADMINISTRADOR')
  removerDespesa(
    @Param('id', ParseIntPipe) id: number,
    @Param('despesaId', ParseIntPipe) despesaId: number,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.chamados.removerDespesa(id, despesaId, usuario);
  }

  @Post(':id/despesas/:despesaId/anexos')
  @Roles('TECNICO', 'GESTOR', 'ADMINISTRADOR')
  anexarDespesa(
    @Param('id', ParseIntPipe) id: number,
    @Param('despesaId', ParseIntPipe) despesaId: number,
    @Body() dto: AnexoDespesaDto,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.chamados.anexarDespesa(id, despesaId, usuario, dto);
  }

  @Delete(':id/despesas/:despesaId/anexos/:anexoId')
  @Roles('TECNICO', 'GESTOR', 'ADMINISTRADOR')
  removerAnexoDespesa(
    @Param('id', ParseIntPipe) id: number,
    @Param('despesaId', ParseIntPipe) despesaId: number,
    @Param('anexoId', ParseIntPipe) anexoId: number,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.chamados.removerAnexoDespesa(id, despesaId, anexoId, usuario);
  }

  @Post(':id/despesas/:despesaId/aprovar')
  @Roles('GESTOR', 'ADMINISTRADOR')
  aprovarDespesa(
    @Param('id', ParseIntPipe) id: number,
    @Param('despesaId', ParseIntPipe) despesaId: number,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.chamados.aprovarDespesa(id, despesaId, usuario);
  }

  @Post(':id/despesas/:despesaId/rejeitar')
  @Roles('GESTOR', 'ADMINISTRADOR')
  rejeitarDespesa(
    @Param('id', ParseIntPipe) id: number,
    @Param('despesaId', ParseIntPipe) despesaId: number,
    @Body() dto: RejeitarDespesaDto,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.chamados.rejeitarDespesa(id, despesaId, usuario, dto);
  }
}