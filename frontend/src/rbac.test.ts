import { describe, expect, it } from 'vitest';
import {
  chamadosVisiveis,
  especialidadeParaCategoria,
  pode,
  statusVisiveisPorRole,
  tecnicoSemEspecialidade,
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

const solicitante = criarUsuario({ id: 1, role: 'SOLICITANTE' });
const solicitanteOutro = criarUsuario({ id: 2, role: 'SOLICITANTE' });
const tecnicoEletrica = criarUsuario({
  id: 3,
  role: 'TECNICO',
  especialidade: 'Elétrica',
});
const tecnicoSemEspec = criarUsuario({ id: 4, role: 'TECNICO' });
const gestor = criarUsuario({ id: 5, role: 'GESTOR' });
const admin = criarUsuario({ id: 6, role: 'ADMINISTRADOR' });

const base = { criadoPorId: solicitante.id, status: 'EM_ANDAMENTO' } as const;

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

describe('tecnicoSemEspecialidade', () => {
  it('é true só quando o perfil é TECNICO sem especialidade reconhecida', () => {
    expect(tecnicoSemEspecialidade(tecnicoSemEspec)).toBe(true);
    expect(tecnicoSemEspecialidade(tecnicoEletrica)).toBe(false);
    expect(tecnicoSemEspecialidade(gestor)).toBe(false);
    expect(
      tecnicoSemEspecialidade(criarUsuario({ id: 9, role: 'TECNICO', especialidade: 'Zeladoria' })),
    ).toBe(true);
  });
});

describe('pode', () => {
  it('ADMINISTRADOR pode tudo', () => {
    expect(pode('ADMINISTRADOR', 'aprovar')).toBe(true);
    expect(pode('ADMINISTRADOR', 'qualquer-coisa')).toBe(true);
  });

  it('respeita as ações declaradas de cada perfil', () => {
    expect(pode('SOLICITANTE', 'criar')).toBe(true);
    expect(pode('SOLICITANTE', 'aprovar')).toBe(false);
    expect(pode('TECNICO', 'iniciar')).toBe(true);
    expect(pode('TECNICO', 'aprovar')).toBe(false);
    expect(pode('GESTOR', 'aprovar')).toBe(true);
    expect(pode('GESTOR', 'concluir')).toBe(false);
  });
});

describe('statusVisiveisPorRole', () => {
  it('SOLICITANTE não enxerga chamados ainda não aprovados', () => {
    expect(statusVisiveisPorRole.SOLICITANTE).not.toContain('REVISADO');
  });
});

describe('chamadosVisiveis — isolamento por perfil', () => {
  const chamados: Chamado[] = [
    criarChamado({ id: 10, ...base, categoria: 'ELETRICA' }),
    criarChamado({
      id: 11,
      ...base,
      categoria: 'HIDRAULICA',
      criadoPorId: solicitanteOutro.id,
    }),
    criarChamado({
      id: 12,
      status: 'AGUARDANDO_APROVACAO',
      criadoPorId: solicitanteOutro.id,
    }),
    criarChamado({ id: 13, status: 'REVISADO', criadoPorId: solicitanteOutro.id }),
  ];

  it('SOLICITANTE vê apenas os próprios chamados', () => {
    const visiveis = chamadosVisiveis(chamados, solicitante);
    expect(visiveis.map((c) => c.id)).toEqual([10]);
  });

  it('SOLICITANTE não vê chamados de outros usuários', () => {
    const visiveis = chamadosVisiveis(chamados, solicitante);
    expect(visiveis.some((c) => c.criadoPorId !== solicitante.id)).toBe(false);
  });

  it('SOLICITANTE não vê chamados em status que não lhe cabem', () => {
    const visiveis = chamadosVisiveis(chamados, solicitante);
    expect(visiveis.some((c) => c.status === 'REVISADO')).toBe(false);
  });

  it('TECNICO vê os chamados da própria especialidade, mesmo de terceiros', () => {
    const visiveis = chamadosVisiveis(chamados, tecnicoEletrica);
    expect(visiveis.map((c) => c.id)).toEqual([10]);
  });

  it('TECNICO não vê outra categoria, exceto se atribuído a ele', () => {
    const atribuido = criarChamado({
      id: 14,
      ...base,
      categoria: 'HIDRAULICA',
      criadoPorId: solicitanteOutro.id,
      tecnicoId: tecnicoEletrica.id,
    });
    const visiveis = chamadosVisiveis([...chamados, atribuido], tecnicoEletrica);
    expect(visiveis.map((c) => c.id).sort()).toEqual([10, 14]);
  });

  it('TECNICO vê o próprio chamado mesmo fora dos status de atendimento', () => {
    const revisadoAtribuido = criarChamado({
      id: 15,
      status: 'REVISADO',
      categoria: 'ESTRUTURAL',
      criadoPorId: solicitanteOutro.id,
      tecnicoId: tecnicoEletrica.id,
    });
    const visiveis = chamadosVisiveis([revisadoAtribuido], tecnicoEletrica);
    expect(visiveis.map((c) => c.id)).toEqual([15]);
  });

  it('TECNICO sem especialidade só enxerga os chamados atribuídos a ele', () => {
    const atribuido = criarChamado({
      id: 16,
      ...base,
      categoria: 'MOBILIARIO',
      criadoPorId: solicitante.id,
      tecnicoId: tecnicoSemEspec.id,
    });
    const visiveis = chamadosVisiveis([...chamados, atribuido], tecnicoSemEspec);
    expect(visiveis.map((c) => c.id)).toEqual([16]);
  });

  it('GESTOR e ADMINISTRADOR têm visão geral dos status permitidos', () => {
    expect(chamadosVisiveis(chamados, gestor).map((c) => c.id)).toEqual([
      10, 11, 12, 13,
    ]);
    expect(chamadosVisiveis(chamados, admin).map((c) => c.id)).toEqual([
      10, 11, 12, 13,
    ]);
  });

  it('devolve lista vazia quando nada corresponde ao recorte', () => {
    expect(chamadosVisiveis([], solicitante)).toEqual([]);
    const soAguardando = [
      criarChamado({ id: 20, status: 'AGUARDANDO_APROVACAO', criadoPorId: 99 }),
    ];
    expect(chamadosVisiveis(soAguardando, tecnicoEletrica)).toEqual([]);
  });
});
