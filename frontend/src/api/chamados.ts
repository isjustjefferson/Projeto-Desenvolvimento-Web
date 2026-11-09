import type {
  Chamado,
  PaginaChamados,
  Prioridade,
  ResumoChamados,
} from '../types';
import { get, post } from './client';
import {
  respostaChamadoSchema,
  respostaChamadosSchema,
  respostaResumoChamadosSchema,
} from './schemas';

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

export interface FiltrosChamados {
  status?: Chamado['status'];
  prioridade?: Prioridade;
  categoria?: Chamado['categoria'];
  prestadorId?: number;
  predio?: string;
  q?: string;
  de?: string;
  ate?: string;
  criadoPorId?: number;
  aba?: 'disponiveis' | 'meus';
  pagina?: number;
  limite?: number;
  ordem?: 'asc' | 'desc';
}

function montarQuery(filtros: FiltrosChamados): string {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor === undefined || valor === null || valor === '') continue;
    params.set(chave, String(valor));
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function listar(
  filtros: FiltrosChamados = {},
): Promise<PaginaChamados> {
  const res = await get(
    `/chamados${montarQuery(filtros)}`,
    respostaChamadosSchema,
  );
  return { chamados: res.chamados, paginacao: res.paginacao };
}

export async function resumo(): Promise<ResumoChamados> {
  const res = await get('/chamados/resumo', respostaResumoChamadosSchema);
  return res.resumo;
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
  prestadorId: number,
): Promise<Chamado> {
  const res = await post(
    `/chamados/${id}/aprovar`,
    { prioridade, prestadorId },
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
