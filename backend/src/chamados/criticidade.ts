import type { Categoria, Classificacao, Local, Prioridade } from '../contrato.js';

export interface EntradaCriticidade {
  titulo: string;
  descricao: string;
  categoria: Categoria;
  local?: Local;
}

const BASE_CATEGORIA: Record<Categoria, number> = {
  ELETRICA: 30,
  HIDRAULICA: 30,
  CLIMATIZACAO: 25,
  MOBILIARIO: 15,
  ESTRUTURAL: 45,
  OUTROS: 10,
};

const ROTULO_CATEGORIA: Record<Categoria, string> = {
  ELETRICA: 'Elétrica',
  HIDRAULICA: 'Hidráulica',
  CLIMATIZACAO: 'Climatização',
  MOBILIARIO: 'Mobiliário',
  ESTRUTURAL: 'Estrutural',
  OUTROS: 'Outros',
};

interface GrupoTermos {
  termos: string[];
  pontos: number;
}

interface TermoCompilado {
  texto: string;
  regex: RegExp;
}

interface GrupoCompilado {
  termos: TermoCompilado[];
  pontos: number;
}

const GRUPOS: GrupoTermos[] = [
  {
    termos: [
      'fogo',
      'incêndio',
      'fumaça',
      'explosão',
      'cheiro de queimado',
      'queimado',
    ],
    pontos: 50,
  },
  { termos: ['vazamento de gás', 'cheiro de gás', 'gás'], pontos: 50 },
  {
    termos: [
      'choque',
      'curto-circuito',
      'curto circuito',
      'faísca',
      'fiação exposta',
      'fio solto',
      'descarga elétrica',
    ],
    pontos: 50,
  },
  {
    termos: ['vazamento', 'alagamento', 'inundação', 'enchente'],
    pontos: 30,
  },
  {
    termos: [
      'infiltração',
      'teto',
      'laje',
      'marquise',
      'fissura',
      'rachadura',
      'trinca',
      'desabamento',
    ],
    pontos: 30,
  },
  {
    termos: ['elevador', 'escada', 'guarda-corpo', 'varanda', 'grade'],
    pontos: 25,
  },
  {
    termos: ['sem energia', 'falta de energia', 'energia cortada', 'queda de energia'],
    pontos: 15,
  },
  {
    termos: [
      'sem gelar',
      'não gela',
      'não liga',
      'não funciona',
      'barulho forte',
      'estouro',
    ],
    pontos: 15,
  },
  {
    termos: ['urgência', 'urgente', 'emergência', 'perigo', 'risco'],
    pontos: 10,
  },
  {
    termos: ['idoso', 'criança', 'bebê', 'cadeirante', 'pcd', 'berçário', 'hospital'],
    pontos: 10,
  },
  { termos: ['lâmpada queimada', 'lâmpada'], pontos: -15 },
  { termos: ['torneira pingando', 'pingando'], pontos: -10 },
  { termos: ['porta emperrada', 'fechadura', 'dobradiça'], pontos: -5 },
  { termos: ['pilha', 'controle remoto', 'suporte', 'adesivo'], pontos: -10 },
];

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function criarRegex(termo: string): RegExp {
  const escapado = termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escapado}($|[^a-z0-9])`);
}

const GRUPOS_COMPILADOS: GrupoCompilado[] = GRUPOS.map((grupo) => ({
  pontos: grupo.pontos,
  termos: grupo.termos.map((termo) => ({
    texto: termo,
    regex: criarRegex(normalizar(termo)),
  })),
}));

function formatarPontos(pontos: number): string {
  return `${pontos >= 0 ? '+' : ''}${pontos}`;
}

function prioridadeDe(pontuacao: number): Prioridade {
  if (pontuacao >= 75) return 'CRITICA';
  if (pontuacao >= 50) return 'ALTA';
  if (pontuacao >= 25) return 'MEDIA';
  return 'BAIXA';
}

export function classificarChamado(entrada: EntradaCriticidade): Classificacao {
  const base = BASE_CATEGORIA[entrada.categoria];
  const texto = normalizar(
    [
      entrada.titulo,
      entrada.descricao,
      entrada.local?.predio ?? '',
      entrada.local?.andar ?? '',
      entrada.local?.sala ?? '',
    ].join(' '),
  );

  let pontuacao = base;
  const motivos = [
    {
      descricao: `Categoria ${ROTULO_CATEGORIA[entrada.categoria]} (${formatarPontos(base)})`,
      peso: Math.abs(base),
    },
  ];

  for (const grupo of GRUPOS_COMPILADOS) {
    const encontrado = grupo.termos.find((termo) => termo.regex.test(texto));
    if (!encontrado) continue;
    pontuacao += grupo.pontos;
    motivos.push({
      descricao: `Termo "${encontrado.texto}" (${formatarPontos(grupo.pontos)})`,
      peso: Math.abs(grupo.pontos),
    });
  }

  const pontuacaoLimitada = Math.min(100, Math.max(0, pontuacao));

  return {
    prioridadeSugerida: prioridadeDe(pontuacaoLimitada),
    pontuacao: pontuacaoLimitada,
    motivos: motivos
      .sort((a, b) => b.peso - a.peso)
      .slice(0, 4)
      .map((motivo) => motivo.descricao),
  };
}
