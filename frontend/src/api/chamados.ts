import type { Chamado, Prioridade } from '../types';
import { get, post } from './client';
import { respostaChamadoSchema, respostaChamadosSchema } from './schemas';

export interface NovoChamadoInput {
  titulo: string;
  descricao: string;
  categoria: Chamado['categoria'];
  local: Chamado['local'];
  foto?: string;
}

export interface SolucaoInput {
  descricao: string;
  materiais: string;
}

export async function listar(): Promise<Chamado[]> {
  const res = await get('/chamados', respostaChamadosSchema);
  return res.chamados;
}

export async function obter(id: number): Promise<Chamado> {
  const res = await get(`/chamados/${id}`, respostaChamadoSchema);
  return res.chamado;
}

export async function criar(input: NovoChamadoInput): Promise<Chamado> {
  const res = await post('/chamados', input, respostaChamadoSchema);
  return res.chamado;
}

export async function aprovar(
  id: number,
  prioridade: Prioridade,
  tecnicoId: number,
): Promise<Chamado> {
  const res = await post(
    `/chamados/${id}/aprovar`,
    { prioridade, tecnicoId },
    respostaChamadoSchema,
  );
  return res.chamado;
}

export async function iniciar(id: number): Promise<Chamado> {
  const res = await post(`/chamados/${id}/iniciar`, undefined, respostaChamadoSchema);
  return res.chamado;
}

export async function concluir(
  id: number,
  solucao: SolucaoInput,
): Promise<Chamado> {
  const res = await post(
    `/chamados/${id}/concluir`,
    solucao,
    respostaChamadoSchema,
  );
  return res.chamado;
}
