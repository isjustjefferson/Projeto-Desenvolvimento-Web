import type { Prioridade, Status } from '../types';
import {
  prioridadeColor,
  prioridadeLabel,
  statusColor,
  statusLabel,
} from '../helpers';

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[status]}`}
    >
      {statusLabel[status]}
    </span>
  );
}

export function PrioridadeBadge({
  prioridade,
}: {
  prioridade: Prioridade | null;
}) {
  if (!prioridade) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-500 px-2.5 py-0.5 text-xs font-semibold text-white">
        Sem prioridade
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${prioridadeColor[prioridade]}`}
    >
      {prioridadeLabel[prioridade]}
    </span>
  );
}
