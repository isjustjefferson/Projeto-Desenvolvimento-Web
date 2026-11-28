import {
  Body, Controller, Delete, Get, Header, Param, ParseIntPipe, Patch, Post, UseGuards,
} from '@nestjs/common';
import { ChamadosService } from '../chamados/chamados.service.js';
import {
  AnexoDespesaDto,
  CorrigirValorOcrDto,
  CriarDespesaDto,
  CriarOrcamentoDto,
  EditarDespesaDto,
  RejeitarDespesaDto,
  RejeitarOrcamentoDto,
} from '../chamados/dto/chamados.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import type { UsuarioInterno } from '../dados/seed.js';

@Controller('chamados')
@UseGuards(AuthGuard, RolesGuard)
export class FinanceiroController {
  constructor(private readonly chamados: ChamadosService) {}

  @Get(':id/orcamentos')
  listarOrcamentos(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.chamados.listarOrcamentos(id, usuario);
  }

  @Post(':id/orcamentos')
  @Roles('PRESTADOR')
  criarOrcamento(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CriarOrcamentoDto,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.chamados.criarOrcamento(id, usuario, dto);
  }

  @Post(':id/orcamentos/:orcamentoId/aprovar')
  @Roles('SINDICO', 'ADMINISTRADOR')
  aprovarOrcamento(
    @Param('id', ParseIntPipe) id: number,
    @Param('orcamentoId', ParseIntPipe) orcamentoId: number,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.chamados.aprovarOrcamento(id, orcamentoId, usuario);
  }

  @Post(':id/orcamentos/:orcamentoId/rejeitar')
  @Roles('SINDICO', 'ADMINISTRADOR')
  rejeitarOrcamento(
    @Param('id', ParseIntPipe) id: number,
    @Param('orcamentoId', ParseIntPipe) orcamentoId: number,
    @Body() dto: RejeitarOrcamentoDto,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.chamados.rejeitarOrcamento(id, orcamentoId, usuario, dto);
  }

  @Get(':id/despesas')
  listarDespesas(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.chamados.listarDespesas(id, usuario);
  }

  @Get(':id/despesas/:despesaId/anexos/:anexoId')
  @Header('Cache-Control', 'no-store')
  @Roles('PRESTADOR', 'SINDICO', 'ADMINISTRADOR')
  obterConteudoAnexoDespesa(
    @Param('id', ParseIntPipe) id: number,
    @Param('despesaId', ParseIntPipe) despesaId: number,
    @Param('anexoId', ParseIntPipe) anexoId: number,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.chamados.obterConteudoAnexoDespesa(id, despesaId, anexoId, usuario);
  }

  @Post(':id/despesas')
  @Roles('PRESTADOR', 'SINDICO', 'ADMINISTRADOR')
  criarDespesa(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CriarDespesaDto,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.chamados.criarDespesa(id, usuario, dto);
  }

  @Patch(':id/despesas/:despesaId')
  @Roles('PRESTADOR', 'SINDICO', 'ADMINISTRADOR')
  editarDespesa(
    @Param('id', ParseIntPipe) id: number,
    @Param('despesaId', ParseIntPipe) despesaId: number,
    @Body() dto: EditarDespesaDto,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.chamados.editarDespesa(id, despesaId, usuario, dto);
  }

  @Delete(':id/despesas/:despesaId')
  @Roles('PRESTADOR', 'SINDICO', 'ADMINISTRADOR')
  removerDespesa(
    @Param('id', ParseIntPipe) id: number,
    @Param('despesaId', ParseIntPipe) despesaId: number,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.chamados.removerDespesa(id, despesaId, usuario);
  }

  @Post(':id/despesas/:despesaId/anexos')
  @Roles('PRESTADOR', 'SINDICO', 'ADMINISTRADOR')
  anexarDespesa(
    @Param('id', ParseIntPipe) id: number,
    @Param('despesaId', ParseIntPipe) despesaId: number,
    @Body() dto: AnexoDespesaDto,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.chamados.anexarDespesa(id, despesaId, usuario, dto);
  }

  @Delete(':id/despesas/:despesaId/anexos/:anexoId')
  @Roles('PRESTADOR', 'SINDICO', 'ADMINISTRADOR')
  removerAnexoDespesa(
    @Param('id', ParseIntPipe) id: number,
    @Param('despesaId', ParseIntPipe) despesaId: number,
    @Param('anexoId', ParseIntPipe) anexoId: number,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.chamados.removerAnexoDespesa(id, despesaId, anexoId, usuario);
  }

  @Patch(':id/despesas/:despesaId/anexos/:anexoId')
  @Roles('PRESTADOR', 'SINDICO', 'ADMINISTRADOR')
  corrigirValorOcr(
    @Param('id', ParseIntPipe) id: number,
    @Param('despesaId', ParseIntPipe) despesaId: number,
    @Param('anexoId', ParseIntPipe) anexoId: number,
    @Body() dto: CorrigirValorOcrDto,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.chamados.corrigirValorOcr(id, despesaId, anexoId, dto, usuario);
  }

  @Post(':id/despesas/:despesaId/aprovar')
  @Roles('SINDICO', 'ADMINISTRADOR')
  aprovarDespesa(
    @Param('id', ParseIntPipe) id: number,
    @Param('despesaId', ParseIntPipe) despesaId: number,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.chamados.aprovarDespesa(id, despesaId, usuario);
  }

  @Post(':id/despesas/:despesaId/rejeitar')
  @Roles('SINDICO', 'ADMINISTRADOR')
  rejeitarDespesa(
    @Param('id', ParseIntPipe) id: number,
    @Param('despesaId', ParseIntPipe) despesaId: number,
    @Body() dto: RejeitarDespesaDto,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.chamados.rejeitarDespesa(id, despesaId, usuario, dto);
  }
}
