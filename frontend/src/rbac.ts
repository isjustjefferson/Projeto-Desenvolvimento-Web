import type { Categoria, Chamado, Role, Status, Usuario } from './types';

// Centraliza as regras de acesso por perfil (RBAC).
// Cada perfil enxerga um conjunto de status de chamados.
export const statusVisiveisPorRole: Record<Role, Status[]> = {
  CONDOMINO: ['AGUARDANDO_APROVACAO', 'EM_ANDAMENTO', 'CONCLUIDO'],
  PRESTADOR: ['REVISADO', 'EM_ANDAMENTO', 'CONCLUIDO'],
  SINDICO: ['AGUARDANDO_APROVACAO', 'REVISADO', 'EM_ANDAMENTO', 'CONCLUIDO'],
  ADMINISTRADOR: ['AGUARDANDO_APROVACAO', 'REVISADO', 'EM_ANDAMENTO', 'CONCLUIDO'],
};

// Ações que cada perfil pode executar
export const acoesPorRole: Record<Role, string[]> = {
  CONDOMINO: ['criar', 'visualizar_proprios'],
  PRESTADOR: ['iniciar', 'concluir', 'visualizar_atribuidos_disponiveis'],
  SINDICO: ['criar', 'triar', 'aprovar', 'iniciar', 'dashboard'],
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

// A especialidade do prestador é texto livre ("Elétrica", "Hidráulica"), enquanto
// Chamado.categoria é um enum. Normaliza (sem acento, maiúsculas) para casar.
// Aceita null porque o payload validado usa nullish() nos campos opcionais.
export function especialidadeParaCategoria(
  especialidade?: string | null,
): Categoria | null {
  if (!especialidade) return null;
  const normalizada = especialidade
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
  return CATEGORIAS.find((c) => c === normalizada) ?? null;
}

// Prestador sem especialidade reconhecida só enxerga os chamados atribuídos a ele.
export function prestadorSemEspecialidade(usuario: Usuario): boolean {
  return (
    usuario.role === 'PRESTADOR' &&
    especialidadeParaCategoria(usuario.especialidade) === null
  );
}

// Recorte único de visibilidade por perfil — usado pelo Dashboard e pela lista.
export function chamadosVisiveis(
  chamados: Chamado[],
  usuario: Usuario,
): Chamado[] {
  const statusPermitidos = statusVisiveisPorRole[usuario.role];
  const categoriaDoPrestador =
    usuario.role === 'PRESTADOR'
      ? especialidadeParaCategoria(usuario.especialidade)
      : null;

  return chamados.filter((c) => {
    if (!statusPermitidos.includes(c.status)) return false;

    // Condômino só enxerga os próprios chamados
    if (usuario.role === 'CONDOMINO') {
      return c.criadoPorId === usuario.id;
    }

    // Prestador enxerga os da sua especialidade e os já atribuídos a ele
    if (usuario.role === 'PRESTADOR') {
      const daEspecialidade =
        categoriaDoPrestador !== null && c.categoria === categoriaDoPrestador;
      return daEspecialidade || c.prestadorId === usuario.id;
    }

    // Síndico e Administrador têm visão geral
    return true;
  });
}
