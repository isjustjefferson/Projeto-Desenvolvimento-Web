import { useMemo } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import * as usuariosApi from '../api/usuarios';
import { useAuth } from '../context/AuthContext';
import { chaves } from '../query/keys';
import type { Role, UsuarioResumo } from '../types';

// Substitui o antigo DiretorioContext + a listagem manual da página Usuários.

export function useUsuarios() {
  const { usuario } = useAuth();

  // Igual ao antigo efeito: só o administrador busca a lista completa.
  return useQuery({
    queryKey: chaves.usuarios,
    queryFn: usuariosApi.listar,
    enabled: usuario?.role === 'ADMINISTRADOR',
  });
}

interface Diretorio {
  tecnicos: UsuarioResumo[];
  nomeUsuario: (id: number | null | undefined) => string;
}

// Apoio de exibição (nomes e select de técnicos): falha aqui não pode quebrar
// a tela, então devolve lista vazia em vez de propagar erro.
export function useDiretorio(): Diretorio {
  const { usuario } = useAuth();
  const { data } = useQuery({
    queryKey: chaves.diretorio,
    queryFn: usuariosApi.listarResumo,
    enabled: Boolean(usuario),
    retry: false,
  });

  return useMemo(() => {
    const usuarios = data ?? [];
    return {
      tecnicos: usuarios.filter((u) => u.role === 'TECNICO'),
      nomeUsuario: (id: number | null | undefined) =>
        id ? usuarios.find((u) => u.id === id)?.nome || '—' : '—',
    };
  }, [data]);
}

// O prefixo 'usuarios' cobre a lista da página E o resumo do diretório: uma
// mutation só precisa invalidar uma vez e as duas telas se atualizam.
function invalidarUsuarios(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: chaves.usuarios });
}

export function useCriarUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usuariosApi.criar,
    onSuccess: () => invalidarUsuarios(queryClient),
  });
}

export function useAlterarCargo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (v: { id: number; role: Role }) =>
      usuariosApi.alterarRole(v.id, v.role),
    onSuccess: () => invalidarUsuarios(queryClient),
  });
}

export function useExcluirUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => usuariosApi.excluir(id),
    onSuccess: () => invalidarUsuarios(queryClient),
  });
}
