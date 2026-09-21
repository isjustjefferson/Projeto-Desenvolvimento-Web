import type { NovoCadastro, Usuario } from '../types';
import { del, get, patch, post } from './client';

interface RespostaUsuario {
  ok: true;
  usuario: Usuario;
}

interface RespostaToken {
  ok: true;
  token: string;
}

export async function login(email: string, senha: string): Promise<Usuario> {
  const res = await post<RespostaUsuario>('/auth/login', { email, senha });
  return res.usuario;
}

export async function registrar(dados: NovoCadastro): Promise<Usuario> {
  const res = await post<RespostaUsuario>('/auth/register', dados);
  return res.usuario;
}

export async function obterMe(): Promise<Usuario> {
  const res = await get<RespostaUsuario>('/me');
  return res.usuario;
}

export async function atualizarConta(dados: {
  nome?: string;
  foto?: string;
}): Promise<Usuario> {
  const res = await patch<RespostaUsuario>('/me', dados);
  return res.usuario;
}

export async function excluirConta(): Promise<void> {
  await del<{ ok: true }>('/me');
}

export async function esqueciSenha(email: string): Promise<string> {
  const res = await post<RespostaToken>('/auth/forgot-password', { email });
  return res.token;
}

export async function redefinirSenha(
  token: string,
  novaSenha: string,
): Promise<void> {
  await post<{ ok: true }>('/auth/reset-password', { token, novaSenha });
}
