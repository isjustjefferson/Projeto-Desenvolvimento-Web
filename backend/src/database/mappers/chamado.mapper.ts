import { ChamadoEntity } from '../entities/chamado.entity.js';
import { bufferToBase64 } from './bytes.mapper.js';
import { mapHistoricoToContrato } from './historico.mapper.js';
import { mapLocalToContrato } from './local.mapper.js';
import { mapUsuarioToContrato } from './usuario.mapper.js';

export function mapChamadoToContrato(c: ChamadoEntity) {
  const historicos = (c.historicos ?? []) as any[];
  const historico = historicos
    .slice()
    .sort((a: any, b: any) => {
      const da = a.dataHora instanceof Date ? a.dataHora.getTime() : new Date(a.dataHora).getTime();
      const db = b.dataHora instanceof Date ? b.dataHora.getTime() : new Date(b.dataHora).getTime();
      if (db !== da) return db - da;
      return (b.id ?? 0) - (a.id ?? 0);
    })
    .map((h: any) => mapHistoricoToContrato(h));

  return {
    id: c.id,
    titulo: c.titulo,
    descricao: c.descricao,
    categoria: c.categoria,
    status: c.status,
    prioridade: c.prioridade ?? undefined,
    local: mapLocalToContrato(c.local) as any,
    criadoPor: mapUsuarioToContrato(c.criadoPor),
    // A coluna/relação no banco ainda se chama tecnico; na API, prestador
    prestadorId: c.tecnicoId ?? null,
    prestador: c.tecnico ? mapUsuarioToContrato(c.tecnico) : undefined,
    foto: bufferToBase64(c.foto),
    classificacao: c.classificacao ?? undefined,
    solucao: c.solucaoDescricao
      ? {
          descricao: c.solucaoDescricao,
          materiais: c.solucaoMateriais ?? undefined,
        }
      : undefined,
    historico,
    criadoEm: c.criadoEm.toISOString(),
    atualizadoEm: c.atualizadoEm.toISOString(),
  };
}
