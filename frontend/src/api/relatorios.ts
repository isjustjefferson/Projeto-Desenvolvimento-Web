import type { Despesa } from '../types';
import { get } from './client';

export interface FiltrosRelatorioDespesas {
  de?: string;
  ate?: string;
  status?: string;
  categoria?: string;
  registradoPorId?: string;
  temDocumento?: string;
}

export interface DespesaRelatorio extends Despesa {
  chamadoTitulo?: string;
  chamadoNumero?: number;
}

export interface ResumoRelatorioDespesas {
  totalCentavos: number;
  aprovadoCentavos: number;
  pendenteCentavos: number;
  rejeitadoCentavos: number;
  quantidade: number;
  aprovadas: number;
  comDocumento: number;
  pctComDocumento: number;
}

export interface RelatorioDespesas {
  ok: boolean;
  resumo: ResumoRelatorioDespesas;
  porCategoria: Record<string, number>;
  porTecnico: Record<string, number>;
  porFornecedor: Record<string, number>;
  despesas: DespesaRelatorio[];
}

export async function relatorioDespesas(
  filtros: FiltrosRelatorioDespesas = {},
): Promise<RelatorioDespesas> {
  const sp = new URLSearchParams();
  if (filtros.de) sp.append('de', filtros.de);
  if (filtros.ate) sp.append('ate', filtros.ate);
  if (filtros.status) sp.append('status', filtros.status);
  if (filtros.categoria) sp.append('categoria', filtros.categoria);
  if (filtros.registradoPorId) sp.append('registradoPorId', filtros.registradoPorId);
  if (filtros.temDocumento) sp.append('temDocumento', filtros.temDocumento);
  const qs = sp.toString();
  return get<RelatorioDespesas>(qs ? `/relatorios/despesas?${qs}` : '/relatorios/despesas');
}
