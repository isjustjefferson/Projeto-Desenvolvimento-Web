// Chaves de cache do React Query — a lista usa prefixo, então invalidar
// `chaves.chamados` alcança também `chaves.chamado(id)`. Por isso as mutations
// de detalhe usam `exact: true` quando só a listagem deve ser refetchada.
export const chaves = {
  chamados: ['chamados'] as const,
  chamado: (id: number) => ['chamados', id] as const,
  despesas: (chamadoId: number) => ['chamados', chamadoId, 'despesas'] as const,
  relatorioDespesas: (filtros: string) => ['relatorios', 'despesas', filtros] as const,
  usuarios: ['usuarios'] as const,
  diretorio: ['usuarios', 'resumo'] as const,
};
