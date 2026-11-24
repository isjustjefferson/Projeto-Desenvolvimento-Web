import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as orcamentosApi from '../api/orcamentos';
import type { CriarOrcamentoInput } from '../api/orcamentos';
import { useAuth } from '../context/AuthContext';
import { chaves } from '../query/keys';

export function useOrcamentos(
  id: number | undefined,
  opcoes: { enabled?: boolean } = {},
) {
  const { usuario } = useAuth();

  return useQuery({
    queryKey: chaves.orcamentos(id ?? 0),
    queryFn: () => orcamentosApi.listarOrcamentos(id as number),
    enabled: Boolean(usuario) && id !== undefined && (opcoes.enabled ?? true),
  });
}

export function useCriarOrcamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (v: { chamadoId: number; input: CriarOrcamentoInput }) =>
      orcamentosApi.criarOrcamento(v.chamadoId, v.input),
    onSuccess: (_orcamento, v) => {
      void queryClient.invalidateQueries({ queryKey: chaves.orcamentos(v.chamadoId) });
      void queryClient.invalidateQueries({ queryKey: chaves.chamado(v.chamadoId) });
    },
  });
}

export function useAprovarOrcamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (v: { chamadoId: number; orcamentoId: number }) =>
      orcamentosApi.aprovarOrcamento(v.chamadoId, v.orcamentoId),
    onSuccess: (_orcamento, v) => {
      void queryClient.invalidateQueries({ queryKey: chaves.orcamentos(v.chamadoId) });
      void queryClient.invalidateQueries({ queryKey: chaves.chamado(v.chamadoId) });
    },
  });
}

export function useRejeitarOrcamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (v: { chamadoId: number; orcamentoId: number; motivo: string }) =>
      orcamentosApi.rejeitarOrcamento(v.chamadoId, v.orcamentoId, v.motivo),
    onSuccess: (_orcamento, v) => {
      void queryClient.invalidateQueries({ queryKey: chaves.orcamentos(v.chamadoId) });
      void queryClient.invalidateQueries({ queryKey: chaves.chamado(v.chamadoId) });
    },
  });
}
