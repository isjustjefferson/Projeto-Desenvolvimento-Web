import { Injectable } from '@nestjs/common';
import { despesaSemConteudo } from '../common/anexos.js';
import type { Despesa } from '../contrato.js';
import { StoreService } from '../dados/store.service.js';
import type { UsuarioInterno } from '../dados/seed.js';

function inicioDoDia(valor?: string): number | undefined {
  if (!valor) return undefined;
  const [ano, mes, dia] = valor.split('-').map(Number);
  if (!ano || !mes || !dia) return undefined;
  const data = new Date(ano, mes - 1, dia, 0, 0, 0, 0);
  return Number.isNaN(data.getTime()) ? undefined : data.getTime();
}

function fimDoDia(valor?: string): number | undefined {
  if (!valor) return undefined;
  const [ano, mes, dia] = valor.split('-').map(Number);
  if (!ano || !mes || !dia) return undefined;
  const data = new Date(ano, mes - 1, dia, 23, 59, 59, 999);
  return Number.isNaN(data.getTime()) ? undefined : data.getTime();
}

@Injectable()
export class RelatoriosService {
  constructor(private readonly store: StoreService) {}

  despesas(usuario: UsuarioInterno, filtros: any) {
    const despesasMap = (this.store as any).despesas as Map<number, Despesa> | undefined;
    let despesas: Despesa[] = despesasMap ? [...despesasMap.values()] : [];

    if (filtros?.status) {
      despesas = despesas.filter((d) => d.status === filtros.status);
    }
    if (filtros?.categoria) {
      despesas = despesas.filter((d) => d.categoria === filtros.categoria);
    }
    if (filtros?.registradoPorId) {
      const id = Number(filtros.registradoPorId);
      if (!Number.isNaN(id)) despesas = despesas.filter((d) => d.registradoPorId === id);
    }
    const inicio = inicioDoDia(filtros?.de);
    if (inicio !== undefined) {
      despesas = despesas.filter((d) => new Date(d.criadoEm).getTime() >= inicio);
    }
    const fim = fimDoDia(filtros?.ate);
    if (fim !== undefined) {
      despesas = despesas.filter((d) => new Date(d.criadoEm).getTime() <= fim);
    }
    if (filtros?.temDocumento === 'sim') {
      despesas = despesas.filter((d) => d.anexos.some((a) => !!a.tipoDocumentoFiscal));
    }
    if (filtros?.temDocumento === 'nao') {
      despesas = despesas.filter((d) => !d.anexos.some((a) => !!a.tipoDocumentoFiscal));
    }
    if (filtros?.somenteComprovado) {
      despesas = despesas.filter((d) => d.anexos.length > 0);
    }

    let totalCentavos = 0;
    let aprovadoCentavos = 0;
    let pendenteCentavos = 0;
    let rejeitadoCentavos = 0;
    let comDocumento = 0;
    const porCategoria: Record<string, number> = {};
    const porRegistrante: Record<string, number> = {};
    const porFornecedor: Record<string, number> = {};

    for (const d of despesas) {
      totalCentavos += d.valorCentavos;
      if (d.status === 'APROVADA') aprovadoCentavos += d.valorCentavos;
      if (d.status === 'PENDENTE') pendenteCentavos += d.valorCentavos;
      if (d.status === 'REJEITADA') rejeitadoCentavos += d.valorCentavos;
      if (d.anexos.some((a) => !!a.tipoDocumentoFiscal)) comDocumento += 1;
      porCategoria[d.categoria] = (porCategoria[d.categoria] || 0) + d.valorCentavos;
      const chaveRegistrante = String(d.registradoPorId);
      porRegistrante[chaveRegistrante] =
        (porRegistrante[chaveRegistrante] || 0) + d.valorCentavos;
      if (d.fornecedor) {
        porFornecedor[d.fornecedor] = (porFornecedor[d.fornecedor] || 0) + d.valorCentavos;
      }
    }

    const aprovadas = despesas.filter((d) => d.status === 'APROVADA').length;
    const pctComDocumento = aprovadas > 0 ? Math.round((comDocumento / aprovadas) * 100) : 0;

    const itens = despesas
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
      .map((d) => {
        const chamado = this.store.getChamadoPorId(d.chamadoId);
        return {
          ...despesaSemConteudo(d),
          chamadoTitulo: chamado?.titulo,
          chamadoNumero: chamado?.id,
        };
      });

    return {
      ok: true,
      resumo: {
        totalCentavos,
        aprovadoCentavos,
        pendenteCentavos,
        rejeitadoCentavos,
        quantidade: despesas.length,
        aprovadas,
        comDocumento,
        pctComDocumento,
      },
      porCategoria,
      porRegistrante,
      porFornecedor,
      despesas: itens,
    };
  }
}
