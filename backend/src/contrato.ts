// Espelha os tipos do frontend (frontend/src/types.ts) para manter o mesmo
// contrato. A diferença: usuário público NUNCA expõe a senha.

export type Role = 'SOLICITANTE' | 'TECNICO' | 'GESTOR' | 'ADMINISTRADOR';

export type Status =
  | 'AGUARDANDO_APROVACAO'
  | 'REVISADO'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDO';

export type Prioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export type Categoria =
  | 'ELETRICA'
  | 'HIDRAULICA'
  | 'CLIMATIZACAO'
  | 'MOBILIARIO'
  | 'ESTRUTURAL'
  | 'OUTROS';

export interface Local {
  predio: string;
  andar?: string;
  sala?: string;
}

export interface UsuarioPublico {
  id: number;
  nome: string;
  email: string;
  role: Role;
  unidade?: string;
  especialidade?: string;
  setor?: string;
  ativo: boolean;
  foto?: string;
  criadoEm?: string;
}

// Resumo exposto a qualquer usuário autenticado: suficiente para exibir nomes
// e montar a lista de técnicos, sem dados sensíveis (e-mail, setor, etc.).
export interface UsuarioResumo {
  id: number;
  nome: string;
  role: Role;
  especialidade?: string;
}

export interface Solucao {
  descricao: string;
  materiais: string;
}

export interface Historico {
  id: number;
  usuarioId: number;
  de?: Status | null;
  para: Status;
  dataHora: string;
  observacao?: string;
}

export interface Classificacao {
  prioridadeSugerida: Prioridade;
  pontuacao: number;
  motivos: string[];
}

export type CategoriaDespesa =
  | 'MATERIAL'
  | 'MAO_DE_OBRA'
  | 'SERVICO_TERCEIRO'
  | 'DESLOCAMENTO'
  | 'OUTROS';

export type StatusDespesa = 'PENDENTE' | 'APROVADA' | 'REJEITADA';

export type FormaPagamento = 'DINHEIRO' | 'PIX' | 'CARTAO' | 'FATURADO';

export type PagoPor = 'TECNICO' | 'EMPRESA';

export type TipoAnexo = 'NOTA_FISCAL' | 'RECIBO' | 'COMPROVANTE_PAGAMENTO' | 'OUTRO';

export type TipoDocumentoFiscal =
  | 'NFE'
  | 'NFSE'
  | 'NFCE'
  | 'CUPOM_FISCAL'
  | 'RECIBO'
  | 'BOLETO_COMPROVANTE'
  | 'OUTRO';

export interface AnexoDespesa {
  id: number;
  despesaId: number;
  tipo: TipoAnexo;
  tipoDocumentoFiscal?: TipoDocumentoFiscal;
  chaveNFe?: string;
  numero?: string;
  serie?: string;
  nomeArquivo: string;
  mimeType: string;
  tamanhoBytes: number;
  hashSha256?: string;
  conteudo: string;
  enviadoPorId: number;
  criadoEm: string;
}

export interface Despesa {
  id: number;
  chamadoId: number;
  registradoPorId: number;
  categoria: CategoriaDespesa;
  descricao: string;
  fornecedor?: string;
  cnpj?: string;
  numeroNota?: string;
  serie?: string;
  dataEmissao?: string;
  valorCentavos: number;
  formaPagamento?: FormaPagamento;
  pagoPor?: PagoPor;
  status: StatusDespesa;
  motivoRejeicao?: string;
  aprovadoPorId?: number;
  aprovadoEm?: string;
  criadoEm: string;
  atualizadoEm: string;
  anexos: AnexoDespesa[];
}

export interface ResumoFinanceiro {
  totalCentavos: number;
  aprovadoCentavos: number;
  pendenteCentavos: number;
  rejeitadoCentavos: number;
}

export interface Chamado {
  id: number;
  titulo: string;
  descricao: string;
  categoria: Categoria;
  local: Local;
  status: Status;
  prioridade: Prioridade | null;
  classificacao?: Classificacao | null;
  foto?: string | null;
  criadoPorId: number;
  tecnicoId?: number | null;
  criadoEm: string;
  atualizadoEm: string;
  historico: Historico[];
  solucao?: Solucao | null;
  despesas?: Despesa[];
  resumoFinanceiro?: ResumoFinanceiro;
}

export interface NovoChamadoInput {
  titulo: string;
  descricao: string;
  categoria: Categoria;
  local: Local;
  foto?: string;
}

export interface SolucaoInput {
  descricao: string;
  materiais: string;
}