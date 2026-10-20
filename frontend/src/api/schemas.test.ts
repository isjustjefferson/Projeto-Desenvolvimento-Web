import { describe, expect, it } from 'vitest';
import meFixture from './__fixtures__/me.json';
import chamadosFixture from './__fixtures__/chamados.json';
import resumoFixture from './__fixtures__/resumo.json';
import usuariosFixture from './__fixtures__/usuarios.json';
import {
  chamadoSchema,
  respostaChamadoSchema,
  respostaChamadosSchema,
  respostaResumoSchema,
  respostaUsuarioSchema,
  respostaUsuariosSchema,
  usuarioResumoSchema,
} from './schemas';

// As fixtures são payloads reais capturados da API em execução (seed), não
// inventados. Se o backend mudar de forma incompatível, ajuste as fixtures de
// propósito junto com o schema — nunca "consertando" o teste às cegas.
const chamadoReal = chamadosFixture.chamados[0];

describe('schemas aceitam os payloads reais da api', () => {
  it('valida GET /me', () => {
    expect(respostaUsuarioSchema.safeParse(meFixture).success).toBe(true);
  });

  it('valida GET /chamados', () => {
    expect(respostaChamadosSchema.safeParse(chamadosFixture).success).toBe(
      true,
    );
  });

  it('valida GET /usuarios', () => {
    expect(respostaUsuariosSchema.safeParse(usuariosFixture).success).toBe(
      true,
    );
  });

  it('valida GET /usuarios/resumo', () => {
    expect(respostaResumoSchema.safeParse(resumoFixture).success).toBe(true);
  });

  it('valida um único chamado (usado em /chamados/:id e nas mutations)', () => {
    expect(respostaChamadoSchema.safeParse({ ok: true, chamado: chamadoReal }).success).toBe(
      true,
    );
  });
});

describe('schemas aceitam os casos de borda do contrato', () => {
  it('aceita prioridade null (chamado recém-criado aguardando aprovação)', () => {
    const novo = { ...chamadoReal, prioridade: null, tecnicoId: null };
    expect(chamadoSchema.safeParse(novo).success).toBe(true);
  });

  it('aceita foto e solucao null', () => {
    const semAnexo = { ...chamadoReal, foto: null, solucao: null };
    expect(chamadoSchema.safeParse(semAnexo).success).toBe(true);
  });

  it('aceita local sem andar e sem sala', () => {
    const semSala = { ...chamadoReal, local: { predio: 'Bloco B' } };
    expect(chamadoSchema.safeParse(semSala).success).toBe(true);
  });

  it('aceita histórico com de null e sem observacao', () => {
    const item = chamadoReal.historico[0];
    expect(chamadoSchema.safeParse({ ...chamadoReal, historico: [item] }).success).toBe(
      true,
    );
  });

  it('aceita usuário sem unidade, especialidade e setor', () => {
    const basico = { id: 9, nome: 'Nova', email: 'nova@predial.com', role: 'GESTOR', ativo: true };
    expect(usuarioResumoSchema.safeParse({ id: 9, nome: 'Nova', role: 'GESTOR' }).success).toBe(
      true,
    );
    expect(respostaUsuarioSchema.safeParse({ ok: true, usuario: basico }).success).toBe(true);
  });
});

describe('schemas derrubam drift de contrato', () => {
  it('rejeita status fora do enum', () => {
    const fora = {
      ...chamadosFixture,
      chamados: [{ ...chamadoReal, status: 'EM_ESPERA' }],
    };
    expect(respostaChamadosSchema.safeParse(fora).success).toBe(false);
  });

  it('rejeita prioridade fora do enum', () => {
    expect(chamadoSchema.safeParse({ ...chamadoReal, prioridade: 'URGENTE' }).success).toBe(
      false,
    );
  });

  it('rejeita envelope sem ok true', () => {
    expect(respostaChamadoSchema.safeParse({ chamado: chamadoReal }).success).toBe(false);
    expect(
      respostaChamadoSchema.safeParse({ ok: false, chamado: chamadoReal }).success,
    ).toBe(false);
  });

  it('rejeita campo obrigatório ausente', () => {
    const semTitulo = { ...chamadoReal };
    delete (semTitulo as Record<string, unknown>).titulo;
    expect(chamadoSchema.safeParse(semTitulo).success).toBe(false);
  });

  it('rejeita campo com tipo errado', () => {
    expect(chamadoSchema.safeParse({ ...chamadoReal, id: 'um' }).success).toBe(false);
    expect(
      respostaUsuariosSchema.safeParse({
        ok: true,
        usuarios: [{ ...usuariosFixture.usuarios[0], ativo: 'sim' }],
      }).success,
    ).toBe(false);
  });

  it('rejeita role desconhecida no resumo de usuários', () => {
    const fora = {
      ...resumoFixture,
      usuarios: [{ id: 9, nome: 'Ghost', role: 'SUPERVISOR' }],
    };
    expect(respostaResumoSchema.safeParse(fora).success).toBe(false);
  });
});
