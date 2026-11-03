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
});
