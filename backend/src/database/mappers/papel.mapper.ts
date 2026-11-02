import type { Role } from '../../contrato.js';
import type { UsuarioEntity } from '../entities/usuario.entity.js';

type Papel = UsuarioEntity['papel'];

// O enum `papel` do banco ainda usa os nomes antigos dos perfis; a API já usa os
// novos. A conversão fica só aqui até o DBA migrar o enum.
const ROLE_POR_PAPEL: Record<Papel, Role> = {
  SOLICITANTE: 'CONDOMINO',
  TECNICO: 'PRESTADOR',
  GESTOR: 'SINDICO',
  ADMINISTRADOR: 'ADMINISTRADOR',
};

const PAPEL_POR_ROLE = Object.fromEntries(
  Object.entries(ROLE_POR_PAPEL).map(([papel, role]) => [role, papel]),
) as Record<Role, Papel>;

export function papelParaRole(papel: Papel): Role {
  return ROLE_POR_PAPEL[papel];
}

export function roleParaPapel(role: Role): Papel {
  return PAPEL_POR_ROLE[role];
}
