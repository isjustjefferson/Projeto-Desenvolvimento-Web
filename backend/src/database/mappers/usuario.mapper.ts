import { UsuarioEntity } from '../entities/usuario.entity.js';
import { bufferToBase64 } from './bytes.mapper.js';
import { papelParaRole } from './papel.mapper.js';

export function mapUsuarioToContrato(u: UsuarioEntity) {
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    role: papelParaRole(u.papel),
    localizacao: u.localizacao ?? undefined,
    unidade: u.unidade ?? undefined,
    setor: u.setor ?? undefined,
    especialidade: u.especialidade ?? undefined,
    ativo: u.ativo,
    foto: bufferToBase64(u.foto),
    criadoEm: u.criadoEm.toISOString(),
  };
}
