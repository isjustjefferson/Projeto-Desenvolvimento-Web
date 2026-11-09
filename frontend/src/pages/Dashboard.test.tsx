import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Chamado, Status, Usuario } from '../types';
import { Dashboard } from './Dashboard';

const estado = vi.hoisted(() => ({
  usuario: null as Usuario | null,
  chamados: [] as Chamado[],
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ usuario: estado.usuario }),
}));

vi.mock('../hooks/useChamados', () => ({
  useChamados: () => ({
    data: estado.chamados,
    isPending: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('../hooks/useUsuarios', () => ({
  useDiretorio: () => ({ nomeUsuario: (id: number) => `Usuário ${id}` }),
}));

function criarChamado(id: number, status: Status, minuto: number): Chamado {
  const data = new Date(Date.UTC(2026, 0, 1, 0, minuto)).toISOString();
  return {
    id,
    titulo: `Chamado ${id}`,
    descricao: '',
    categoria: 'HIDRAULICA',
    local: { predio: 'Bloco A' },
    status,
    prioridade: null,
    criadoPorId: 1,
    prestadorId: null,
    criadoEm: data,
    atualizadoEm: data,
    historico: [],
  };
}

function usuarioDe(role: Usuario['role']): Usuario {
  return { id: 1, nome: 'Fulano', email: 'f@predial.com', role, ativo: true };
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );
}

const fila = () =>
  screen.getByRole('region', { name: 'Fila de Triagem do Síndico' });

beforeEach(() => {
  estado.usuario = usuarioDe('SINDICO');
  estado.chamados = [];
});

describe('Dashboard — fila de triagem', () => {
  it('lista os chamados aguardando aprovação, do mais antigo para o mais novo', () => {
    estado.chamados = [
      criarChamado(1, 'AGUARDANDO_APROVACAO', 30),
      criarChamado(2, 'EM_ANDAMENTO', 10),
      criarChamado(3, 'AGUARDANDO_APROVACAO', 5),
    ];
    renderDashboard();

    const links = within(fila()).getAllByRole('link', { name: /Chamado \d/ });
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/chamados/3',
      '/chamados/1',
    ]);
    expect(within(fila()).getByText('2')).toBeInTheDocument();
  });

  it('mostra no máximo 5 e leva para a lista filtrada', () => {
    estado.chamados = Array.from({ length: 7 }, (_, i) =>
      criarChamado(i + 1, 'AGUARDANDO_APROVACAO', i),
    );
    renderDashboard();

    expect(
      within(fila()).getAllByRole('link', { name: /Chamado \d/ }),
    ).toHaveLength(5);
    expect(
      within(fila()).getByRole('link', { name: /Ver todos/ }),
    ).toHaveAttribute('href', '/chamados?status=AGUARDANDO_APROVACAO');
  });

  it('avisa quando a fila está vazia', () => {
    estado.chamados = [criarChamado(1, 'CONCLUIDO', 0)];
    renderDashboard();
    expect(
      within(fila()).getByText(/Nenhum chamado aguardando aprovação/),
    ).toBeInTheDocument();
  });

  it('não aparece para quem não faz triagem', () => {
    estado.usuario = usuarioDe('CONDOMINO');
    estado.chamados = [criarChamado(1, 'AGUARDANDO_APROVACAO', 0)];
    renderDashboard();
    expect(
      screen.queryByRole('region', { name: 'Fila de Triagem do Síndico' }),
    ).not.toBeInTheDocument();
  });

  it('mostra o nome do perfil no cabeçalho, não o código interno', () => {
    renderDashboard();
    expect(screen.getByText(/Fulano \(Síndico\)/)).toBeInTheDocument();
  });
});
