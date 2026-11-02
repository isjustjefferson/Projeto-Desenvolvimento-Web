import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CampoMoeda } from './CampoMoeda';

const semNbsp = (s: string) => s.replace(/\u00a0/g, ' ');

function Controlado({ aoMudar }: { aoMudar: (centavos: number) => void }) {
  const [valor, setValor] = useState(0);
  return (
    <CampoMoeda
      aria-label="Valor total"
      value={valor}
      onChange={(centavos) => {
        setValor(centavos);
        aoMudar(centavos);
      }}
    />
  );
}

describe('CampoMoeda', () => {
  it('exibe o valor em centavos formatado em reais', () => {
    render(
      <CampoMoeda
        aria-label="Valor total"
        value={150050}
        onChange={() => {}}
      />,
    );
    expect(
      semNbsp(screen.getByLabelText<HTMLInputElement>('Valor total').value),
    ).toBe('R$ 1.500,50');
  });

  it('formata enquanto o usuário digita', async () => {
    const usuario = userEvent.setup();
    const aoMudar = vi.fn();
    render(<Controlado aoMudar={aoMudar} />);
    const campo = screen.getByLabelText<HTMLInputElement>('Valor total');

    await usuario.type(campo, '1234');

    expect(semNbsp(campo.value)).toBe('R$ 12,34');
    expect(aoMudar).toHaveBeenLastCalledWith(1234);
  });

  it('apagar remove o último dígito', async () => {
    const usuario = userEvent.setup();
    const aoMudar = vi.fn();
    render(<Controlado aoMudar={aoMudar} />);
    const campo = screen.getByLabelText<HTMLInputElement>('Valor total');

    await usuario.type(campo, '1234{Backspace}');

    expect(semNbsp(campo.value)).toBe('R$ 1,23');
    expect(aoMudar).toHaveBeenLastCalledWith(123);
  });

  it('ignora letras', async () => {
    const usuario = userEvent.setup();
    const aoMudar = vi.fn();
    render(<Controlado aoMudar={aoMudar} />);
    const campo = screen.getByLabelText<HTMLInputElement>('Valor total');

    await usuario.type(campo, '5a');

    expect(semNbsp(campo.value)).toBe('R$ 0,05');
    expect(aoMudar).toHaveBeenLastCalledWith(5);
  });
});
