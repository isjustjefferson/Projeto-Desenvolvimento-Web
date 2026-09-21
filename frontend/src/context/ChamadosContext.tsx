import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Chamado, Prioridade } from '../types';
import { useAuth } from './AuthContext';
import { ApiError } from '../api/client';
import * as chamadosApi from '../api/chamados';
import type { NovoChamadoInput, SolucaoInput } from '../api/chamados';

interface ChamadosContextValue {
  chamados: Chamado[];
  carregando: boolean;
  erro: string;
  recarregar: () => Promise<void>;
  getChamado: (id: number) => Chamado | undefined;
  obterChamado: (id: number) => Promise<Chamado>;
  criarChamado: (input: NovoChamadoInput) => Promise<Chamado>;
  aprovarChamado: (
    id: number,
    prioridade: Prioridade,
    tecnicoId: number,
  ) => Promise<Chamado>;
  iniciarChamado: (id: number) => Promise<Chamado>;
  concluirChamado: (id: number, solucao: SolucaoInput) => Promise<Chamado>;
}

const ChamadosContext = createContext<ChamadosContextValue | undefined>(
  undefined,
);

function mensagemErro(erro: unknown): string {
  if (erro instanceof ApiError) return erro.message;
  return 'Não foi possível carregar os chamados.';
}

export function ChamadosProvider({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      setChamados(await chamadosApi.listar());
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (!usuario) {
      setChamados([]);
      setCarregando(false);
      setErro('');
      return;
    }
    void recarregar();
  }, [usuario, recarregar]);

  const value = useMemo<ChamadosContextValue>(
    () => ({
      chamados,
      carregando,
      erro,
      recarregar,
      getChamado: (id) => chamados.find((c) => c.id === id),
      obterChamado: async (id) => {
        const encontrado = await chamadosApi.obter(id);
        setChamados((prev) =>
          prev.some((c) => c.id === id)
            ? prev.map((c) => (c.id === id ? encontrado : c))
            : [encontrado, ...prev],
        );
        return encontrado;
      },
      criarChamado: async (input) => {
        const novo = await chamadosApi.criar(input);
        setChamados((prev) => [novo, ...prev]);
        return novo;
      },
      aprovarChamado: async (id, prioridade, tecnicoId) => {
        const atualizado = await chamadosApi.aprovar(id, prioridade, tecnicoId);
        setChamados((prev) =>
          prev.map((c) => (c.id === id ? atualizado : c)),
        );
        return atualizado;
      },
      iniciarChamado: async (id) => {
        const atualizado = await chamadosApi.iniciar(id);
        setChamados((prev) =>
          prev.map((c) => (c.id === id ? atualizado : c)),
        );
        return atualizado;
      },
      concluirChamado: async (id, solucao) => {
        const atualizado = await chamadosApi.concluir(id, solucao);
        setChamados((prev) =>
          prev.map((c) => (c.id === id ? atualizado : c)),
        );
        return atualizado;
      },
    }),
    [chamados, carregando, erro, recarregar],
  );

  return (
    <ChamadosContext.Provider value={value}>
      {children}
    </ChamadosContext.Provider>
  );
}

export function useChamados(): ChamadosContextValue {
  const ctx = useContext(ChamadosContext);
  if (!ctx) {
    throw new Error('useChamados deve ser usado dentro de ChamadosProvider');
  }
  return ctx;
}
