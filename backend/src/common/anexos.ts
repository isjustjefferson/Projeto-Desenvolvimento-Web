import type { AnexoDespesa, Despesa } from '../contrato.js';

export function anexoSemConteudo(anexo: AnexoDespesa): AnexoDespesa {
  const copia = { ...anexo };
  delete copia.conteudo;
  return copia;
}

export function despesaSemConteudo(despesa: Despesa): Despesa {
  return {
    ...despesa,
    anexos: despesa.anexos.map(anexoSemConteudo),
  };
}
