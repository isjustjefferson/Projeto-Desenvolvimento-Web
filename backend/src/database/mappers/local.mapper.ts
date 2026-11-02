import { LocalEntity } from '../entities/local.entity.js';

export function mapLocalToContrato(local: LocalEntity | null | undefined) {
  if (!local) return undefined;
  return {
    predio: local.predio,
    andar: local.andar ?? undefined,
    sala: local.sala ?? undefined,
  };
}
