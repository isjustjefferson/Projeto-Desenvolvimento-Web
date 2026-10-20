import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicOnly, RequireAuth, RequireRoles } from './App';
import type { Usuario } from './types';

// Sessão controlada pelos testes — o AuthContext real é substituído.
const sessao = vi.hoisted(() => ({
  usuario: null as Usuario | null,
  carregando: false,
}));

vi.mock('./context/AuthContext', () => ({
  useAuth: () => sessao,
}));

// O guard precisa ficar DENTRO de <Routes>. Se ele emitir <Navigate> fora de uma
// rota, o componente nunca desmonta e o router entra em loop de navegação em
// cadeia (no App.tsx os guards sempre rotam dentro de <Routes>).
function renderGuard(conteudo: ReactNode) {
  return render(
    <MemoryRouter initialEntries={['/area']}>
      <Routes>
        <Route path="/area" element={<>{conteudo}</>} />
        <Route path="/" element={<p>home</p>} />
        <Route path="/login" element={<p>tela de login</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function usuarioSessao(role: Usuario['role'], id = 1): Usuario {
  return {
    id,
    nome: 'Ana',
    email: 'ana@predial.com',
    role,
    ativo: true,
  };
}

beforeEach(() => {
  sessao.usuario = null;
  sessao.carregando = false;
});

describe('RequireAuth', () => {
  it('mostra o carregamento enquanto a sessão é resolvida', () => {
    sessao.carregando = true;
    renderGuard(
      <RequireAuth>
        <p>conteúdo protegido</p>
      </RequireAuth>,
    );
    expect(screen.getByText('Carregando…')).toBeInTheDocument();
  });

  it('redireciona para o login quando não há usuário', () => {
    renderGuard(
      <RequireAuth>
        <p>conteúdo protegido</p>
      </RequireAuth>,
    );
    expect(screen.queryByText('conteúdo protegido')).not.toBeInTheDocument();
    expect(screen.getByText('tela de login')).toBeInTheDocument();
  });

  it('libera o conteúdo quando há usuário logado', () => {
    sessao.usuario = usuarioSessao('ADMINISTRADOR', 6);
    renderGuard(
      <RequireAuth>
        <p>conteúdo protegido</p>
      </RequireAuth>,
    );
    expect(screen.getByText('conteúdo protegido')).toBeInTheDocument();
  });
});

describe('PublicOnly', () => {
  it('deixa o visitante ver a página pública', () => {
    renderGuard(
      <PublicOnly>
        <p>tela pública</p>
      </PublicOnly>,
    );
    expect(screen.getByText('tela pública')).toBeInTheDocument();
  });

  it('empurra o usuário logado para o dashboard', () => {
    sessao.usuario = usuarioSessao('SOLICITANTE');
    renderGuard(
      <PublicOnly>
        <p>tela pública</p>
      </PublicOnly>,
    );
    expect(screen.queryByText('tela pública')).not.toBeInTheDocument();
    expect(screen.getByText('home')).toBeInTheDocument();
  });
});

describe('RequireRoles', () => {
  it('libera o conteúdo para o perfil permitido', () => {
    sessao.usuario = usuarioSessao('ADMINISTRADOR', 6);
    renderGuard(
      <RequireRoles roles={['ADMINISTRADOR']}>
        <p>conteúdo restrito</p>
      </RequireRoles>,
    );
    expect(screen.getByText('conteúdo restrito')).toBeInTheDocument();
  });

  it('redireciona para a home quando o perfil não está na lista', () => {
    sessao.usuario = usuarioSessao('SOLICITANTE');
    renderGuard(
      <RequireRoles roles={['ADMINISTRADOR']}>
        <p>conteúdo restrito</p>
      </RequireRoles>,
    );
    expect(screen.queryByText('conteúdo restrito')).not.toBeInTheDocument();
    expect(screen.getByText('home')).toBeInTheDocument();
  });

  it('redireciona quando não há usuário logado', () => {
    renderGuard(
      <RequireRoles roles={['ADMINISTRADOR']}>
        <p>conteúdo restrito</p>
      </RequireRoles>,
    );
    expect(screen.queryByText('conteúdo restrito')).not.toBeInTheDocument();
    expect(screen.getByText('home')).toBeInTheDocument();
  });
});
