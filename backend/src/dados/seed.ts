import bcrypt from 'bcrypt';
import type { Chamado, Historico, Status, UsuarioPublico } from '../contrato.js';

// Usuario interno de armazenamento: guarda o hash, nunca a senha em texto.
export interface UsuarioInterno extends UsuarioPublico {
  senhaHash: string;
}

export const senhaPadrao = '123456';

const SALT_ROUNDS = 10;
function hash(senha: string): string {
  return bcrypt.hashSync(senha, SALT_ROUNDS);
}

function usuario(
  id: number,
  nome: string,
  email: string,
  role: UsuarioPublico['role'],
  extras: Partial<UsuarioPublico> = {},
): UsuarioInterno {
  return {
    id,
    nome,
    email,
    role,
    ativo: true,
    ...extras,
    senhaHash: hash(senhaPadrao),
  };
}

// Replica os 6 usuários de demonstração do frontend/src/data/mock.ts
export const usuariosSeed: UsuarioInterno[] = [
  usuario(1, 'Ana Souza', 'ana@predial.com', 'SOLICITANTE', {
    unidade: 'Bloco A, Ap 204',
    setor: 'Apartamento 204',
  }),
  usuario(2, 'Carlos Lima', 'carlos@predial.com', 'SOLICITANTE', {
    unidade: 'Bloco A, Ap 102',
    setor: 'Apartamento 102',
  }),
  usuario(3, 'João Eletricista', 'joao@predial.com', 'TECNICO', {
    especialidade: 'Elétrica',
    setor: 'Manutenção',
  }),
  usuario(4, 'Marta Encanadora', 'marta@predial.com', 'TECNICO', {
    especialidade: 'Hidráulica',
    setor: 'Manutenção',
  }),
  usuario(5, 'Ricardo Síndico', 'ricardo@predial.com', 'GESTOR', {
    setor: 'Administração',
  }),
  usuario(6, 'Tiago TI', 'tiago@predial.com', 'ADMINISTRADOR', {
    setor: 'Tecnologia da Informação',
  }),
];

// Mesma base de tempo do mock do front (datas relativas à inicialização)
const agora = Date.now();
const hora = 3_600_000;
const dia = 24 * hora;

function baseHistorico(
  id: number,
  usuarioId: number,
  para: Status,
  horasAtras: number,
  de?: Status | null,
): Historico {
  return {
    id,
    usuarioId,
    de: de ?? null,
    para,
    dataHora: new Date(agora - horasAtras * hora).toISOString(),
  };
}

// Replica os 5 chamados do frontend/src/data/mock.ts (ids e histórico idênticos)
export const chamadosSeed: Chamado[] = [
  {
    id: 1,
    titulo: 'Tomada sem energia',
    descricao:
      'A tomada da sala de estar do ap 204 não funciona. Já testei outros aparelhos e nenhum funciona.',
    categoria: 'ELETRICA',
    local: { predio: 'Bloco A', andar: '2º andar', sala: '204' },
    status: 'CONCLUIDO',
    prioridade: 'MEDIA',
    criadoPorId: 1,
    tecnicoId: 3,
    criadoEm: new Date(agora - 5 * dia).toISOString(),
    atualizadoEm: new Date(agora - 3 * dia).toISOString(),
    historico: [
      baseHistorico(1, 1, 'CONCLUIDO', 5 * 24),
      baseHistorico(2, 3, 'EM_ANDAMENTO', 4 * 24, 'REVISADO'),
      baseHistorico(3, 5, 'REVISADO', 4 * 24, 'AGUARDANDO_APROVACAO'),
      baseHistorico(4, 1, 'AGUARDANDO_APROVACAO', 5 * 24),
    ],
    solucao: {
      descricao: 'Tomada trocada por uma nova, fiação revisada.',
      materiais: '1 tomada 2P+T, fita isolante',
    },
  },
  {
    id: 2,
    titulo: 'Vazamento no banheiro',
    descricao:
      'Há um vazamento constante embaixo da pia do banheiro do ap 102.',
    categoria: 'HIDRAULICA',
    local: { predio: 'Bloco A', andar: '1º andar', sala: '102' },
    status: 'EM_ANDAMENTO',
    prioridade: 'ALTA',
    criadoPorId: 2,
    tecnicoId: 4,
    criadoEm: new Date(agora - 2 * dia).toISOString(),
    atualizadoEm: new Date(agora - 6 * hora).toISOString(),
    historico: [
      baseHistorico(5, 4, 'EM_ANDAMENTO', 6, 'REVISADO'),
      baseHistorico(6, 5, 'REVISADO', 2 * 24, 'AGUARDANDO_APROVACAO'),
      baseHistorico(7, 2, 'AGUARDANDO_APROVACAO', 2 * 24),
    ],
  },
  {
    id: 3,
    titulo: 'Ar-condicionado sem gelar',
    descricao:
      'O ar-condicionado do corredor do 2º andar liga mas não está gelando.',
    categoria: 'CLIMATIZACAO',
    local: { predio: 'Bloco A', andar: '2º andar', sala: 'Corredor' },
    status: 'AGUARDANDO_APROVACAO',
    prioridade: 'MEDIA',
    criadoPorId: 1,
    tecnicoId: null,
    criadoEm: new Date(agora - 8 * hora).toISOString(),
    atualizadoEm: new Date(agora - 8 * hora).toISOString(),
    historico: [baseHistorico(8, 1, 'AGUARDANDO_APROVACAO', 8)],
  },
  {
    id: 4,
    titulo: 'Cadeira quebrada',
    descricao:
      'Uma cadeira da recepção quebrou o encosto e precisa de conserto ou substituição.',
    categoria: 'MOBILIARIO',
    local: { predio: 'Bloco B', andar: 'Térreo', sala: 'Recepção' },
    status: 'REVISADO',
    prioridade: 'BAIXA',
    criadoPorId: 2,
    tecnicoId: null,
    criadoEm: new Date(agora - 3 * dia).toISOString(),
    atualizadoEm: new Date(agora - 1 * dia).toISOString(),
    historico: [
      baseHistorico(9, 5, 'REVISADO', 24, 'AGUARDANDO_APROVACAO'),
      baseHistorico(10, 2, 'AGUARDANDO_APROVACAO', 3 * 24),
    ],
  },
  {
    id: 5,
    titulo: 'Infiltração no teto',
    descricao:
      'Mancha de infiltração crescendo no teto do corredor do 1º andar.',
    categoria: 'ESTRUTURAL',
    local: { predio: 'Bloco A', andar: '1º andar', sala: 'Corredor' },
    status: 'AGUARDANDO_APROVACAO',
    prioridade: 'CRITICA',
    criadoPorId: 1,
    tecnicoId: null,
    criadoEm: new Date(agora - 5 * hora).toISOString(),
    atualizadoEm: new Date(agora - 5 * hora).toISOString(),
    historico: [baseHistorico(11, 1, 'AGUARDANDO_APROVACAO', 5)],
  },
];