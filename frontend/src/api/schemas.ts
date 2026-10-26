// Schemas Zod dos payloads da API: fonte única da verdade dos tipos de
// resposta. Espelham backend/src/contrato.ts e foram conferidos contra payloads
// reais capturados da API rodando (src/api/__fixtures__/*.json).
//
// Por quê: o backend é mantido por outra equipe e ainda muda. Sem validação,
// client.ts fazia `res.json() as T` e um campo renomeado quebrava a UI em
// silêncio. Agora resposta fora do contrato lança ApiError(500) e loga os
// issues no console.
//
// Campos opcionais do contrato usam `nullish()` (ausente OU null): o backend em
// memória serializa alguns como null (ex.: tecnicoId de chamado recém-criado).
// Campos extras são descartados (padrão do z.object), porque adicionar campo é
// mudança compatível; o que derruba é campo faltando ou com tipo errado.
import { z } from 'zod';

export const ROLE_VALUES = [
  'SOLICITANTE',
  'TECNICO',
  'GESTOR',
  'ADMINISTRADOR',
] as const;

export const STATUS_VALUES = [
  'AGUARDANDO_APROVACAO',
  'REVISADO',
  'EM_ANDAMENTO',
  'CONCLUIDO',
] as const;

export const PRIORIDADE_VALUES = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'] as const;

export const CATEGORIA_VALUES = [
  'ELETRICA',
  'HIDRAULICA',
  'CLIMATIZACAO',
  'MOBILIARIO',
  'ESTRUTURAL',
  'OUTROS',
] as const;

export const roleSchema = z.enum(ROLE_VALUES);
export const statusSchema = z.enum(STATUS_VALUES);
export const prioridadeSchema = z.enum(PRIORIDADE_VALUES);
export const categoriaSchema = z.enum(CATEGORIA_VALUES);

const classificacaoSchema = z.object({
  prioridadeSugerida: prioridadeSchema,
  pontuacao: z.number(),
  motivos: z.array(z.string()),
});

const localSchema = z.object({
  predio: z.string(),
  andar: z.string().nullish(),
  sala: z.string().nullish(),
});

const historicoSchema = z.object({
  id: z.number(),
  usuarioId: z.number(),
  de: statusSchema.nullish(),
  para: statusSchema,
  dataHora: z.string(),
  observacao: z.string().nullish(),
});

const solucaoSchema = z.object({
  descricao: z.string(),
  materiais: z.string(),
});

export const chamadoSchema = z.object({
  id: z.number(),
  titulo: z.string(),
  descricao: z.string(),
  categoria: categoriaSchema,
  local: localSchema,
  status: statusSchema,
  prioridade: prioridadeSchema.nullable(),
  classificacao: classificacaoSchema.nullish(),
  foto: z.string().nullish(),
  criadoPorId: z.number(),
  tecnicoId: z.number().nullish(),
  criadoEm: z.string(),
  atualizadoEm: z.string(),
  historico: z.array(historicoSchema),
  solucao: solucaoSchema.nullish(),
});

export const usuarioSchema = z.object({
  id: z.number(),
  nome: z.string(),
  email: z.string(),
  role: roleSchema,
  unidade: z.string().nullish(),
  especialidade: z.string().nullish(),
  setor: z.string().nullish(),
  ativo: z.boolean(),
  foto: z.string().nullish(),
  criadoEm: z.string().nullish(),
});

export const usuarioResumoSchema = z.object({
  id: z.number(),
  nome: z.string(),
  role: roleSchema,
  especialidade: z.string().nullish(),
});

const okLiteral = z.literal(true);

export const respostaOkSchema = z.object({ ok: okLiteral });

export const respostaTokenSchema = z.object({
  ok: okLiteral,
  token: z.string(),
});

export const respostaUsuarioSchema = z.object({
  ok: okLiteral,
  usuario: usuarioSchema,
});

export const respostaUsuariosSchema = z.object({
  ok: okLiteral,
  usuarios: z.array(usuarioSchema),
});

export const respostaResumoSchema = z.object({
  ok: okLiteral,
  usuarios: z.array(usuarioResumoSchema),
});

export const respostaChamadoSchema = z.object({
  ok: okLiteral,
  chamado: chamadoSchema,
});

export const respostaChamadosSchema = z.object({
  ok: okLiteral,
  chamados: z.array(chamadoSchema),
});
