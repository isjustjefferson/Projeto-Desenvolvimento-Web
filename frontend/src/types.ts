import type { z } from 'zod';
import type {
  categoriaSchema,
  chamadoSchema,
  prioridadeSchema,
  roleSchema,
  statusSchema,
  usuarioResumoSchema,
  usuarioSchema,
} from './api/schemas';

// Os tipos de payload vêm dos schemas Zod (fonte única da verdade e validação
// de runtime — ver api/schemas.ts). AuthState/NovoCadastro/AuthResult seguem
// como interfaces porque não são payloads de resposta da API.
export type Role = z.infer<typeof roleSchema>;

export type Status = z.infer<typeof statusSchema>;

export type Prioridade = z.infer<typeof prioridadeSchema>;

export type Categoria = z.infer<typeof categoriaSchema>;

export type Usuario = z.infer<typeof usuarioSchema>;

export type UsuarioResumo = z.infer<typeof usuarioResumoSchema>;

export type Chamado = z.infer<typeof chamadoSchema>;

export interface AuthState {
  usuario: Usuario | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<AuthResult>;
  registrar: (dados: NovoCadastro) => Promise<AuthResult>;
  esqueciSenha: (email: string) => Promise<AuthResult>;
  redefinirSenha: (token: string, novaSenha: string) => Promise<AuthResult>;
  atualizarConta: (dados: { nome?: string; foto?: string }) => Promise<AuthResult>;
  excluirConta: () => Promise<AuthResult>;
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
