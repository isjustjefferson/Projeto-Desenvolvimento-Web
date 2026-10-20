import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client';
import * as chamadosApi from '../api/chamados';
import * as usuariosApi from '../api/usuarios';
import { chaves } from '../query/keys';
import { criarQueryClient } from '../query/client';
import type { Chamado, UsuarioResumo } from '../types';
import { useAprovarChamado, useChamado, useChamados } from './useChamados';
import {
  useAlterarCargo,
  useDiretorio,
  useUsuarios,
} from './useUsuarios';
import chamadosFixture from '../api/__fixtures__/chamados.json';
import resumoFixture from '../api/__fixtures__/resumo.json';

vi.mock('../api/chamados', () => ({
  listar: vi.fn(),
  obter: vi.fn(),
  criar: vi.fn(),
  aprovar: vi.fn(),
  iniciar: vi.fn(),
  concluir: vi.fn(),
}));

vi.mock('../api/usuarios', () => ({
  listar: vi.fn(),
  listarResumo: vi.fn(),
  criar: vi.fn(),
  alterarRole: vi.fn(),
  excluir: vi.fn(),
}));

// As queries rodam com sessão ativa — mesma condição do antigo ChamadosContext.
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    usuario: { id: 1, nome: 'Ana Souza', role: 'SOLICITANTE' },
  }),
}));

const lista = chamadosFixture.chamados as unknown as Chamado[];
const resumo = resumoFixture.usuarios as unknown as UsuarioResumo[];

// Usa os mesmos defaults da aplicação (staleTime, retry) para os testes
// exercitarem o comportamento real.
function montar() {
  const queryClient = criarQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useChamados', () => {
  it('carrega a listagem', async () => {
    vi.mocked(chamadosApi.listar).mockResolvedValue(lista);
    const { wrapper } = montar();

    const { result } = renderHook(() => useChamados(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(lista.length);
  });

  it('reaproveita o chamado que já está na listagem, sem buscar de novo', async () => {
    const { queryClient, wrapper } = montar();
    queryClient.setQueryData(chaves.chamados, lista);

    const { result } = renderHook(() => useChamado(1), { wrapper });

    expect(result.current.data?.id).toBe(1);
    expect(chamadosApi.obter).not.toHaveBeenCalled();
  });

  it('busca pelo detalhe quando o id não está em cache', async () => {
    vi.mocked(chamadosApi.obter).mockResolvedValue(lista[0]);
    const { wrapper } = montar();

    const { result } = renderHook(() => useChamado(1), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(chamadosApi.obter).toHaveBeenCalledWith(1);
  });

  it('expõe status 404 para o "não encontrado" da página', async () => {
    vi.mocked(chamadosApi.obter).mockRejectedValue(
      new ApiError('Chamado não encontrado.', 404),
    );
    const { wrapper } = montar();

    const { result } = renderHook(() => useChamado(999), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ApiError).status).toBe(404);
  });

  it('ao aprovar, atualiza o detalhe na hora e invalida a listagem', async () => {
    const aprovado: Chamado = {
      ...lista[0],
      status: 'REVISADO',
      prioridade: 'ALTA',
      tecnicoId: 3,
    };
    vi.mocked(chamadosApi.aprovar).mockResolvedValue(aprovado);
    const { queryClient, wrapper } = montar();
    queryClient.setQueryData(chaves.chamados, lista);
    queryClient.setQueryData(chaves.chamado(aprovado.id), lista[0]);

    const { result } = renderHook(() => useAprovarChamado(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        id: aprovado.id,
        prioridade: 'ALTA',
        tecnicoId: 3,
      });
    });

    expect(queryClient.getQueryData(chaves.chamado(aprovado.id))).toMatchObject(
      { status: 'REVISADO', prioridade: 'ALTA' },
    );
    expect(queryClient.getQueryState(chaves.chamados)?.isInvalidated).toBe(true);
  });
});

describe('useUsuarios e useDiretorio', () => {
  it('não busca a lista completa sem o perfil administrador', () => {
    const { wrapper } = montar();

    const { result } = renderHook(() => useUsuarios(), { wrapper });

    expect(result.current.isPending).toBe(true);
    expect(usuariosApi.listar).not.toHaveBeenCalled();
  });

  it('diretório expõe só os técnicos e resolve nomes', async () => {
    vi.mocked(usuariosApi.listarResumo).mockResolvedValue(resumo);
    const { wrapper } = montar();

    const { result } = renderHook(() => useDiretorio(), { wrapper });

    await waitFor(() => expect(result.current.tecnicos.length).toBeGreaterThan(0));
    expect(result.current.tecnicos.every((t) => t.role === 'TECNICO')).toBe(true);
    expect(result.current.nomeUsuario(3)).toBe('João Eletricista');
    expect(result.current.nomeUsuario(null)).toBe('—');
    expect(result.current.nomeUsuario(9999)).toBe('—');
  });

  it('ao alterar cargo, invalida lista e diretório de uma vez', async () => {
    vi.mocked(usuariosApi.alterarRole).mockResolvedValue({
      id: 2,
      nome: 'Carlos Lima',
      email: 'carlos@predial.com',
      role: 'TECNICO',
      ativo: true,
    });
    const { queryClient, wrapper } = montar();
    // A tela de usuários é quem cria essas queries; sem cache não há o que invalidar.
    queryClient.setQueryData(chaves.usuarios, []);
    queryClient.setQueryData(chaves.diretorio, resumo);

    const { result } = renderHook(() => useAlterarCargo(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ id: 2, role: 'TECNICO' });
    });

    expect(queryClient.getQueryState(chaves.usuarios)?.isInvalidated).toBe(true);
    expect(
      queryClient.getQueryState(chaves.diretorio)?.isInvalidated,
    ).toBe(true);
  });
});
