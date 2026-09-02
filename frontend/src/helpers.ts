import type { Categoria, Prioridade, Role, Status } from './types';

export const statusLabel: Record<Status, string> = {
  AGUARDANDO_APROVACAO: 'Aguardando Aprovação',
  REVISADO: 'Revisado',
  EM_ANDAMENTO: 'Em Andamento',
  CONCLUIDO: 'Concluído',
};

export const statusColor: Record<Status, string> = {
  AGUARDANDO_APROVACAO: 'bg-amber-500 text-white',
  REVISADO: 'bg-blue-500 text-white',
  EM_ANDAMENTO: 'bg-indigo-500 text-white',
  CONCLUIDO: 'bg-emerald-500 text-white',
};

export const prioridadeLabel: Record<Prioridade, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
};

export const prioridadeColor: Record<Prioridade, string> = {
  BAIXA: 'bg-emerald-500 text-white',
  MEDIA: 'bg-yellow-500 text-yellow-950',
  ALTA: 'bg-orange-500 text-white',
  CRITICA: 'bg-red-500 text-white',
};

export const roleLabel: Record<Role, string> = {
  SOLICITANTE: 'Solicitante',
  TECNICO: 'Técnico',
  GESTOR: 'Gestor',
  ADMINISTRADOR: 'Administrador',
};

export const roleColor: Record<Role, string> = {
  SOLICITANTE: 'bg-gray-500 text-white',
  TECNICO: 'bg-blue-500 text-white',
  GESTOR: 'bg-amber-500 text-white',
  ADMINISTRADOR: 'bg-purple-500 text-white',
};

export const categoriaLabel: Record<Categoria, string> = {
  ELETRICA: 'Elétrica',
  HIDRAULICA: 'Hidráulica',
  CLIMATIZACAO: 'Climatização',
  MOBILIARIO: 'Mobiliário',
  ESTRUTURAL: 'Estrutural',
  OUTROS: 'Outros',
};

export function formatarData(iso?: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${min} min atrás`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `${horas} h atrás`;
  const dias = Math.floor(horas / 24);
  return `${dias} dia${dias > 1 ? 's' : ''} atrás`;
}

export function iniciais(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const AVATAR_CORES = [
  'bg-brand-600',
  'bg-blue-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-purple-600',
  'bg-rose-600',
];

export function avatarCor(nome: string): string {
  const soma = nome
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_CORES[soma % AVATAR_CORES.length];
}
