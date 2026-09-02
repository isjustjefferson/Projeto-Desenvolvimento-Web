import type { Role, Status } from './types';

// Centraliza as regras de acesso por perfil (RBAC).
// Cada perfil enxerga um conjunto de status de chamados.
export const statusVisiveisPorRole: Record<Role, Status[]> = {
  SOLICITANTE: ['AGUARDANDO_APROVACAO', 'EM_ANDAMENTO', 'CONCLUIDO'],
  TECNICO: ['REVISADO', 'EM_ANDAMENTO', 'CONCLUIDO'],
  GESTOR: ['AGUARDANDO_APROVACAO', 'REVISADO', 'EM_ANDAMENTO', 'CONCLUIDO'],
  ADMINISTRADOR: ['AGUARDANDO_APROVACAO', 'REVISADO', 'EM_ANDAMENTO', 'CONCLUIDO'],
};

// Ações que cada perfil pode executar
export const acoesPorRole: Record<Role, string[]> = {
  SOLICITANTE: ['criar', 'visualizar_proprios'],
  TECNICO: ['iniciar', 'concluir', 'visualizar_atribuidos_disponiveis'],
  GESTOR: ['triar', 'aprovar', 'iniciar', 'dashboard'],
  ADMINISTRADOR: ['tudo'],
};

export const pode = (role: Role, acao: string): boolean => {
  if (acoesPorRole[role].includes('tudo')) return true;
  return acoesPorRole[role].includes(acao);
};

// Prioridades que o Gestor pode definir ao aprovar
export const prioridadesParaAprovacao = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'] as const;
