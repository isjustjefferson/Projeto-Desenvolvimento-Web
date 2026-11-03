import { describe, expect, it } from 'vitest';
import { classificarChamado } from './criticidade.js';

describe('classificarChamado', () => {
  it('classifica incêndio como CRITICA', () => {
    const resultado = classificarChamado({
      titulo: 'Fumaça no corredor',
      descricao: 'Cheiro de queimado e fumaça saindo do quadro',
      categoria: 'ELETRICA',
      local: { predio: 'Bloco A', andar: 'Térreo', sala: 'Hall' },
    });

    expect(resultado.prioridadeSugerida).toBe('CRITICA');
  });

  it('classifica torneira pingando como BAIXA', () => {
    const resultado = classificarChamado({
      titulo: 'Torneira pingando',
      descricao: 'Pia da cozinha',
      categoria: 'HIDRAULICA',
      local: { predio: 'Bloco A', andar: '2º andar', sala: '204' },
    });

    expect(resultado.prioridadeSugerida).toBe('BAIXA');
  });

  it('classifica fissura estrutural como CRITICA', () => {
    const resultado = classificarChamado({
      titulo: 'Fissura na laje',
      descricao: 'Rachadura aparente no teto do corredor',
      categoria: 'ESTRUTURAL',
      local: { predio: 'Bloco B', andar: '3º andar' },
    });

    expect(resultado.prioridadeSugerida).toBe('CRITICA');
  });

  it('classifica climatização que não gela como MEDIA', () => {
    const resultado = classificarChamado({
      titulo: 'Ar-condicionado não gela',
      descricao: 'Unidade do quarto',
      categoria: 'CLIMATIZACAO',
      local: { predio: 'Bloco A', andar: '5º andar', sala: '501' },
    });

    expect(resultado.prioridadeSugerida).toBe('MEDIA');
  });

  it('classifica falta de energia no apartamento como ALTA', () => {
    const resultado = classificarChamado({
      titulo: 'Falta de energia',
      descricao: 'Apartamento inteiro sem energia desde ontem',
      categoria: 'ELETRICA',
      local: { predio: 'Bloco A', andar: '4º andar', sala: '402' },
    });

    expect(resultado.prioridadeSugerida).toBe('ALTA');
  });

  it('classifica queda de energia no bloco como ALTA', () => {
    const resultado = classificarChamado({
      titulo: 'Queda de energia',
      descricao: 'Bloco inteiro sem energia após o temporal',
      categoria: 'ELETRICA',
      local: { predio: 'Bloco C' },
    });

    expect(resultado.prioridadeSugerida).toBe('ALTA');
  });

  it('classifica tomada sem energia como MEDIA', () => {
    const resultado = classificarChamado({
      titulo: 'Tomada sem energia',
      descricao: 'Tomada da cozinha sem energia, demais pontos funcionando',
      categoria: 'ELETRICA',
      local: { predio: 'Bloco A', andar: '2º andar', sala: '204' },
    });

    expect(resultado.prioridadeSugerida).toBe('MEDIA');
  });

  it('classifica disjuntor de tomada individual como BAIXA', () => {
    const resultado = classificarChamado({
      titulo: 'Disjuntor desarmando',
      descricao: 'Disjuntor da tomada individual do quarto desarmando',
      categoria: 'ELETRICA',
      local: { predio: 'Bloco A', andar: '7º andar', sala: '701' },
    });

    expect(resultado.prioridadeSugerida).toBe('BAIXA');
  });

  it('classifica curto-circuito como CRITICA', () => {
    const resultado = classificarChamado({
      titulo: 'Faísca no quadro',
      descricao: 'Curto-circuito com faísca e cheiro de queimado',
      categoria: 'ELETRICA',
      local: { predio: 'Bloco B', andar: 'Térreo', sala: 'Quadro geral' },
    });

    expect(resultado.prioridadeSugerida).toBe('CRITICA');
  });

  it('expõe a pontuação e os motivos da classificação', () => {
    const resultado = classificarChamado({
      titulo: 'Falta de energia',
      descricao: 'Apartamento inteiro sem energia',
      categoria: 'ELETRICA',
    });

    expect(resultado.pontuacao).toBe(60);
    expect(resultado.motivos).toContain('Termo "sem energia" (+30)');
  });
});
