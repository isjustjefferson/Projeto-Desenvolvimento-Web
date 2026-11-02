import { useState } from 'react';

export type Visualizacao = 'cards' | 'lista';

const STORAGE_KEY = 'predial.visualizacaoChamados';

// Preferência só deste navegador. O storage pode estar bloqueado (aba anônima,
// dados do site desativados): nesse caso fica a visão padrão, sem erro.
function lerPreferencia(): Visualizacao {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'lista' ? 'lista' : 'cards';
  } catch {
    return 'cards';
  }
}

export function useVisualizacao() {
  const [visualizacao, setVisualizacao] =
    useState<Visualizacao>(lerPreferencia);

  const alterar = (nova: Visualizacao) => {
    setVisualizacao(nova);
    try {
      localStorage.setItem(STORAGE_KEY, nova);
    } catch {
      // sem storage, a escolha vale só até sair da tela
    }
  };

  return [visualizacao, alterar] as const;
}
