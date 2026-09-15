import { describe, expect, it } from 'vitest';
import bcrypt from 'bcrypt';
import { StoreService } from './store.service.js';
import { senhaPadrao } from './seed.js';

describe('StoreService (seed em memória)', () => {
  const store = new StoreService();

  it('carrega os 6 usuários de demonstração com os ids do mock do front', () => {
    const usuarios = store.getUsuariosInternos();
    expect(usuarios).toHaveLength(6);
    expect(usuarios.map((u) => u.id)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(usuarios.map((u) => u.email)).toContain('ricardo@predial.com');
  });

  it('as senhas do seed estão com hash bcrypt válido', () => {
    const ana = store.getUsuarioPorEmail('ana@predial.com');
    expect(ana).toBeDefined();
    expect(ana?.senhaHash).not.toBe(senhaPadrao);
    expect(bcrypt.compareSync(senhaPadrao, ana!.senhaHash)).toBe(true);
  });

  it('o usuário público nunca expõe a senha/hash', () => {
    const publicos = store.getUsuariosPublicos();
    expect(publicos[0]).not.toHaveProperty('senha');
    expect(publicos[0]).not.toHaveProperty('senhaHash');
  });

  it('carrega os 5 chamados com os ids do mock do front', () => {
    const chamados = store.getChamados();
    expect(chamados.map((c) => c.id)).toEqual([1, 2, 3, 4, 5]);
    expect(chamados[0].status).toBe('CONCLUIDO');
    expect(chamados[0].solucao).toMatchObject({
      descricao: expect.stringContaining('Tomada trocada'),
    });
  });

  it('contadores de ID ficam prontos para os próximos registros', () => {
    expect(store.getProximoIdUsuario()).toBe(7);
    expect(store.getProximoIdChamado()).toBe(6);
    expect(store.getProximoIdHistorico()).toBe(12);
  });

  it('busca usuário por e-mail de forma case-insensitive', () => {
    expect(store.getUsuarioPorEmail('CARLOS@PREDIAL.COM')?.id).toBe(2);
    expect(store.getUsuarioPorEmail('nao.existe@predial.com')).toBeUndefined();
  });
});