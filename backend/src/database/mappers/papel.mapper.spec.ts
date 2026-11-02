import { describe, expect, it } from 'vitest';
import { papelParaRole, roleParaPapel } from './papel.mapper.js';

describe('papel.mapper', () => {
  it('converte o papel do banco para o perfil da API', () => {
    expect(papelParaRole('SOLICITANTE')).toBe('CONDOMINO');
    expect(papelParaRole('TECNICO')).toBe('PRESTADOR');
    expect(papelParaRole('GESTOR')).toBe('SINDICO');
    expect(papelParaRole('ADMINISTRADOR')).toBe('ADMINISTRADOR');
  });

  it('faz o caminho inverso para gravar no banco', () => {
    expect(roleParaPapel('CONDOMINO')).toBe('SOLICITANTE');
    expect(roleParaPapel('PRESTADOR')).toBe('TECNICO');
    expect(roleParaPapel('SINDICO')).toBe('GESTOR');
    expect(roleParaPapel('ADMINISTRADOR')).toBe('ADMINISTRADOR');
  });
});
