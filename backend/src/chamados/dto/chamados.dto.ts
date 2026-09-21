import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import type { Categoria, Local, Prioridade, Status } from '../../contrato.js';

const CATEGORIAS: Categoria[] = [
  'ELETRICA',
  'HIDRAULICA',
  'CLIMATIZACAO',
  'MOBILIARIO',
  'ESTRUTURAL',
  'OUTROS',
];

const PRIORIDADES: Prioridade[] = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];

const STATUS: Status[] = [
  'AGUARDANDO_APROVACAO',
  'REVISADO',
  'EM_ANDAMENTO',
  'CONCLUIDO',
];

export class LocalDto {
  @IsString()
  @IsNotEmpty({ message: 'Informe o prédio.' })
  predio!: string;

  @IsOptional()
  @IsString()
  andar?: string;

  @IsOptional()
  @IsString()
  sala?: string;
}

export class CriarChamadoDto {
  @IsString()
  @IsNotEmpty({ message: 'Informe o título do chamado.' })
  titulo!: string;

  @IsString()
  @IsNotEmpty({ message: 'Descreva o problema.' })
  descricao!: string;

  @IsIn(CATEGORIAS, { message: 'Categoria inválida.' })
  categoria!: Categoria;

  @ValidateNested()
  @Type(() => LocalDto)
  local!: Local;

  @IsOptional()
  @IsString()
  foto?: string;
}

export class AprovarChamadoDto {
  @IsIn(PRIORIDADES, { message: 'Prioridade inválida.' })
  prioridade!: Prioridade;

  @IsInt({ message: 'Informe um técnico válido.' })
  tecnicoId!: number;
}

export class ConcluirChamadoDto {
  @IsString()
  @IsNotEmpty({ message: 'Descreva a solução aplicada.' })
  @MaxLength(2000, { message: 'Solução muito longa.' })
  descricao!: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe os materiais utilizados.' })
  materiais!: string;
}

export class FiltrosChamadosDto {
  @IsOptional()
  @IsIn(STATUS, { message: 'Status inválido.' })
  status?: Status;

  @IsOptional()
  @IsIn(PRIORIDADES, { message: 'Prioridade inválida.' })
  prioridade?: Prioridade;

  @IsOptional()
  @IsIn(CATEGORIAS, { message: 'Categoria inválida.' })
  categoria?: Categoria;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'tecnicoid inválido.' })
  tecnicoId?: number;

  @IsOptional()
  @IsString()
  predio?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'Data "de" inválida (use ISO 8601).' })
  de?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'Data "até" inválida (use ISO 8601).' })
  ate?: string;
}