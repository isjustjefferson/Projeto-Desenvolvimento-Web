import type { NovoCadastro, Usuario } from '../types';
import { del, get, patch, post } from './client';
import {
  respostaOkSchema,
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

export async function sair(): Promise<void> {
  await post('/auth/logout');
}
