import { describe, expect, it } from 'vitest';
import {
  avatarCor,
  categoriaLabel,
  centavosDeDigitos,
  formatarData,
  formatarMoeda,
  iniciais,
  paginar,
  prioridadeLabel,
  roleLabel,
  statusLabel,
  tempoRelativo,
} from './helpers';

describe('formatarData', () => {
  it('retorna "-" quando não há data', () => {
    expect(formatarData(undefined)).toBe('-');
    expect(formatarData(null)).toBe('-');
  });

  it('formata em pt-BR com dia, mês, ano e hora', () => {
    expect(formatarData('2026-03-15T12:00:00')).toBe('15/03/2026, 12:00');
  });
});

describe('tempoRelativo', () => {
  const ha = (ms: number) => new Date(Date.now() - ms).toISOString();

  it('usa minutos, horas e dias conforme a diferença', () => {
    expect(tempoRelativo(ha(10 * 60_000))).toBe('10 min atrás');
    expect(tempoRelativo(ha(3 * 3_600_000))).toBe('3 h atrás');
    expect(tempoRelativo(ha(24 * 3_600_000))).toBe('1 dia atrás');
    expect(tempoRelativo(ha(48 * 3_600_000))).toBe('2 dias atrás');
  });
});

describe('iniciais', () => {
  it('usa no máximo duas letras, em maiúsculas', () => {
    expect(iniciais('Ana Clara Souza')).toBe('AC');
    expect(iniciais('joão da silva')).toBe('JD');
    expect(iniciais('maria')).toBe('M');
    expect(iniciais('   ana   maria   ')).toBe('AM');
  });
});

describe('avatarCor', () => {
  it('é determinística e sempre devolve uma cor do conjunto', () => {
    const paleta = [
      'bg-brand-600',
      'bg-blue-600',
      'bg-emerald-600',
      'bg-amber-600',
      'bg-purple-600',
      'bg-rose-600',
    ];
    expect(avatarCor('Ana')).toBe(avatarCor('Ana'));
    expect(paleta).toContain(avatarCor('Ana'));
    expect(paleta).toContain(avatarCor('Bruno Careca'));
  });
});

describe('rótulos', () => {
  it('cobre todos os valores dos enums usados na interface', () => {
    expect(Object.keys(statusLabel)).toHaveLength(4);
    expect(Object.keys(prioridadeLabel)).toHaveLength(4);
    expect(Object.keys(roleLabel)).toHaveLength(4);
    expect(Object.keys(categoriaLabel)).toHaveLength(6);
    expect(statusLabel.AGUARDANDO_APROVACAO).toBe('Aguardando Aprovação');
    expect(categoriaLabel.HIDRAULICA).toBe('Hidráulica');
    expect(roleLabel.PRESTADOR).toBe('Prestador de Serviços');
  });
});

// Intl usa espaço não separável entre "R$" e o valor
const semNbsp = (s: string) => s.replace(/\u00a0/g, ' ');

describe('formatarMoeda', () => {
  it('formata centavos em reais no padrão pt-BR', () => {
    expect(semNbsp(formatarMoeda(0))).toBe('R$ 0,00');
    expect(semNbsp(formatarMoeda(1234))).toBe('R$ 12,34');
    expect(semNbsp(formatarMoeda(123456789))).toBe('R$ 1.234.567,89');
  });
});

describe('centavosDeDigitos', () => {
  it('lê só os dígitos, como digitação de caixa eletrônico', () => {
    expect(centavosDeDigitos('')).toBe(0);
    expect(centavosDeDigitos('1')).toBe(1);
    expect(centavosDeDigitos('R$ 0,123')).toBe(123);
    expect(centavosDeDigitos('R$ 1.234,56')).toBe(123456);
  });

  it('ignora o excesso de dígitos para não perder precisão', () => {
    expect(centavosDeDigitos('99999999999999999999')).toBe(999999999999);
  });
});

describe('paginar', () => {
  const itens = Array.from({ length: 23 }, (_, i) => i + 1);

  it('fatia a página pedida e informa o total', () => {
    const p = paginar(itens, 2, 10);
    expect(p.itens).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(p.pagina).toBe(2);
    expect(p.totalPaginas).toBe(3);
    expect(p.total).toBe(23);
  });

  it('a última página traz só o resto', () => {
    expect(paginar(itens, 3, 10).itens).toEqual([21, 22, 23]);
  });

  it('corrige página fora do intervalo', () => {
    expect(paginar(itens, 9, 10).pagina).toBe(3);
    expect(paginar(itens, 0, 10).pagina).toBe(1);
  });

  it('lista vazia tem uma página vazia', () => {
    expect(paginar([], 1, 10)).toEqual({
      itens: [],
      pagina: 1,
      totalPaginas: 1,
      total: 0,
    });
  });
});
