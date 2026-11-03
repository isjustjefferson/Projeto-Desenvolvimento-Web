import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Chamado, Status, Usuario } from '../types';
import { ChamadosLista } from './ChamadosLista';

const estado = vi.hoisted(() => ({
  usuario: null as Usuario | null,
  chamados: [] as Chamado[],
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ usuario: estado.usuario }),
}));

vi.mock('../hooks/useChamados', () => ({
  useChamados: () => ({ data: estado.chamados, isPending: false, error: null }),
}));

vi.mock('../hooks/useUsuarios', () => ({
  useDiretorio: () => ({ nomeUsuario: (id: number) => `Usuário ${id}` }),
}));

function criarChamado(id: number, status: Status = 'EM_ANDAMENTO'): Chamado {
  // Ids maiores são mais recentes: a lista ordena do mais novo para o mais antigo
  const data = new Date(Date.UTC(2026, 0, 1, 0, id)).toISOString();
  return {
    id,
    titulo: `Chamado ${id}`,
    descricao: `Descrição ${id}`,
    categoria: 'ELETRICA',
    local: { predio: 'Bloco A' },
    status,
    prioridade: 'MEDIA',
    criadoPorId: 1,
    prestadorId: null,
    criadoEm: data,
    atualizadoEm: data,
    historico: [],
  };
}

const sindico: Usuario = {
  id: 5,
  nome: 'Ricardo',
  email: 'ricardo@predial.com',
  role: 'SINDICO',
  ativo: true,
};

function renderLista(url = '/chamados') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <ChamadosLista />
    </MemoryRouter>,
  );
}

const titulos = () =>
  screen
    .getAllByRole('link', { name: /Chamado \d+/ })
    .map((l) => within(l).getByText(/^Chamado \d+$/).textContent);

beforeEach(() => {
  estado.usuario = sindico;
  estado.chamados = [];
  localStorage.clear();
});

describe('ChamadosLista — paginação', () => {
  it('mostra 8 chamados por página e navega entre as páginas', async () => {
    const usuario = userEvent.setup();
    estado.chamados = Array.from({ length: 12 }, (_, i) => criarChamado(i + 1));
    renderLista();

    expect(titulos()).toHaveLength(8);
    expect(titulos()[0]).toBe('Chamado 12');
    expect(screen.getByText(/Página 1 de 2/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Anterior/ })).toBeDisabled();

    await usuario.click(screen.getByRole('button', { name: /Próxima/ }));

    expect(titulos()).toEqual(['Chamado 4', 'Chamado 3', 'Chamado 2', 'Chamado 1']);
    expect(screen.getByText(/Página 2 de 2/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Próxima/ })).toBeDisabled();
  });

  it('volta para a primeira página ao filtrar', async () => {
    const usuario = userEvent.setup();
    estado.chamados = Array.from({ length: 12 }, (_, i) => criarChamado(i + 1));
    renderLista();

    await usuario.click(screen.getByRole('button', { name: /Próxima/ }));
    expect(screen.getByText(/Página 2 de 2/)).toBeInTheDocument();

    // A busca casa com todos: continua havendo 2 páginas, mas volta para a 1ª
    await usuario.type(screen.getByPlaceholderText(/Buscar/), 'Descrição');

    expect(screen.getByText(/Página 1 de 2/)).toBeInTheDocument();
    expect(titulos()[0]).toBe('Chamado 12');
  });

  it('esconde a paginação quando tudo cabe em uma página', () => {
    // 8 é o limite exato de uma página: ainda não pagina
    estado.chamados = Array.from({ length: 8 }, (_, i) => criarChamado(i + 1));
    renderLista();
    expect(
      screen.queryByRole('button', { name: /Próxima/ }),
    ).not.toBeInTheDocument();
  });
});

describe('ChamadosLista — visualização', () => {
  it('alterna entre cards e lista compacta e lembra a escolha', async () => {
    const usuario = userEvent.setup();
    estado.chamados = [criarChamado(1)];
    const { unmount } = renderLista();

    const cards = screen.getByRole('button', { name: 'Visualização em cards' });
    const lista = screen.getByRole('button', { name: 'Visualização em lista' });
    expect(cards).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Descrição 1')).toBeInTheDocument();

    await usuario.click(lista);

    expect(lista).toHaveAttribute('aria-pressed', 'true');
    // A lista compacta não repete a descrição do chamado
    expect(screen.queryByText('Descrição 1')).not.toBeInTheDocument();
    expect(screen.getByText('Chamado 1')).toBeInTheDocument();

    unmount();
    renderLista();
    expect(
      screen.getByRole('button', { name: 'Visualização em lista' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('ChamadosLista — filtro pela URL', () => {
  it('aplica o status vindo de ?status=', () => {
    estado.chamados = [
      criarChamado(1, 'AGUARDANDO_APROVACAO'),
      criarChamado(2, 'EM_ANDAMENTO'),
    ];
    renderLista('/chamados?status=AGUARDANDO_APROVACAO');

    expect(titulos()).toEqual(['Chamado 1']);
    expect(
      screen.getByDisplayValue('Aguardando Aprovação'),
    ).toBeInTheDocument();
  });

  it('ignora status inválido ou não visível ao perfil', () => {
    estado.chamados = [criarChamado(1, 'EM_ANDAMENTO')];
    renderLista('/chamados?status=QUALQUER');
    expect(titulos()).toEqual(['Chamado 1']);
  });
});
