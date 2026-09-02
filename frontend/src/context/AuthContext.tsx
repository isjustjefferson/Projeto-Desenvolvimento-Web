import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthResult, AuthState, NovoCadastro, Role, Usuario } from '../types';
import { usuariosMock } from '../data/mock';

const STORAGE_KEY = 'predial.usuarioId';
const CONTAS_KEY = 'predial.contas';
const SENHAS_KEY = 'predial.senhas';
const PERFIS_KEY = 'predial.perfis';

interface PerfilOverride {
  nome?: string;
  foto?: string;
  role?: Role;
  excluido?: boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

function lerContas(): Usuario[] {
  try {
    return JSON.parse(localStorage.getItem(CONTAS_KEY) || '[]') as Usuario[];
  } catch {
    return [];
  }
}

function lerSenhas(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(SENHAS_KEY) || '{}') as Record<
      string,
      string
    >;
  } catch {
    return {};
  }
}

function lerPerfis(): Record<string, PerfilOverride> {
  try {
    return JSON.parse(localStorage.getItem(PERFIS_KEY) || '{}') as Record<
      string,
      PerfilOverride
    >;
  } catch {
    return {};
  }
}

function salvarContas(contas: Usuario[]) {
  localStorage.setItem(CONTAS_KEY, JSON.stringify(contas));
}

function salvarSenhas(overrides: Record<string, string>) {
  localStorage.setItem(SENHAS_KEY, JSON.stringify(overrides));
}

function salvarPerfis(overrides: Record<string, PerfilOverride>) {
  localStorage.setItem(PERFIS_KEY, JSON.stringify(overrides));
}

function emailParaChave(email: string): string {
  return email.trim().toLowerCase();
}

function resolverMock(u: Usuario): Usuario {
  const ov = lerPerfis()[String(u.id)];
  if (!ov) return u;
  return {
    ...u,
    nome: ov.nome ?? u.nome,
    foto: ov.foto ?? u.foto,
    role: ov.role ?? u.role,
  };
}

function mockExcluido(u: Usuario): boolean {
  return lerPerfis()[String(u.id)]?.excluido === true;
}

function obterUsuarioSalvo(contas: Usuario[]): Usuario | null {
  try {
    const id = localStorage.getItem(STORAGE_KEY);
    if (!id) return null;
    const num = Number(id);
    const mock = usuariosMock.find((u) => u.id === num);
    if (mock && !mockExcluido(mock)) return resolverMock(mock);
    return contas.find((u) => u.id === num) ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [contas, setContas] = useState<Usuario[]>(() => lerContas());
  const [usuario, setUsuario] = useState<Usuario | null>(() =>
    obterUsuarioSalvo(lerContas()),
  );
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    salvarContas(contas);
  }, [contas]);

  useEffect(() => {
    if (usuario) {
      localStorage.setItem(STORAGE_KEY, String(usuario.id));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [usuario]);

  const value = useMemo<AuthState>(() => {
    const buscarConta = (email: string): Usuario | undefined => {
      const chave = emailParaChave(email);
      const mock = usuariosMock.find((u) => u.email.toLowerCase() === chave);
      if (mock && !mockExcluido(mock)) return resolverMock(mock);
      return contas.find((u) => u.email.toLowerCase() === chave);
    };

    const login = (email: string, senha: string): AuthResult => {
      const emailLimp = email.trim().toLowerCase();
      if (!emailLimp || !senha) {
        return { ok: false, erro: 'Preencha e-mail e senha.' };
      }
      const conta = buscarConta(emailLimp);
      if (!conta) {
        return { ok: false, erro: 'E-mail não encontrado. Crie uma conta.' };
      }
      const senhaAtual =
        lerSenhas()[emailParaChave(conta.email)] ?? conta.senha;
      if (senhaAtual !== senha) {
        return { ok: false, erro: 'Senha incorreta. Tente novamente.' };
      }
      if (!conta.ativo) {
        return { ok: false, erro: 'Conta desativada. Contate o administrador.' };
      }
      setUsuario(conta);
      return { ok: true };
    };

    const registrar = (dados: NovoCadastro): AuthResult => {
      const email = dados.email.trim().toLowerCase();
      if (!dados.nome.trim()) {
        return { ok: false, erro: 'Informe seu nome completo.' };
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { ok: false, erro: 'Informe um e-mail válido.' };
      }
      if (!dados.unidade.trim()) {
        return { ok: false, erro: 'Informe sua unidade/bloco.' };
      }
      if (dados.senha.length < 6) {
        return { ok: false, erro: 'A senha deve ter pelo menos 6 caracteres.' };
      }
      const existe =
        usuariosMock.some((u) => u.email.toLowerCase() === email) ||
        contas.some((u) => u.email.toLowerCase() === email);
      if (existe) {
        return { ok: false, erro: 'Este e-mail já está cadastrado.' };
      }
      const nova: Usuario = {
        id: Date.now(),
        nome: dados.nome.trim(),
        email,
        senha: dados.senha,
        role: 'SOLICITANTE',
        unidade: dados.unidade.trim(),
        setor: dados.unidade.trim(),
        ativo: true,
        criadoEm: new Date().toISOString(),
      };
      const novas = [...contas, nova];
      setContas(novas);
      salvarContas(novas);
      setUsuario(nova);
      return { ok: true };
    };

    const criarUsuario = (dados: {
      nome: string;
      email: string;
      senha: string;
      role: Role;
      especialidade?: string;
      setor?: string;
    }): AuthResult => {
      const email = dados.email.trim().toLowerCase();
      if (!dados.nome.trim()) {
        return { ok: false, erro: 'Informe o nome do usuário.' };
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { ok: false, erro: 'Informe um e-mail válido.' };
      }
      const existe =
        usuariosMock.some((u) => u.email.toLowerCase() === email) ||
        contas.some((u) => u.email.toLowerCase() === email);
      if (existe) {
        return { ok: false, erro: 'Este e-mail já está cadastrado.' };
      }
      const novo: Usuario = {
        id: Date.now(),
        nome: dados.nome.trim(),
        email,
        senha: dados.senha || '123456',
        role: dados.role,
        especialidade:
          dados.role === 'TECNICO'
            ? dados.especialidade?.trim() || undefined
            : undefined,
        setor:
          dados.role !== 'TECNICO' ? dados.setor?.trim() || undefined : undefined,
        ativo: true,
        criadoEm: new Date().toISOString(),
      };
      const novas = [...contas, novo];
      setContas(novas);
      salvarContas(novas);
      return { ok: true };
    };

    const redefinirSenha = (email: string, novaSenha: string): AuthResult => {
      const chave = emailParaChave(email);
      const conta = buscarConta(email);
      if (!conta) {
        return { ok: false, erro: 'E-mail não encontrado.' };
      }
      if (novaSenha.length < 6) {
        return {
          ok: false,
          erro: 'A nova senha deve ter pelo menos 6 caracteres.',
        };
      }
      const overrides = lerSenhas();
      overrides[chave] = novaSenha;
      salvarSenhas(overrides);
      return { ok: true };
    };

    const atualizarConta = (dados: { nome?: string; foto?: string }) => {
      if (!usuario) return;
      const idx = contas.findIndex((c) => c.id === usuario.id);
      if (idx >= 0) {
        const atualizada = {
          ...contas[idx],
          nome: dados.nome ?? contas[idx].nome,
          foto: dados.foto !== undefined ? dados.foto : contas[idx].foto,
        };
        const novas = [...contas];
        novas[idx] = atualizada;
        setContas(novas);
        salvarContas(novas);
        setUsuario(atualizada);
        return;
      }
      const perfis = lerPerfis();
      const id = String(usuario.id);
      const prev = perfis[id] || {};
      if (dados.nome !== undefined) prev.nome = dados.nome;
      if (dados.foto !== undefined) prev.foto = dados.foto;
      perfis[id] = prev;
      salvarPerfis(perfis);
      setUsuario(obterUsuarioSalvo(contas));
    };

    const excluirConta = () => {
      if (!usuario) return;
      const ehMock = usuariosMock.some((u) => u.id === usuario.id);
      const perfis = lerPerfis();
      if (ehMock) {
        const prev = perfis[String(usuario.id)] || {};
        prev.excluido = true;
        perfis[String(usuario.id)] = prev;
      }
      salvarPerfis(perfis);
      const novas = contas.filter((c) => c.id !== usuario.id);
      if (novas.length !== contas.length) {
        setContas(novas);
        salvarContas(novas);
      }
      setUsuario(null);
    };

    const redefinirCargoMock = (
      id: number,
      acao: (prev: PerfilOverride) => void,
    ) => {
      const perfis = lerPerfis();
      const prev = perfis[String(id)] || {};
      acao(prev);
      perfis[String(id)] = prev;
      salvarPerfis(perfis);
      if (usuario && usuario.id === id) {
        setUsuario(obterUsuarioSalvo(contas));
      }
    };

    const definirCargo = (id: number, role: Role) => {
      const ehMock = usuariosMock.some((u) => u.id === id);
      if (ehMock) {
        redefinirCargoMock(id, (prev) => {
          prev.role = role;
        });
        setVersao((v) => v + 1);
        return;
      }
      const novas = contas.map((c) => (c.id === id ? { ...c, role } : c));
      setContas(novas);
      salvarContas(novas);
      if (usuario && usuario.id === id) {
        setUsuario({ ...usuario, role });
      }
    };

    const removerCargo = (id: number) => {
      const ehMock = usuariosMock.some((u) => u.id === id);
      if (ehMock) {
        redefinirCargoMock(id, (prev) => {
          delete prev.role;
        });
        setVersao((v) => v + 1);
        return;
      }
      const novas = contas.map((c) =>
        c.id === id ? { ...c, role: 'SOLICITANTE' as const } : c,
      );
      setContas(novas);
      salvarContas(novas);
      if (usuario && usuario.id === id) {
        setUsuario({ ...usuario, role: 'SOLICITANTE' as const });
      }
    };

    const excluirContaPorId = (id: number) => {
      const ehMock = usuariosMock.some((u) => u.id === id);
      const perfis = lerPerfis();
      if (ehMock) {
        const prev = perfis[String(id)] || {};
        prev.excluido = true;
        perfis[String(id)] = prev;
        salvarPerfis(perfis);
      }
      const novas = contas.filter((c) => c.id !== id);
      setContas(novas);
      salvarContas(novas);
      if (usuario && usuario.id === id) {
        setUsuario(null);
      }
    };

    return {
      usuario,
      contasRegistradas: contas,
      versao,
      login,
      registrar,
      redefinirSenha,
      atualizarConta,
      excluirConta,
      criarUsuario,
      definirCargo,
      removerCargo,
      excluirContaPorId,
      sair: () => setUsuario(null),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario, contas, versao]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return ctx;
}
