import type { Role, Usuario, UsuarioResumo } from '../types';
import { del, get, patch, post } from './client';
import {
  respostaOkSchema,
  respostaResumoSchema,
  respostaUsuarioSchema,
  respostaUsuariosSchema,
} from './schemas';

export async function listar(): Promise<Usuario[]> {
  const res = await get('/usuarios', respostaUsuariosSchema);
  return res.usuarios;
}

export async function listarResumo(): Promise<UsuarioResumo[]> {
  const res = await get('/usuarios/resumo', respostaResumoSchema);
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
  const res = await post('/usuarios', dados, respostaUsuarioSchema);
  return res.usuario;
}

export async function alterarRole(id: number, role: Role): Promise<Usuario> {
  const res = await patch(
    `/usuarios/${id}/role`,
    { role },
    respostaUsuarioSchema,
  );
  return res.usuario;
}

export async function excluir(id: number): Promise<void> {
  await del(`/usuarios/${id}`, respostaOkSchema);
}
