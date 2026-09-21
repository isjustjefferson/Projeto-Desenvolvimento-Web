import type { Chamado, Prioridade } from '../types';
import { get, post } from './client';

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

interface RespostaChamados {
  ok: true;
  chamados: Chamado[];
}

interface RespostaChamado {
  ok: true;
  chamado: Chamado;
}

export async function listar(): Promise<Chamado[]> {
  const res = await get<RespostaChamados>('/chamados');
  return res.chamados;
}

export async function obter(id: number): Promise<Chamado> {
  const res = await get<RespostaChamado>(`/chamados/${id}`);
  return res.chamado;
}

export async function criar(input: NovoChamadoInput): Promise<Chamado> {
  const res = await post<RespostaChamado>('/chamados', input);
  return res.chamado;
}

export async function aprovar(
  id: number,
  prioridade: Prioridade,
  tecnicoId: number,
): Promise<Chamado> {
  const res = await post<RespostaChamado>(`/chamados/${id}/aprovar`, {
    prioridade,
    tecnicoId,
  });
  return res.chamado;
}

export async function iniciar(id: number): Promise<Chamado> {
  const res = await post<RespostaChamado>(`/chamados/${id}/iniciar`);
  return res.chamado;
}

export async function concluir(
  id: number,
  solucao: SolucaoInput,
): Promise<Chamado> {
  const res = await post<RespostaChamado>(`/chamados/${id}/concluir`, solucao);
  return res.chamado;
}
