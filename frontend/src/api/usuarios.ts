import type { Role, Usuario, UsuarioResumo } from '../types';
import { del, get, patch, post } from './client';

interface RespostaUsuarios {
  ok: true;
  usuarios: Usuario[];
}

interface RespostaResumo {
  ok: true;
  usuarios: UsuarioResumo[];
}

interface RespostaUsuario {
  ok: true;
  usuario: Usuario;
}

export async function listar(): Promise<Usuario[]> {
  const res = await get<RespostaUsuarios>('/usuarios');
  return res.usuarios;
}

export async function listarResumo(): Promise<UsuarioResumo[]> {
  const res = await get<RespostaResumo>('/usuarios/resumo');
  return res.usuarios;
}

export async function criar(dados: {
  nome: string;
  email: string;
  senha: string;
  role: Role;
  especialidade?: string;
  setor?: string;
}): Promise<Usuario> {
  const res = await post<RespostaUsuario>('/usuarios', dados);
  return res.usuario;
}

export async function alterarRole(id: number, role: Role): Promise<Usuario> {
  const res = await patch<RespostaUsuario>(`/usuarios/${id}/role`, { role });
  return res.usuario;
}

export async function excluir(id: number): Promise<void> {
  await del<{ ok: true }>(`/usuarios/${id}`);
}
