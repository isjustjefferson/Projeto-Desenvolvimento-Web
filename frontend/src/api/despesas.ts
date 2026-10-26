import type { Despesa } from '../types';
import { del, get, patch, post } from './client';
import { respostaDespesaSchema, respostaDespesasSchema } from './schemas';

export interface CriarDespesaInput {
  categoria: Despesa['categoria'];
  descricao: string;
  fornecedor?: string;
  cnpj?: string;
  numeroNota?: string;
  serie?: string;
  dataEmissao?: string;
  valorCentavos: number;
  formaPagamento?: Despesa['formaPagamento'];
  pagoPor?: Despesa['pagoPor'];
  anexos?: Array<{
    tipo: 'NOTA_FISCAL' | 'RECIBO' | 'COMPROVANTE_PAGAMENTO' | 'OUTRO';
    tipoDocumentoFiscal?: 'NFE' | 'NFSE' | 'NFCE' | 'CUPOM_FISCAL' | 'RECIBO' | 'BOLETO_COMPROVANTE' | 'OUTRO';
    chaveNFe?: string;
    numero?: string;
    serie?: string;
    nomeArquivo: string;
    mimeType: string;
    tamanhoBytes: number;
    conteudo: string;
  }>;
}

export interface EditarDespesaInput {
  categoria?: Despesa['categoria'];
  descricao?: string;
  fornecedor?: string;
  cnpj?: string;
  numeroNota?: string;
  serie?: string;
  dataEmissao?: string;
  valorCentavos?: number;
  formaPagamento?: Despesa['formaPagamento'];
  pagoPor?: Despesa['pagoPor'];
}

export interface AnexarDespesaInput {
  tipo: 'NOTA_FISCAL' | 'RECIBO' | 'COMPROVANTE_PAGAMENTO' | 'OUTRO';
  tipoDocumentoFiscal?: 'NFE' | 'NFSE' | 'NFCE' | 'CUPOM_FISCAL' | 'RECIBO' | 'BOLETO_COMPROVANTE' | 'OUTRO';
  chaveNFe?: string;
  numero?: string;
  serie?: string;
  nomeArquivo: string;
  mimeType: string;
  tamanhoBytes: number;
  conteudo: string;
}

export async function listarDespesas(chamadoId: number) {
  return get(`/chamados/${chamadoId}/despesas`, respostaDespesasSchema);
}

export async function criarDespesa(chamadoId: number, input: CriarDespesaInput) {
  const res = await post(`/chamados/${chamadoId}/despesas`, input, respostaDespesaSchema);
  return res.despesa;
}

export async function editarDespesa(chamadoId: number, despesaId: number, input: EditarDespesaInput) {
  const res = await patch(`/chamados/${chamadoId}/despesas/${despesaId}`, input, respostaDespesaSchema);
  return res.despesa;
}

export async function removerDespesa(chamadoId: number, despesaId: number) {
  return del(`/chamados/${chamadoId}/despesas/${despesaId}`, respostaOkSchema);
}

export async function anexarDespesa(chamadoId: number, despesaId: number, input: AnexarDespesaInput) {
  const res = await post(`/chamados/${chamadoId}/despesas/${despesaId}/anexos`, input, respostaDespesaSchema);
  return res.despesa;
}

export async function removerAnexoDespesa(chamadoId: number, despesaId: number, anexoId: number) {
  const res = await del(`/chamados/${chamadoId}/despesas/${despesaId}/anexos/${anexoId}`, respostaDespesaSchema);
  return res.despesa;
}

export async function aprovarDespesa(chamadoId: number, despesaId: number) {
  const res = await post(`/chamados/${chamadoId}/despesas/${despesaId}/aprovar`, undefined, respostaDespesaSchema);
  return res.despesa;
}

export async function rejeitarDespesa(chamadoId: number, despesaId: number, motivo: string) {
  const res = await post(`/chamados/${chamadoId}/despesas/${despesaId}/rejeitar`, { motivo }, respostaDespesaSchema);
  return res.despesa;
}

const respostaOkSchema = {
  parse: (v: unknown) => v as { ok: true },
  safeParse: (v: unknown) => ({ success: true, data: v as { ok: true } }),
} as any;
