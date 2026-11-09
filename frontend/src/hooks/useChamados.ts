import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import * as chamadosApi from '../api/chamados';
import * as despesasApi from '../api/despesas';
import type {
  FiltrosChamados,
  NovoChamadoInput,
  SolucaoInput,
} from '../api/chamados';
import type { CriarDespesaInput, EditarDespesaInput, AnexarDespesaInput } from '../api/despesas';
import { useAuth } from '../context/AuthContext';
import { chaves } from '../query/keys';
import type { Chamado, PaginaChamados, Prioridade } from '../types';

// Substitui o antigo ChamadosContext: leitura via useQuery (cache, revalidação
// e estados prontos) e escrita via useMutation (invalidação automática — sumiu
// o recarregar() manual em cada página).

// Só busca com sessão ativa, para não disparar 401 (→ logout) em tela sem usuário.
export function useChamados(
  filtros: FiltrosChamados = {},
  opcoes: { enabled?: boolean } = {},
) {
  const { usuario } = useAuth();

  return useQuery({
    queryKey: chaves.listaChamados(filtros),
    queryFn: () => chamadosApi.listar(filtros),
    enabled: Boolean(usuario) && (opcoes.enabled ?? true),
  });
}

export function useResumoChamados() {
  const { usuario } = useAuth();

  return useQuery({
    queryKey: chaves.resumoChamados,
    queryFn: chamadosApi.resumo,
    enabled: Boolean(usuario),
  });
}

export function useChamado(id: number | undefined) {
  const { usuario } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: chaves.chamado(id ?? 0),
    queryFn: () => chamadosApi.obter(id as number),
    enabled: id !== undefined && Boolean(usuario),
    // Abrindo um chamado a partir de uma lista, reaproveita o que já está em
    // cache em vez de buscar de novo.
    initialData: () => {
      if (id === undefined) return undefined;
      const paginas = queryClient.getQueriesData<PaginaChamados>({
        queryKey: chaves.listasChamados,
      });
      for (const [, pagina] of paginas) {
        const chamado = pagina?.chamados.find((c) => c.id === id);
        if (chamado) return chamado;
      }
      return undefined;
    },
    initialDataUpdatedAt: () => {
      const paginas = queryClient.getQueriesData<PaginaChamados>({
        queryKey: chaves.listasChamados,
      });
      return Math.max(
        0,
        ...paginas.map(
          ([chave]) => queryClient.getQueryState(chave)?.dataUpdatedAt ?? 0,
        ),
      );
    },
  });
}

function invalidarListas(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: chaves.listasChamados });
  void qc.invalidateQueries({ queryKey: chaves.resumoChamados, exact: true });
}

// O backend já devolve o chamado atualizado: grava o detalhe na hora e deixa
// só a listagem/resumo serem refetchados.
function aplicarRetorno(qc: QueryClient, chamado: Chamado) {
  qc.setQueryData(chaves.chamado(chamado.id), chamado);
  invalidarListas(qc);
}

export function useCriarChamado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NovoChamadoInput) => chamadosApi.criar(input),
    onSuccess: () => invalidarListas(queryClient),
  });
}

export function useAprovarChamado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (v: { id: number; prioridade: Prioridade; prestadorId: number }) =>
      chamadosApi.aprovar(v.id, v.prioridade, v.prestadorId),
    onSuccess: (chamado) => aplicarRetorno(queryClient, chamado),
  });
}

export function useIniciarChamado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => chamadosApi.iniciar(id),
    onSuccess: (chamado) => aplicarRetorno(queryClient, chamado),
  });
}

export function useConcluirChamado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (v: { id: number; solucao: SolucaoInput }) =>
      chamadosApi.concluir(v.id, v.solucao),
    onSuccess: (chamado) => aplicarRetorno(queryClient, chamado),
  });
}

export function useCriarDespesa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (v: { chamadoId: number; input: CriarDespesaInput }) =>
      despesasApi.criarDespesa(v.chamadoId, v.input),
    onSuccess: (_d, v) => {
      void queryClient.invalidateQueries({ queryKey: chaves.chamado(v.chamadoId) });
      invalidarListas(queryClient);
      void queryClient.invalidateQueries({ queryKey: chaves.despesas(v.chamadoId) });
    },
  });
}

export function useEditarDespesa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (v: { chamadoId: number; despesaId: number; input: EditarDespesaInput }) =>
      despesasApi.editarDespesa(v.chamadoId, v.despesaId, v.input),
    onSuccess: (_d, v) => {
      void queryClient.invalidateQueries({ queryKey: chaves.chamado(v.chamadoId) });
      invalidarListas(queryClient);
      void queryClient.invalidateQueries({ queryKey: chaves.despesas(v.chamadoId) });
    },
  });
}

export function useRemoverDespesa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (v: { chamadoId: number; despesaId: number }) =>
      despesasApi.removerDespesa(v.chamadoId, v.despesaId),
    onSuccess: (_r, v) => {
      void queryClient.invalidateQueries({ queryKey: chaves.chamado(v.chamadoId) });
      invalidarListas(queryClient);
      void queryClient.invalidateQueries({ queryKey: chaves.despesas(v.chamadoId) });
    },
  });
}

export function useAnexarDespesa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (v: { chamadoId: number; despesaId: number; input: AnexarDespesaInput }) =>
      despesasApi.anexarDespesa(v.chamadoId, v.despesaId, v.input),
    onSuccess: (_d, v) => {
      void queryClient.invalidateQueries({ queryKey: chaves.chamado(v.chamadoId) });
      invalidarListas(queryClient);
      void queryClient.invalidateQueries({ queryKey: chaves.despesas(v.chamadoId) });
    },
  });
}

export function useRemoverAnexoDespesa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (v: { chamadoId: number; despesaId: number; anexoId: number }) =>
      despesasApi.removerAnexoDespesa(v.chamadoId, v.despesaId, v.anexoId),
    onSuccess: (_d, v) => {
      void queryClient.invalidateQueries({ queryKey: chaves.chamado(v.chamadoId) });
      invalidarListas(queryClient);
      void queryClient.invalidateQueries({ queryKey: chaves.despesas(v.chamadoId) });
    },
  });
}

export function useAprovarDespesa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (v: { chamadoId: number; despesaId: number }) =>
      despesasApi.aprovarDespesa(v.chamadoId, v.despesaId),
    onSuccess: (_d, v) => {
      void queryClient.invalidateQueries({ queryKey: chaves.chamado(v.chamadoId) });
      invalidarListas(queryClient);
      void queryClient.invalidateQueries({ queryKey: chaves.despesas(v.chamadoId) });
    },
  });
}

export function useRejeitarDespesa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (v: { chamadoId: number; despesaId: number; motivo: string }) =>
      despesasApi.rejeitarDespesa(v.chamadoId, v.despesaId, v.motivo),
    onSuccess: (_d, v) => {
      void queryClient.invalidateQueries({ queryKey: chaves.chamado(v.chamadoId) });
      invalidarListas(queryClient);
      void queryClient.invalidateQueries({ queryKey: chaves.despesas(v.chamadoId) });
    },
  });
}
