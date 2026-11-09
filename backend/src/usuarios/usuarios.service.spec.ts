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
    const repo = { find: async () => [], findOne: async () => null } as any;
    service = new UsuariosService(store, repo);
  });

  it('lista usuarios publicos sem senha/hash', async () => {
    const res = await service.listar();
    expect(res.usuarios).toHaveLength(6);
    expect(res.usuarios[0]).not.toHaveProperty('senha');
    expect(res.usuarios[0]).not.toHaveProperty('senhaHash');
  });

  it('cria TECNICO com especialidade e senha padrao', async () => {
    const res = await service.criar({
      nome: 'Fabio Manutencao',
      email: 'fabio@predial.com',
      role: 'TECNICO',
      especialidade: 'Climatizacao',
    });
    expect(res.usuario).toMatchObject({
      id: 7,
      role: 'TECNICO',
      especialidade: 'Climatizacao',
      ativo: true,
    });
    const interno = store.getUsuarioInternoPorId(7);
    expect(bcrypt.compareSync(senhaPadrao, interno!.senhaHash)).toBe(true);
  });

  it('cria SOLICITANTE por padrao e guarda setor', async () => {
    const res = await service.criar({
      nome: 'Denise',
      email: 'denise@predial.com',
      setor: 'Administracao',
    });
    expect(res.usuario.role).toBe('SOLICITANTE');
    expect(res.usuario.especialidade).toBeUndefined();
    expect(res.usuario.setor).toBe('Administracao');
  });

  it('rejeita e-mail duplicado (case-insensitive)', async () => {
    await expect(service.criar({ nome: 'X', email: 'ANA@PREDIAL.COM' })).rejects.toThrow(
      'Este e-mail já está cadastrado.',
    );
  });

  it('promove e rebaixa um usuario', async () => {
    const promovido = await service.alterarRole(1, { role: 'GESTOR' }, 6);
    expect(promovido.usuario.role).toBe('GESTOR');
    const rebaixado = await service.alterarRole(1, { role: 'SOLICITANTE' }, 6);
    expect(rebaixado.usuario.role).toBe('SOLICITANTE');
  });

  it('bloqueia alterar cargo de usuario inexistente', async () => {
    await expect(service.alterarRole(999, { role: 'GESTOR' }, 6)).rejects.toThrow(
      'Usuário não encontrado.',
    );
  });

  it('bloqueia acao sobre a propria conta', async () => {
    await expect(service.alterarRole(6, { role: 'GESTOR' }, 6)).rejects.toThrow(
      'Você não pode realizar esta ação na própria conta.',
    );
  });

  it('bloqueia rebaixar/excluir o ultimo administrador', async () => {
    await expect(service.alterarRole(6, { role: 'GESTOR' }, 5)).rejects.toThrow(
      'Não é possível remover o último administrador.',
    );
    await expect(service.excluir(6, 5)).rejects.toThrow(
      'Não é possível excluir o último administrador.',
    );
  });

  it('permite rebaixar um administrador quando ha outro', async () => {
    await service.criar({
      nome: 'Segundo Admin',
      email: 'admin2@predial.com',
      role: 'ADMINISTRADOR',
    });
    const res = await service.alterarRole(6, { role: 'GESTOR' }, 7);
    expect(res.usuario.role).toBe('GESTOR');
  });

  it('exclui usuario e impede auto-exclusao', async () => {
    await expect(service.excluir(6, 6)).rejects.toThrow(
      'Você não pode realizar esta ação na própria conta.',
    );
    const res = await service.excluir(2, 6);
    expect(res.ok).toBe(true);
    expect(store.getUsuarioInternoPorId(2)).toBeUndefined();
  });
});
