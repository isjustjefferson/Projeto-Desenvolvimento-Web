import { Link } from 'react-router-dom';
import { categoriaLabel, tempoRelativo } from '../helpers';
import type { Chamado } from '../types';
import { PrioridadeBadge, StatusBadge } from './Badge';

interface Props {
  chamado: Chamado;
  nomeUsuario: (id: number) => string;
}

function textoLocal({ predio, andar, sala }: Chamado['local']): string {
  return [predio, andar, sala].filter(Boolean).join(' · ');
}

// Visão detalhada: um card por chamado, com descrição e envolvidos.
export function ChamadoCard({ chamado: c, nomeUsuario }: Props) {
  return (
    <Link
      to={`/chamados/${c.id}`}
      className="card block transition hover:border-brand-300 hover:shadow"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-gray-400">#{c.id}</span>
        <h3 className="font-semibold text-gray-900">{c.titulo}</h3>
        <StatusBadge status={c.status} />
        <PrioridadeBadge
          prioridade={c.prioridade}
          sugestao={c.classificacao?.prioridadeSugerida}
        />
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-gray-500">{c.descricao}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
        <span>{categoriaLabel[c.categoria]}</span>
        <span>{textoLocal(c.local)}</span>
        <span>{tempoRelativo(c.criadoEm)}</span>
        <span>Condômino: {nomeUsuario(c.criadoPorId)}</span>
        {c.prestadorId && <span>Prestador: {nomeUsuario(c.prestadorId)}</span>}
      </div>
    </Link>
  );
}

// Visão compacta: uma linha por chamado. No celular o título ocupa a linha
// inteira e os selos descem; categoria, local e data aparecem conforme cabem.
export function ChamadoLinha({ chamado: c }: Pick<Props, 'chamado'>) {
  return (
    <Link
      to={`/chamados/${c.id}`}
      className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5 text-sm transition hover:bg-gray-50 sm:flex-nowrap"
    >
      <span className="w-10 shrink-0 text-xs font-bold text-gray-400">
        #{c.id}
      </span>
      <span className="min-w-0 flex-1 basis-40 truncate font-medium text-gray-900">
        {c.titulo}
      </span>
      <span className="hidden w-28 shrink-0 truncate text-xs text-gray-500 md:block">
        {categoriaLabel[c.categoria]}
      </span>
      <span className="hidden w-36 shrink-0 truncate text-xs text-gray-500 lg:block">
        {textoLocal(c.local)}
      </span>
      <span className="hidden w-24 shrink-0 text-xs text-gray-500 sm:block">
        {tempoRelativo(c.criadoEm)}
      </span>
      <span className="flex shrink-0 gap-1">
        <StatusBadge status={c.status} />
        <PrioridadeBadge
          prioridade={c.prioridade}
          sugestao={c.classificacao?.prioridadeSugerida}
        />
      </span>
    </Link>
  );
}
