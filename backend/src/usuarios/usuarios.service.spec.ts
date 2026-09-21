import { beforeEach, describe, expect, it } from 'vitest';
import bcrypt from 'bcrypt';
import { StoreService } from '../dados/store.service.js';
import { senhaPadrao } from '../dados/seed.js';
import { UsuariosService } from './usuarios.service.js';

describe('UsuariosService', () => {
  let store: StoreService;
  let service: UsuariosService;

  beforeEach(() => {
    store = new StoreService();
    service = new UsuariosService(store);
  });

  it('lista usuários públicos sem senha/hash', () => {
    const res = service.listar();
    expect(res.usuarios).toHaveLength(6);
    expect(res.usuarios[0]).not.toHaveProperty('senha');
    expect(res.usuarios[0]).not.toHaveProperty('senhaHash');
  });

  it('cria usuário TECNICO com especialidade e senha padrão', () => {
    const res = service.criar({
      nome: 'Fábio Manutenção',
      email: 'fabio@predial.com',
      role: 'TECNICO',
      especialidade: 'Climatização',
    });
    expect(res.usuario).toMatchObject({
      id: 7,
      role: 'TECNICO',
      especialidade: 'Climatização',
      ativo: true,
    });
    const interno = store.getUsuarioInternoPorId(7);
    expect(bcrypt.compareSync(senhaPadrao, interno!.senhaHash)).toBe(true);
  });

  it('cria usuário SOLICITANTE por padrão e guarda setor', () => {
    const res = service.criar({
      nome: 'Denise',
      email: 'denise@predial.com',
      setor: 'Administração',
    });
    expect(res.usuario.role).toBe('SOLICITANTE');
    expect(res.usuario.especialidade).toBeUndefined();
    expect(res.usuario.setor).toBe('Administração');
  });

  it('rejeita e-mail duplicado (case-insensitive)', () => {
    expect(() => service.criar({ nome: 'X', email: 'ANA@PREDIAL.COM' })).toThrow(
      'Este e-mail já está cadastrado.',
    );
  });

  it('promove e rebaixa um usuário', () => {
    const promovido = service.alterarRole(1, { role: 'GESTOR' }, 6);
    expect(promovido.usuario.role).toBe('GESTOR');
    const rebaixado = service.alterarRole(1, { role: 'SOLICITANTE' }, 6);
    expect(rebaixado.usuario.role).toBe('SOLICITANTE');
  });

  it('bloqueia alterar cargo de usuário inexistente', () => {
    expect(() => service.alterarRole(999, { role: 'GESTOR' }, 6)).toThrow(
      'Usuário não encontrado.',
    );
  });

  it('bloqueia ação sobre a própria conta', () => {
    expect(() => service.alterarRole(6, { role: 'GESTOR' }, 6)).toThrow(
      'Você não pode realizar esta ação na própria conta.',
    );
  });

  it('bloqueia rebaixar/excluir o último administrador', () => {
    expect(() => service.alterarRole(6, { role: 'GESTOR' }, 5)).toThrow(
      'Não é possível remover o último administrador.',
    );
    expect(() => service.excluir(6, 5)).toThrow(
      'Não é possível excluir o último administrador.',
    );
  });

  it('permite rebaixar um administrador quando há outro', () => {
    service.criar({
      nome: 'Segundo Admin',
      email: 'admin2@predial.com',
      role: 'ADMINISTRADOR',
    });
    const res = service.alterarRole(6, { role: 'GESTOR' }, 7);
    expect(res.usuario.role).toBe('GESTOR');
  });

  it('exclui usuário e impede auto-exclusão', () => {
    expect(() => service.excluir(6, 6)).toThrow(
      'Você não pode realizar esta ação na própria conta.',
    );
    const res = service.excluir(2, 6);
    expect(res.ok).toBe(true);
    expect(store.getUsuarioInternoPorId(2)).toBeUndefined();
  });
});