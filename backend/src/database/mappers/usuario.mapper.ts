import type { UsuarioPublico } from '../../contrato.js';
import type { UsuarioInterno } from '../../dados/seed.js';
import { UsuarioEntity } from '../entities/usuario.entity.js';
import { bufferToBase64 } from './bytes.mapper.js';

export function mapUsuarioToContrato(u: UsuarioEntity): UsuarioPublico {
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    role: u.papel,
    localizacao: u.localizacao ?? undefined,
    unidade: u.unidade ?? undefined,
    setor: u.setor ?? undefined,
    especialidade: u.especialidade ?? undefined,
    ativo: u.ativo,
    foto: bufferToBase64(u.foto),
    criadoEm: u.criadoEm.toISOString(),
  };
}

export function mapUsuarioToInterno(u: UsuarioEntity): UsuarioInterno {
  return {
    ...mapUsuarioToContrato(u),
    senhaHash: u.senhaHash,
  };
}
