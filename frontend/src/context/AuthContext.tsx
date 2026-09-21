import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { AuthResult, AuthState, NovoCadastro, Usuario } from '../types';
import * as authApi from '../api/auth';
import * as usuariosApi from '../api/usuarios';
import { ApiError, registrarPerdaSessao } from '../api/client';

const STORAGE_KEY = 'predial.usuarioId';

const AuthContext = createContext<AuthState | undefined>(undefined);

function mensagemErro(erro: unknown): string {
  if (erro instanceof ApiError) return erro.message;
  return 'Não foi possível completar a operação.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  const definirSessao = useCallback((proximo: Usuario | null) => {
    if (proximo) {
      localStorage.setItem(STORAGE_KEY, String(proximo.id));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setUsuario(proximo);
  }, []);

  useEffect(() => {
    registrarPerdaSessao(() => definirSessao(null));
  }, [definirSessao]);

  // Revalida a sessão salva ao carregar a aplicação.
  useEffect(() => {
    const id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      setCarregando(false);
      return;
    }
    let ativo = true;
    authApi
      .obterMe()
      .then((encontrado) => {
        if (ativo) setUsuario(encontrado);
      })
      .catch(() => {
        if (ativo) localStorage.removeItem(STORAGE_KEY);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

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
      esqueciSenha: async (email) => {
        try {
          const token = await authApi.esqueciSenha(email.trim());
          return { ok: true, token };
        } catch (erro) {
          return { ok: false, erro: mensagemErro(erro) };
        }
      },
      redefinirSenha: (token, novaSenha) =>
        acao(() => authApi.redefinirSenha(token, novaSenha)),
      atualizarConta: (dados) => executar(() => authApi.atualizarConta(dados)),
      excluirConta: async () => {
        const res = await acao(() => authApi.excluirConta());
        if (res.ok) definirSessao(null);
        return res;
      },
      criarUsuario: (dados) => acao(() => usuariosApi.criar(dados)),
      definirCargo: (id, role) =>
        acao(async () => {
          await usuariosApi.alterarRole(id, role);
        }),
      removerCargo: (id) =>
        acao(async () => {
          await usuariosApi.alterarRole(id, 'SOLICITANTE');
        }),
      excluirContaPorId: (id) => acao(() => usuariosApi.excluir(id)),
      sair: () => definirSessao(null),
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
