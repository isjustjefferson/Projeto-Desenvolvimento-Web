import type { NovoCadastro, Usuario } from '../types';
import { del, get, patch, post } from './client';
import {
  respostaOkSchema,
  respostaTokenSchema,
  respostaUsuarioSchema,
} from './schemas';

export async function login(email: string, senha: string): Promise<Usuario> {
  const res = await post('/auth/login', { email, senha }, respostaUsuarioSchema);
  return res.usuario;
}

export async function registrar(dados: NovoCadastro): Promise<Usuario> {
  const res = await post('/auth/register', dados, respostaUsuarioSchema);
  return res.usuario;
}

export async function obterMe(): Promise<Usuario> {
  const res = await get('/me', respostaUsuarioSchema);
  return res.usuario;
}

export async function atualizarConta(dados: {
  nome?: string;
  foto?: string;
}): Promise<Usuario> {
  const res = await patch('/me', dados, respostaUsuarioSchema);
  return res.usuario;
}

export async function excluirConta(): Promise<void> {
  await del('/me', respostaOkSchema);
}

export async function esqueciSenha(email: string): Promise<string> {
  const res = await post('/auth/forgot-password', { email }, respostaTokenSchema);
  return res.token;
}

export async function redefinirSenha(
  token: string,
  novaSenha: string,
): Promise<void> {
  await post('/auth/reset-password', { token, novaSenha }, respostaOkSchema);
}
