import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Inbox } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('mostra título e descrição', () => {
    render(
      <EmptyState
        icon={Inbox}
        titulo="Nenhum chamado por aqui"
        descricao="Quando houver chamados, eles aparecem aqui."
      />,
    );
    expect(screen.getByText('Nenhum chamado por aqui')).toBeInTheDocument();
    expect(
      screen.getByText('Quando houver chamados, eles aparecem aqui.'),
    ).toBeInTheDocument();
  });

  it('dispara a ação sugerida', async () => {
    const usuario = userEvent.setup();
    const aoClicar = vi.fn();
    render(
      <EmptyState
        icon={Inbox}
        titulo="Nada"
        descricao="Nada corresponde aos filtros."
        acao={<button onClick={aoClicar}>Limpar filtros</button>}
      />,
    );
    await usuario.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(aoClicar).toHaveBeenCalledTimes(1);
  });

  it('renderiza sem ação quando nenhuma é informada', () => {
    render(<EmptyState icon={Inbox} titulo="Nada" descricao="..." />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
