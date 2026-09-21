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

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  role: Role;
  unidade?: string;
  especialidade?: string; // para técnicos
  setor?: string; // para gestores / admins
  ativo: boolean;
  foto?: string;
  criadoEm?: string;
}

export interface UsuarioResumo {
  id: number;
  nome: string;
  role: Role;
  especialidade?: string;
}

export interface Chamado {
  id: number;
  titulo: string;
  descricao: string;
  categoria: Categoria;
  local: {
    predio: string;
    andar?: string;
    sala?: string;
  };
  status: Status;
  prioridade: Prioridade | null;
  foto?: string | null;
  criadoPorId: number;
  tecnicoId?: number | null;
  criadoEm: string;
  atualizadoEm: string;
  historico: {
    id: number;
    usuarioId: number;
    de?: Status | null;
    para: Status;
    dataHora: string;
    observacao?: string;
  }[];
  solucao?: {
    descricao: string;
    materiais: string;
  } | null;
}

export interface AuthState {
  usuario: Usuario | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<AuthResult>;
  registrar: (dados: NovoCadastro) => Promise<AuthResult>;
  esqueciSenha: (email: string) => Promise<AuthResult>;
  redefinirSenha: (token: string, novaSenha: string) => Promise<AuthResult>;
  atualizarConta: (dados: { nome?: string; foto?: string }) => Promise<AuthResult>;
  excluirConta: () => Promise<AuthResult>;
  criarUsuario: (dados: {
    nome: string;
    email: string;
    senha: string;
    role: Role;
    especialidade?: string;
    setor?: string;
  }) => Promise<AuthResult>;
  definirCargo: (id: number, role: Role) => Promise<AuthResult>;
  removerCargo: (id: number) => Promise<AuthResult>;
  excluirContaPorId: (id: number) => Promise<AuthResult>;
  sair: () => void;
}

export interface NovoCadastro {
  nome: string;
  email: string;
  unidade: string;
  senha: string;
}

export interface AuthResult {
  ok: boolean;
  erro?: string;
  token?: string;
}
