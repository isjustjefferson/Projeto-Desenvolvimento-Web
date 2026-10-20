import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';

const props = {
  titulo: 'Excluir conta',
  mensagem: 'Excluir a conta de Ana? Esta ação não pode ser desfeita.',
  rotuloConfirmar: 'Excluir',
};

describe('ConfirmDialog', () => {
  it('não renderiza nada quando está fechado', () => {
    render(
      <ConfirmDialog
        {...props}
        open={false}
        aoConfirmar={vi.fn()}
        aoCancelar={vi.fn()}
      />,
    );
    expect(screen.queryByText(props.mensagem)).not.toBeInTheDocument();
  });

  it('pergunta antes e só age ao confirmar', async () => {
    const usuario = userEvent.setup();
    const aoConfirmar = vi.fn();
    const aoCancelar = vi.fn();
    render(
      <ConfirmDialog
        {...props}
        open
        aoConfirmar={aoConfirmar}
        aoCancelar={aoCancelar}
      />,
    );
    expect(screen.getByRole('heading', { name: props.titulo })).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(aoCancelar).toHaveBeenCalledTimes(1);
    expect(aoConfirmar).not.toHaveBeenCalled();

    await usuario.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(aoConfirmar).toHaveBeenCalledTimes(1);
  });

  it('desabilita os botões enquanto a ação está em andamento', () => {
    render(
      <ConfirmDialog
        {...props}
        open
        carregando
        aoConfirmar={vi.fn()}
        aoCancelar={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Aguarde…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  });
});
