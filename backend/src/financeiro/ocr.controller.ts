import { Body, Controller, Get, Header, Headers, HttpCode, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize, IsArray, IsDefined, IsObject, IsOptional, IsString, IsUUID,
  MaxLength, MinLength, ValidateIf, ValidateNested,
} from 'class-validator';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import type { UsuarioInterno } from '../dados/seed.js';
import { OcrTrabalhosService } from './ocr-trabalhos.service.js';

class ItemOcrDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  descricao!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  quantidade?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  unitario?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  valor?: string | null;
}

class ResultadoOcrDto {
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => ItemOcrDto)
  itens!: ItemOcrDto[];

  @IsString()
  @MaxLength(40_000)
  texto!: string;
}

class FinalizarOcrDto {
  @IsUUID(4)
  reserva!: string;

  @ValidateIf((_dto, valor) => valor !== null)
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => ResultadoOcrDto)
  resultado!: ResultadoOcrDto | null;
}

@Controller('chamados/:id/despesas/:despesaId/anexos/:anexoId/ocr')
@UseGuards(AuthGuard, RolesGuard)
@Roles('PRESTADOR', 'SINDICO', 'ADMINISTRADOR')
export class OcrController {
  constructor(private readonly trabalhos: OcrTrabalhosService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  consultar(
    @Param('id', ParseIntPipe) id: number,
    @Param('despesaId', ParseIntPipe) despesaId: number,
    @Param('anexoId', ParseIntPipe) anexoId: number,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.trabalhos.consultar(id, despesaId, anexoId, usuario);
  }

  @Post()
  @HttpCode(202)
  solicitar(
    @Param('id', ParseIntPipe) id: number,
    @Param('despesaId', ParseIntPipe) despesaId: number,
    @Param('anexoId', ParseIntPipe) anexoId: number,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.trabalhos.solicitar(id, despesaId, anexoId, usuario);
  }
}

@Controller('fiscal/trabalhos')
export class OcrWorkerController {
  constructor(private readonly trabalhos: OcrTrabalhosService) {}

  @Post('reservar')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  reservar(@Headers('x-ocr-worker-token') token?: string) {
    return this.trabalhos.reservar(token);
  }

  @Post(':id/finalizar')
  @HttpCode(200)
  finalizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: FinalizarOcrDto,
    @Headers('x-ocr-worker-token') token?: string,
  ) {
    return this.trabalhos.finalizar(token, id, dto.reserva, dto.resultado);
  }
}
