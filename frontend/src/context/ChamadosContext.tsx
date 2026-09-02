import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Chamado, Prioridade, Status, Usuario } from '../types';
import { chamadosMock } from '../data/mock';

const STORAGE_KEY = 'predial.chamados';

export interface NovoChamadoInput {
  titulo: string;
  descricao: string;
  categoria: Chamado['categoria'];
  local: Chamado['local'];
  foto?: string;
}

export interface SolucaoInput {
  descricao: string;
  materiais: string;
}

interface ChamadosContextValue {
  chamados: Chamado[];
  criarChamado: (input: NovoChamadoInput, usuario: Usuario) => Chamado;
  aprovarChamado: (
    id: number,
    prioridade: Prioridade,
    tecnicoId: number,
    usuario: Usuario,
  ) => Chamado;
  iniciarChamado: (id: number, usuario: Usuario) => Chamado;
  concluirChamado: (id: number, solucao: SolucaoInput, usuario: Usuario) => Chamado;
  getChamado: (id: number) => Chamado | undefined;
}

const ChamadosContext = createContext<ChamadosContextValue | undefined>(
  undefined,
);

function carregarChamados(): Chamado[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Chamado[];
  } catch {
    // ignora e usa o mock
  }
  return chamadosMock;
}

export function ChamadosProvider({ children }: { children: React.ReactNode }) {
  const [chamados, setChamados] = useState<Chamado[]>(carregarChamados);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chamados));
  }, [chamados]);

  const getChamado = (id: number) => chamados.find((c) => c.id === id);

  const value = useMemo<ChamadosContextValue>(() => {
    const adicionarHistorico = (
      chamado: Chamado,
      usuario: Usuario,
      de: Status | null,
      para: Status,
      observacao?: string,
    ): Chamado => ({
      ...chamado,
      status: para,
      atualizadoEm: new Date().toISOString(),
      historico: [
        {
          id: Date.now(),
          usuarioId: usuario.id,
          de,
          para,
          dataHora: new Date().toISOString(),
          observacao,
        },
        ...chamado.historico,
      ],
    });

    const criarChamado = (input: NovoChamadoInput, usuario: Usuario): Chamado => {
      const now = new Date().toISOString();
      const novo: Chamado = {
        id: Date.now(),
        titulo: input.titulo,
        descricao: input.descricao,
        categoria: input.categoria,
        local: input.local,
        status: 'AGUARDANDO_APROVACAO',
        prioridade: null,
        foto: input.foto ?? null,
        criadoPorId: usuario.id,
        tecnicoId: null,
        criadoEm: now,
        atualizadoEm: now,
        historico: [
          {
            id: Date.now() + 1,
            usuarioId: usuario.id,
            de: null,
            para: 'AGUARDANDO_APROVACAO',
            dataHora: now,
          },
        ],
      };
      setChamados((prev) => [novo, ...prev]);
      return novo;
    };

    const aprovarChamado = (
      id: number,
      prioridade: Prioridade,
      tecnicoId: number,
      usuario: Usuario,
    ): Chamado => {
      const atual = getChamado(id);
      if (!atual) throw new Error('Chamado não encontrado');
      const atualizado = adicionarHistorico(
        { ...atual, prioridade, tecnicoId },
        usuario,
        atual.status,
        'REVISADO',
        `Aprovado com prioridade ${prioridade} e atribuído ao técnico`,
      );
      setChamados((prev) =>
        prev.map((c) => (c.id === id ? atualizado : c)),
      );
      return atualizado;
    };

    const iniciarChamado = (id: number, usuario: Usuario): Chamado => {
      const atual = getChamado(id);
      if (!atual) throw new Error('Chamado não encontrado');
      const atualizado = adicionarHistorico(
        atual,
        usuario,
        atual.status,
        'EM_ANDAMENTO',
      );
      setChamados((prev) =>
        prev.map((c) => (c.id === id ? atualizado : c)),
      );
      return atualizado;
    };

    const concluirChamado = (
      id: number,
      solucao: SolucaoInput,
      usuario: Usuario,
    ): Chamado => {
      const atual = getChamado(id);
      if (!atual) throw new Error('Chamado não encontrado');
      const atualizado = adicionarHistorico(
        { ...atual, solucao },
        usuario,
        atual.status,
        'CONCLUIDO',
      );
      setChamados((prev) =>
        prev.map((c) => (c.id === id ? atualizado : c)),
      );
      return atualizado;
    };

    return {
      chamados,
      criarChamado,
      aprovarChamado,
      iniciarChamado,
      concluirChamado,
      getChamado,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chamados]);

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
