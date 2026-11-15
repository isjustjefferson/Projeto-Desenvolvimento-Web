import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { dataLocalIso } from '../../../frontend/src/helpers';
import { RelatoriosDespesas } from '../../../frontend/src/pages/RelatoriosDespesas';

vi.mock('../../../frontend/src/context/AuthContext', () => ({
  useAuth: () => ({
    usuario: { id: 5, nome: 'Ricardo', role: 'SINDICO' },
  }),
}));

vi.mock('../../../frontend/src/hooks/useRelatorios', () => ({
  useRelatorioDespesas: () => ({
    data: undefined,
    isPending: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('../../../frontend/src/hooks/useUsuarios', () => ({
  useDiretorio: () => ({ usuarios: [] }),
}));

function renderRelatorio() {
  render(
    <MemoryRouter>
      <RelatoriosDespesas />
    </MemoryRouter>,
  );
  return {
    de: screen.getByLabelText<HTMLInputElement>('Período: de'),
    ate: screen.getByLabelText<HTMLInputElement>('Período: até'),
  };
}

describe('RelatoriosDespesas — período', () => {
  it('identifica as duas datas e não aceita datas futuras', () => {
    const { de, ate } = renderRelatorio();
    expect(de).toHaveAttribute('max', dataLocalIso());
    expect(ate).toHaveAttribute('max', dataLocalIso());
  });

  it('a data "de" não passa da "até" e vice-versa', () => {
    const { de, ate } = renderRelatorio();

    fireEvent.change(ate, { target: { value: '2026-03-10' } });
    expect(de).toHaveAttribute('max', '2026-03-10');

    fireEvent.change(de, { target: { value: '2026-03-01' } });
    expect(ate).toHaveAttribute('min', '2026-03-01');
  });
});
