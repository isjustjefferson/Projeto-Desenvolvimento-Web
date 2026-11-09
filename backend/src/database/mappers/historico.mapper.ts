import { HistoricoEntity } from '../entities/historico.entity.js';

export function mapHistoricoToContrato(h: HistoricoEntity) {
  return {
    id: h.id,
    usuarioId: h.usuarioId ?? h.usuario?.id,
    de: h.deStatus ?? undefined,
    para: h.paraStatus,
    dataHora: h.dataHora.toISOString(),
    observacao: h.observacao ?? undefined,
    usuario: h.usuario
      ? {
          id: h.usuario.id,
          nome: h.usuario.nome,
        }
      : undefined,
  };
}
