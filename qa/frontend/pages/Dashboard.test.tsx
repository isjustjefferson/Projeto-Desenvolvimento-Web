import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Chamado, ResumoChamados, Status, Usuario } from '../../../frontend/src/types';
import { Dashboard } from '../../../frontend/src/pages/Dashboard';

const estado = vi.hoisted(() => ({
  usuario: null as Usuario | null,
  chamados: [] as Chamado[],
}));

vi.mock('../../../frontend/src/context/AuthContext', () => ({
  useAuth: () => ({ usuario: estado.usuario }),
}));

function montarResumo(chamados: Chamado[]): ResumoChamados {
  const porStatus: Partial<Record<Status, number>> = {};
  const porCategoria: Record<string, number> = {};
  const porPrioridadeAtiva = { BAIXA: 0, MEDIA: 0, ALTA: 0, CRITICA: 0 };
  for (const c of chamados) {
    porStatus[c.status] = (porStatus[c.status] ?? 0) + 1;
    porCategoria[c.categoria] = (porCategoria[c.categoria] ?? 0) + 1;
    if (c.status !== 'CONCLUIDO' && c.prioridade) {
      porPrioridadeAtiva[c.prioridade] += 1;
    }
  }
  const concluidos = porStatus.CONCLUIDO ?? 0;
  return {
    total: chamados.length,
    abertos: chamados.length - concluidos,
    concluidos,
    triagem: porStatus.AGUARDANDO_APROVACAO ?? 0,
    porStatus,
    porCategoria,
    porPrioridadeAtiva,
    criticasPendentes: porPrioridadeAtiva.CRITICA,
  };
}

vi.mock('../../../frontend/src/hooks/useChamados', () => ({
  useResumoChamados: () => ({
    data: montarResumo(estado.chamados),
    isPending: false,
    error: null,
    refetch: vi.fn(),
  }),
  useChamados: (filtros: { status?: Status; ordem?: 'asc' | 'desc'; limite?: number } = {}) => {
    const filtrados = estado.chamados
      .filter((c) => !filtros.status || c.status === filtros.status)
      .slice()
      .sort((a, b) => {
        const diff = new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime();
        return filtros.ordem === 'desc' ? -diff : diff;
      });
    const limite = filtros.limite ?? 20;
    return {
      data: {
        chamados: filtrados.slice(0, limite),
        paginacao: {
          pagina: 1,
          limite,
          total: filtrados.length,
          totalPaginas: Math.max(1, Math.ceil(filtrados.length / limite)),
        },
      },
      isPending: false,
      error: null,
      refetch: vi.fn(),
    };
  },
}));

vi.mock('../../../frontend/src/hooks/useUsuarios', () => ({
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
