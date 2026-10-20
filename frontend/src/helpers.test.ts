import { describe, expect, it } from 'vitest';
import {
  avatarCor,
  categoriaLabel,
  formatarData,
  iniciais,
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
    expect(roleLabel.TECNICO).toBe('Técnico');
  });
});
