import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import * as chamadosApi from '../api/chamados';
import type { NovoChamadoInput, SolucaoInput } from '../api/chamados';
import { useAuth } from '../context/AuthContext';
import { chaves } from '../query/keys';
import type { Chamado, Prioridade } from '../types';

// Substitui o antigo ChamadosContext: leitura via useQuery (cache, revalidação
// e estados prontos) e escrita via useMutation (invalidação automática — sumiu
// o recarregar() manual em cada página).

// Só busca com sessão ativa, para não disparar 401 (→ logout) em tela sem usuário.
export function useChamados() {
  const { usuario } = useAuth();

  return useQuery({
    queryKey: chaves.chamados,
    queryFn: chamadosApi.listar,
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
    // Abrindo um chamado a partir da lista, reaproveita o que já está em cache
    // em vez de buscar de novo (era o que o getChamado() do context fazia).
    initialData: () =>
      queryClient
        .getQueryData<Chamado[]>(chaves.chamados)
        ?.find((c) => c.id === id),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState<Chamado[]>(chaves.chamados)?.dataUpdatedAt,
  });
}

// O backend já devolve o chamado atualizado: grava o detalhe na hora e deixa
// só a listagem ser refetchada (exata, para não sobrescrever o detalhe novo).
function aplicarRetorno(qc: QueryClient, chamado: Chamado) {
  qc.setQueryData(chaves.chamado(chamado.id), chamado);
  void qc.invalidateQueries({ queryKey: chaves.chamados, exact: true });
}

export function useCriarChamado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NovoChamadoInput) => chamadosApi.criar(input),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: chaves.chamados,
        exact: true,
      }),
  });
}

export function useAprovarChamado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (v: { id: number; prioridade: Prioridade; tecnicoId: number }) =>
      chamadosApi.aprovar(v.id, v.prioridade, v.tecnicoId),
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
