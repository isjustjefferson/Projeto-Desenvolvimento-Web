import { describe, expect, it } from 'vitest';
import {
  chamadosVisiveis,
  especialidadeParaCategoria,
  pode,
  statusVisiveisPorRole,
  prestadorSemEspecialidade,
} from './rbac';
import type { Chamado, Usuario } from './types';

function criarUsuario(
  overrides: Partial<Usuario> & Pick<Usuario, 'id' | 'role'>,
): Usuario {
  return {
    nome: `Usuário ${overrides.id}`,
    email: `usuario${overrides.id}@predial.com`,
    ativo: true,
    ...overrides,
  };
}

function criarChamado(
  overrides: Partial<Chamado> & Pick<Chamado, 'id' | 'status' | 'criadoPorId'>,
): Chamado {
  return {
    titulo: `Chamado ${overrides.id}`,
    descricao: 'Descrição do chamado',
    categoria: 'OUTROS',
    local: { predio: 'A' },
    prioridade: null,
    criadoEm: '2026-01-01T10:00:00.000Z',
    atualizadoEm: '2026-01-01T10:00:00.000Z',
    historico: [],
    ...overrides,
  };
}

const condomino = criarUsuario({ id: 1, role: 'CONDOMINO' });
const condominoOutro = criarUsuario({ id: 2, role: 'CONDOMINO' });
const prestadorEletrica = criarUsuario({
  id: 3,
  role: 'PRESTADOR',
  especialidade: 'Elétrica',
});
const prestadorSemEspec = criarUsuario({ id: 4, role: 'PRESTADOR' });
const sindico = criarUsuario({ id: 5, role: 'SINDICO' });
const admin = criarUsuario({ id: 6, role: 'ADMINISTRADOR' });

const base = { criadoPorId: condomino.id, status: 'EM_ANDAMENTO' } as const;

describe('especialidadeParaCategoria', () => {
  it('normaliza acento, caixa e espaços', () => {
    expect(especialidadeParaCategoria('Elétrica')).toBe('ELETRICA');
    expect(especialidadeParaCategoria(' hidraulica ')).toBe('HIDRAULICA');
    expect(especialidadeParaCategoria('CLIMATIZAÇÃO')).toBe('CLIMATIZACAO');
  });

  it('devolve null para especialidade desconhecida ou vazia', () => {
    expect(especialidadeParaCategoria('Geral')).toBeNull();
    expect(especialidadeParaCategoria('')).toBeNull();
    expect(especialidadeParaCategoria(undefined)).toBeNull();
  });
});

describe('prestadorSemEspecialidade', () => {
  it('é true só quando o perfil é PRESTADOR sem especialidade reconhecida', () => {
    expect(prestadorSemEspecialidade(prestadorSemEspec)).toBe(true);
    expect(prestadorSemEspecialidade(prestadorEletrica)).toBe(false);
    expect(prestadorSemEspecialidade(sindico)).toBe(false);
    expect(
      prestadorSemEspecialidade(criarUsuario({ id: 9, role: 'PRESTADOR', especialidade: 'Zeladoria' })),
    ).toBe(true);
  });
});

describe('pode', () => {
  it('ADMINISTRADOR pode tudo', () => {
    expect(pode('ADMINISTRADOR', 'aprovar')).toBe(true);
    expect(pode('ADMINISTRADOR', 'qualquer-coisa')).toBe(true);
  });

  it('respeita as ações declaradas de cada perfil', () => {
    expect(pode('CONDOMINO', 'criar')).toBe(true);
    expect(pode('CONDOMINO', 'aprovar')).toBe(false);
    expect(pode('PRESTADOR', 'iniciar')).toBe(true);
    expect(pode('PRESTADOR', 'aprovar')).toBe(false);
    expect(pode('SINDICO', 'aprovar')).toBe(true);
    expect(pode('SINDICO', 'concluir')).toBe(false);
  });
});

describe('statusVisiveisPorRole', () => {
  it('CONDOMINO não enxerga chamados ainda não aprovados', () => {
    expect(statusVisiveisPorRole.CONDOMINO).not.toContain('REVISADO');
  });
});

describe('chamadosVisiveis — isolamento por perfil', () => {
  const chamados: Chamado[] = [
    criarChamado({ id: 10, ...base, categoria: 'ELETRICA' }),
    criarChamado({
      id: 11,
      ...base,
      categoria: 'HIDRAULICA',
      criadoPorId: condominoOutro.id,
    }),
    criarChamado({
      id: 12,
      status: 'AGUARDANDO_APROVACAO',
      criadoPorId: condominoOutro.id,
    }),
    criarChamado({ id: 13, status: 'REVISADO', criadoPorId: condominoOutro.id }),
  ];

  it('CONDOMINO vê apenas os próprios chamados', () => {
    const visiveis = chamadosVisiveis(chamados, condomino);
    expect(visiveis.map((c) => c.id)).toEqual([10]);
  });

  it('CONDOMINO não vê chamados de outros usuários', () => {
    const visiveis = chamadosVisiveis(chamados, condomino);
    expect(visiveis.some((c) => c.criadoPorId !== condomino.id)).toBe(false);
  });

  it('CONDOMINO não vê chamados em status que não lhe cabem', () => {
    const visiveis = chamadosVisiveis(chamados, condomino);
    expect(visiveis.some((c) => c.status === 'REVISADO')).toBe(false);
  });

  it('PRESTADOR vê os chamados da própria especialidade, mesmo de terceiros', () => {
    const visiveis = chamadosVisiveis(chamados, prestadorEletrica);
    expect(visiveis.map((c) => c.id)).toEqual([10]);
  });

  it('PRESTADOR não vê outra categoria, exceto se atribuído a ele', () => {
    const atribuido = criarChamado({
      id: 14,
      ...base,
      categoria: 'HIDRAULICA',
      criadoPorId: condominoOutro.id,
      prestadorId: prestadorEletrica.id,
    });
    const visiveis = chamadosVisiveis([...chamados, atribuido], prestadorEletrica);
    expect(visiveis.map((c) => c.id).sort()).toEqual([10, 14]);
  });

  it('PRESTADOR vê o próprio chamado mesmo fora dos status de atendimento', () => {
    const revisadoAtribuido = criarChamado({
      id: 15,
      status: 'REVISADO',
      categoria: 'ESTRUTURAL',
      criadoPorId: condominoOutro.id,
      prestadorId: prestadorEletrica.id,
    });
    const visiveis = chamadosVisiveis([revisadoAtribuido], prestadorEletrica);
    expect(visiveis.map((c) => c.id)).toEqual([15]);
  });

  it('PRESTADOR sem especialidade só enxerga os chamados atribuídos a ele', () => {
    const atribuido = criarChamado({
      id: 16,
      ...base,
      categoria: 'MOBILIARIO',
      criadoPorId: condomino.id,
      prestadorId: prestadorSemEspec.id,
    });
    const visiveis = chamadosVisiveis([...chamados, atribuido], prestadorSemEspec);
    expect(visiveis.map((c) => c.id)).toEqual([16]);
  });

  it('SINDICO e ADMINISTRADOR têm visão geral dos status permitidos', () => {
    expect(chamadosVisiveis(chamados, sindico).map((c) => c.id)).toEqual([
      10, 11, 12, 13,
    ]);
    expect(chamadosVisiveis(chamados, admin).map((c) => c.id)).toEqual([
      10, 11, 12, 13,
    ]);
  });

  it('devolve lista vazia quando nada corresponde ao recorte', () => {
    expect(chamadosVisiveis([], condomino)).toEqual([]);
    const soAguardando = [
      criarChamado({ id: 20, status: 'AGUARDANDO_APROVACAO', criadoPorId: 99 }),
    ];
    expect(chamadosVisiveis(soAguardando, prestadorEletrica)).toEqual([]);
  });
});
