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

export interface Chamado {
  id: number;
  titulo: string;
  descricao: string;
  categoria: Categoria;
  local: Local;
  status: Status;
  prioridade: Prioridade | null;
  foto?: string | null;
  criadoPorId: number;
  tecnicoId?: number | null;
  criadoEm: string;
  atualizadoEm: string;
  historico: Historico[];
  solucao?: Solucao | null;
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