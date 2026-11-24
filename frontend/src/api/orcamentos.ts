import { get, post } from './client';
import { respostaOrcamentoSchema, respostaOrcamentosSchema } from './schemas';

export interface CriarOrcamentoInput {
  descricao: string;
  valorCentavos: number;
}

export async function listarOrcamentos(chamadoId: number) {
  return get(`/chamados/${chamadoId}/orcamentos`, respostaOrcamentosSchema);
}

export async function criarOrcamento(chamadoId: number, input: CriarOrcamentoInput) {
  const res = await post(
    `/chamados/${chamadoId}/orcamentos`,
    input,
    respostaOrcamentoSchema,
  );
  return res.orcamento;
}

export async function aprovarOrcamento(chamadoId: number, orcamentoId: number) {
  const res = await post(
    `/chamados/${chamadoId}/orcamentos/${orcamentoId}/aprovar`,
    undefined,
    respostaOrcamentoSchema,
  );
  return res.orcamento;
}

export async function rejeitarOrcamento(
  chamadoId: number,
  orcamentoId: number,
  motivo: string,
) {
  const res = await post(
    `/chamados/${chamadoId}/orcamentos/${orcamentoId}/rejeitar`,
    { motivo },
    respostaOrcamentoSchema,
  );
  return res.orcamento;
}
