import type { Categoria, Chamado, Role, Status, Usuario } from './types';

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

const CATEGORIAS: Categoria[] = [
  'ELETRICA',
  'HIDRAULICA',
  'CLIMATIZACAO',
  'MOBILIARIO',
  'ESTRUTURAL',
  'OUTROS',
];

// A especialidade do técnico é texto livre ("Elétrica", "Hidráulica"), enquanto
// Chamado.categoria é um enum. Normaliza (sem acento, maiúsculas) para casar.
export function especialidadeParaCategoria(
  especialidade?: string,
): Categoria | null {
  if (!especialidade) return null;
  const normalizada = especialidade
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
  return CATEGORIAS.find((c) => c === normalizada) ?? null;
}

// Técnico sem especialidade reconhecida só enxerga os chamados atribuídos a ele.
export function tecnicoSemEspecialidade(usuario: Usuario): boolean {
  return (
    usuario.role === 'TECNICO' &&
    especialidadeParaCategoria(usuario.especialidade) === null
  );
}

// Recorte único de visibilidade por perfil — usado pelo Dashboard e pela lista.
export function chamadosVisiveis(
  chamados: Chamado[],
  usuario: Usuario,
): Chamado[] {
  const statusPermitidos = statusVisiveisPorRole[usuario.role];
  const categoriaDoTecnico =
    usuario.role === 'TECNICO'
      ? especialidadeParaCategoria(usuario.especialidade)
      : null;

  return chamados.filter((c) => {
    if (!statusPermitidos.includes(c.status)) return false;

    // Solicitante só enxerga os próprios chamados
    if (usuario.role === 'SOLICITANTE') {
      return c.criadoPorId === usuario.id;
    }

    // Técnico enxerga os da sua especialidade e os já atribuídos a ele
    if (usuario.role === 'TECNICO') {
      const daEspecialidade =
        categoriaDoTecnico !== null && c.categoria === categoriaDoTecnico;
      return daEspecialidade || c.tecnicoId === usuario.id;
    }

    // Gestor e Administrador têm visão geral
    return true;
  });
}
