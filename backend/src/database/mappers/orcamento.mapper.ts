import { OrcamentoEntity } from '../entities/orcamento.entity.js';

export function mapOrcamentoToContrato(o: OrcamentoEntity) {
  return {
    id: o.id,
    chamadoId: o.chamadoId,
    prestadorId: o.prestadorId,
    descricao: o.descricao,
    valorCentavos: o.valorCentavos,
    status: o.status,
    motivoRejeicao: o.motivoRejeicao ?? undefined,
    aprovadoPorId: o.aprovadoPorId ?? undefined,
    aprovadoEm: o.aprovadoEm ? o.aprovadoEm.toISOString() : undefined,
    criadoEm: o.criadoEm.toISOString(),
    atualizadoEm: o.atualizadoEm.toISOString(),
  };
}
