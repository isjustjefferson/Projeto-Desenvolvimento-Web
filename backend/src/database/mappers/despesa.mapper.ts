import { AnexoDespesaEntity } from '../entities/anexo-despesa.entity.js';
import { DespesaEntity } from '../entities/despesa.entity.js';

export function mapAnexoDespesaToContrato(a: AnexoDespesaEntity, incluirConteudo = true) {
  const base: any = {
    id: a.id,
    despesaId: a.despesaId,
    tipo: a.tipo,
    tipoDocumentoFiscal: a.tipoDocumentoFiscal ?? undefined,
    chaveNFe: a.chaveNfe ?? undefined,
    numero: a.numero ?? undefined,
    serie: a.serie ?? undefined,
    nomeArquivo: a.nomeArquivo,
    mimeType: a.mimeType,
    tamanhoBytes: a.tamanhoBytes,
    hashSha256: a.hashSha256 ?? undefined,
    enviadoPorId: a.enviadoPorId,
    criadoEm: a.criadoEm.toISOString(),
  };
  if (incluirConteudo && a.conteudo) {
    base.conteudo = a.conteudo.toString('base64');
  }
  return base;
}

export function mapDespesaToContrato(d: DespesaEntity, incluirConteudoAnexos = true) {
  return {
    id: d.id,
    chamadoId: d.chamadoId,
    registradoPorId: d.registradoPorId,
    categoria: d.categoria,
    descricao: d.descricao,
    fornecedor: d.fornecedor ?? undefined,
    cnpj: d.cnpj ?? undefined,
    numeroNota: d.numeroNota ?? undefined,
    serie: d.serie ?? undefined,
    dataEmissao: d.dataEmissao ?? undefined,
    valorCentavos: d.valorCentavos,
    formaPagamento: d.formaPagamento ?? undefined,
    pagoPor: d.pagoPor ?? undefined,
    status: d.status,
    motivoRejeicao: d.motivoRejeicao ?? undefined,
    aprovadoPorId: d.aprovadoPorId ?? undefined,
    aprovadoEm: d.aprovadoEm ? d.aprovadoEm.toISOString() : undefined,
    criadoEm: d.criadoEm.toISOString(),
    atualizadoEm: d.atualizadoEm.toISOString(),
    anexos: (d as any).anexos ? (d as any).anexos.map((a: any) => mapAnexoDespesaToContrato(a, incluirConteudoAnexos)) : [],
  };
}
