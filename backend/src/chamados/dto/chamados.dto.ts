import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBase64,
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import type {
  Categoria,
  CategoriaDespesa,
  FormaPagamento,
  Local,
  PagoPor,
  Prioridade,
  Status,
  TipoAnexo,
} from '../../contrato.js';

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

const CATEGORIAS_DESPESA: CategoriaDespesa[] = [
  'MATERIAL',
  'MAO_DE_OBRA',
  'SERVICO_TERCEIRO',
  'DESLOCAMENTO',
  'OUTROS',
];

const FORMAS_PAGAMENTO: FormaPagamento[] = ['DINHEIRO', 'PIX', 'CARTAO', 'FATURADO'];

const PAGOS_POR: PagoPor[] = ['TECNICO', 'EMPRESA'];

const TIPOS_ANEXO: TipoAnexo[] = [
  'NOTA_FISCAL',
  'RECIBO',
  'COMPROVANTE_PAGAMENTO',
  'OUTRO',
];

const TIPOS_DOCUMENTO_FISCAL = [
  'NFE',
  'NFSE',
  'NFCE',
  'CUPOM_FISCAL',
  'RECIBO',
  'BOLETO_COMPROVANTE',
  'OUTRO',
] as const;

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

export class AnexoDespesaDto {
  @IsIn(TIPOS_ANEXO, { message: 'Tipo de anexo inválido.' })
  tipo!: TipoAnexo;

  @IsOptional()
  @IsIn(TIPOS_DOCUMENTO_FISCAL as unknown as string[], {
    message: 'Tipo de documento fiscal inválido.',
  })
  tipoDocumentoFiscal?: (typeof TIPOS_DOCUMENTO_FISCAL)[number];

  @IsOptional()
  @IsString()
  @MaxLength(44)
  chaveNFe?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  numero?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  serie?: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe o nome do arquivo.' })
  @MaxLength(255)
  nomeArquivo!: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe o tipo MIME.' })
  @MaxLength(100)
  mimeType!: string;

  @IsInt({ message: 'Tamanho do arquivo inválido.' })
  @Min(1)
  tamanhoBytes!: number;

  @IsString()
  @IsNotEmpty({ message: 'Conteúdo do anexo inválido.' })
  conteudo!: string;
}

export class CriarDespesaDto {
  @IsIn(CATEGORIAS_DESPESA, { message: 'Categoria da despesa inválida.' })
  categoria!: CategoriaDespesa;

  @IsString()
  @IsNotEmpty({ message: 'Descreva a despesa.' })
  @MaxLength(500)
  descricao!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  fornecedor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cnpj?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  numeroNota?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  serie?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'Data de emissão inválida.' })
  dataEmissao?: string;

  @IsInt({ message: 'Valor inválido.' })
  @Min(1, { message: 'Valor deve ser maior que zero.' })
  valorCentavos!: number;

  @IsOptional()
  @IsIn(FORMAS_PAGAMENTO, { message: 'Forma de pagamento inválida.' })
  formaPagamento?: FormaPagamento;

  @IsOptional()
  @IsIn(PAGOS_POR, { message: 'Quem pagou inválido.' })
  pagoPor?: PagoPor;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5, { message: 'Máximo de 5 anexos por despesa.' })
  @ValidateNested({ each: true })
  @Type(() => AnexoDespesaDto)
  anexos?: AnexoDespesaDto[];
}

export class EditarDespesaDto {
  @IsOptional()
  @IsIn(CATEGORIAS_DESPESA, { message: 'Categoria da despesa inválida.' })
  categoria?: CategoriaDespesa;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Descreva a despesa.' })
  @MaxLength(500)
  descricao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  fornecedor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cnpj?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  numeroNota?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  serie?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'Data de emissão inválida.' })
  dataEmissao?: string;

  @IsOptional()
  @IsInt({ message: 'Valor inválido.' })
  @Min(1, { message: 'Valor deve ser maior que zero.' })
  valorCentavos?: number;

  @IsOptional()
  @IsIn(FORMAS_PAGAMENTO, { message: 'Forma de pagamento inválida.' })
  formaPagamento?: FormaPagamento;

  @IsOptional()
  @IsIn(PAGOS_POR, { message: 'Quem pagou inválido.' })
  pagoPor?: PagoPor;
}

export class RejeitarDespesaDto {
  @IsString()
  @IsNotEmpty({ message: 'Informe o motivo da rejeição.' })
  @MaxLength(500)
  motivo!: string;
}