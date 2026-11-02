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
  sugestao,
}: {
  prioridade: Prioridade | null;
  sugestao?: Prioridade | null;
}) {
  const exibir = prioridade ?? sugestao;
  if (!exibir) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-500 px-2.5 py-0.5 text-xs font-semibold text-white">
        Sem prioridade
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${prioridadeColor[exibir]} ${
        !prioridade && sugestao ? 'opacity-90' : ''
      }`}
    >
      {prioridadeLabel[exibir]}
    </span>
  );
}
