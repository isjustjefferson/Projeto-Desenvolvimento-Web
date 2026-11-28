import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AuthResult, AuthState, NovoCadastro, Usuario } from '../types';
import * as authApi from '../api/auth';
import { ApiError, registrarPerdaSessao } from '../api/client';

const AuthContext = createContext<AuthState | undefined>(undefined);

function mensagemErro(erro: unknown): string {
  if (erro instanceof ApiError) return erro.message;
  return 'Não foi possível completar a operação.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const queryClient = useQueryClient();
  const usuarioId = useRef<number | null>(null);

  // Sessão pura: o cache do React Query é por conta, então ao sair ou trocar de
  // usuário descartamos tudo — o próximo login nunca herda dados do anterior.
  const definirSessao = useCallback(
    (proximo: Usuario | null) => {
      const idProximo = proximo?.id ?? null;
      if (usuarioId.current !== idProximo) queryClient.clear();
      usuarioId.current = idProximo;
      setUsuario(proximo);
    },
    [queryClient],
  );

  useEffect(() => registrarPerdaSessao(() => definirSessao(null)), [definirSessao]);

  // Revalida a sessão salva ao carregar a aplicação.
  useEffect(() => {
    let ativo = true;
    authApi
      .obterMe()
      .then((encontrado) => {
        if (ativo) definirSessao(encontrado);
      })
      .catch(() => {
        if (ativo) definirSessao(null);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [definirSessao]);

  const value = useMemo<AuthState>(() => {
    const executar = async (
      operacao: () => Promise<Usuario>,
    ): Promise<AuthResult> => {
      try {
        definirSessao(await operacao());
        return { ok: true };
      } catch (erro) {
        return { ok: false, erro: mensagemErro(erro) };
      }
    };

    const acao = async (operacao: () => Promise<unknown>): Promise<AuthResult> => {
      try {
        await operacao();
        return { ok: true };
      } catch (erro) {
        return { ok: false, erro: mensagemErro(erro) };
      }
    };

    return {
      usuario,
      carregando,
      login: (email, senha) => executar(() => authApi.login(email.trim(), senha)),
      registrar: (dados: NovoCadastro) =>
        executar(() => authApi.registrar(dados)),
      atualizarConta: (dados) => executar(() => authApi.atualizarConta(dados)),
      excluirConta: async () => {
        const res = await acao(() => authApi.excluirConta());
        if (res.ok) definirSessao(null);
        return res;
      },
      sair: async () => {
        const res = await acao(authApi.sair);
        if (res.ok) definirSessao(null);
        return res;
      },
    };
  }, [usuario, carregando, definirSessao]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return ctx;
}
