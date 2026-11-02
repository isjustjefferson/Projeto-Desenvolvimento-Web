import type { z } from 'zod';
import type {
  categoriaDespesaSchema,
  categoriaSchema,
  chamadoSchema,
  formaPagamentoSchema,
  pagoPorSchema,
  prioridadeSchema,
  resumoFinanceiroSchema,
  roleSchema,
  statusDespesaSchema,
  statusSchema,
  tipoAnexoSchema,
  tipoDocumentoFiscalSchema,
  usuarioResumoSchema,
  usuarioSchema,
  despesaSchema,
} from './api/schemas';

// Os tipos de payload vêm dos schemas Zod (fonte única da verdade e validação
// de runtime — ver api/schemas.ts). AuthState/NovoCadastro/AuthResult seguem
// como interfaces porque não são payloads de resposta da API.
export type Role = z.infer<typeof roleSchema>;

export type Status = z.infer<typeof statusSchema>;

export type Prioridade = z.infer<typeof prioridadeSchema>;

export type Categoria = z.infer<typeof categoriaSchema>;

export type CategoriaDespesa = z.infer<typeof categoriaDespesaSchema>;

export type StatusDespesa = z.infer<typeof statusDespesaSchema>;

export type FormaPagamento = z.infer<typeof formaPagamentoSchema>;

export type PagoPor = z.infer<typeof pagoPorSchema>;

export type TipoAnexo = z.infer<typeof tipoAnexoSchema>;

export type TipoDocumentoFiscal = z.infer<typeof tipoDocumentoFiscalSchema>;

export type Usuario = z.infer<typeof usuarioSchema>;

export type UsuarioResumo = z.infer<typeof usuarioResumoSchema>;

export type Chamado = z.infer<typeof chamadoSchema>;

export type Despesa = z.infer<typeof despesaSchema>;

export type ResumoFinanceiro = z.infer<typeof resumoFinanceiroSchema>;

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
