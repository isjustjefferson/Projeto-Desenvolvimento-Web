import type { InputHTMLAttributes } from 'react';
import { centavosDeDigitos, formatarMoeda } from '../helpers';

type Props = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type' | 'inputMode'
> & {
  // Valor em centavos (inteiro): 1234 = R$ 12,34
  value: number;
  onChange: (centavos: number) => void;
};

// Campo monetário controlado: formata em R$ durante a digitação. Pronto para os
// lançamentos de custos de materiais e mão de obra.
export function CampoMoeda({ value, onChange, className, ...resto }: Props) {
  return (
    <input
      {...resto}
      type="text"
      inputMode="numeric"
      className={className ?? 'input'}
      value={formatarMoeda(value)}
      onChange={(e) => onChange(centavosDeDigitos(e.target.value))}
    />
  );
}
