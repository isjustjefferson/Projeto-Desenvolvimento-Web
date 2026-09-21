import type { Chamado, Status, Usuario } from '../types';

export const usuariosMock: Usuario[] = [
  {
    id: 1,
    nome: 'Ana Souza',
    email: 'ana@predial.com',
    senha: '123456',
    role: 'SOLICITANTE',
    unidade: 'Bloco A, Ap 204',
    setor: 'Apartamento 204',
    ativo: true,
  },
  {
    id: 2,
    nome: 'Carlos Lima',
    email: 'carlos@predial.com',
    senha: '123456',
    role: 'SOLICITANTE',
    unidade: 'Bloco A, Ap 102',
    setor: 'Apartamento 102',
    ativo: true,
  },
  {
    id: 3,
    nome: 'João Eletricista',
    email: 'joao@predial.com',
    senha: '123456',
    role: 'TECNICO',
    especialidade: 'Elétrica',
    setor: 'Manutenção',
    ativo: true,
  },
  {
    id: 4,
    nome: 'Marta Encanadora',
    email: 'marta@predial.com',
    senha: '123456',
    role: 'TECNICO',
    especialidade: 'Hidráulica',
    setor: 'Manutenção',
    ativo: true,
  },
  {
    id: 5,
    nome: 'Ricardo Síndico',
    email: 'ricardo@predial.com',
    senha: '123456',
    role: 'GESTOR',
    setor: 'Administração',
    ativo: true,
  },
  {
    id: 6,
    nome: 'Tiago TI',
    email: 'tiago@predial.com',
    senha: '123456',
    role: 'ADMINISTRADOR',
    setor: 'Tecnologia da Informação',
    ativo: true,
  },
];

export const perfisDemonstracao = [
  { id: 1, nome: 'Ana Souza', role: 'SOLICITANTE' as const },
  { id: 3, nome: 'João Eletricista', role: 'TECNICO' as const },
  { id: 5, nome: 'Ricardo Síndico', role: 'GESTOR' as const },
  { id: 6, nome: 'Tiago TI', role: 'ADMINISTRADOR' as const },
];

const agora = Date.now();
const hora = 3_600_000;
const dia = 24 * hora;

const baseHistorico = (
  id: number,
  usuarioId: number,
  para: Status,
  diasAtras: number,
  de?: Status | null,
) => ({
  id,
  usuarioId,
  de: de ?? null,
  para,
  dataHora: new Date(agora - diasAtras * hora).toISOString(),
});

export const chamadosMock: Chamado[] = [
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
    historico: [
      baseHistorico(8, 1, 'AGUARDANDO_APROVACAO', 8),
    ],
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
