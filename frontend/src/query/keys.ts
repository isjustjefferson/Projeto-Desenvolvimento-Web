// Chaves de cache do React Query. A raiz `chamados` cobre listas, detalhes e
// resumo; as mutations invalidam listas/resumo sem sobrescrever o detalhe.
export const chaves = {
  chamados: ['chamados'] as const,
  listasChamados: ['chamados', 'lista'] as const,
  listaChamados: (filtros: unknown) =>
    ['chamados', 'lista', filtros] as const,
  chamado: (id: number) => ['chamados', 'detalhe', id] as const,
  resumoChamados: ['chamados', 'resumo'] as const,
  despesas: (chamadoId: number) =>
    ['chamados', 'detalhe', chamadoId, 'despesas'] as const,
  relatorioDespesas: (filtros: string) =>
    ['relatorios', 'despesas', filtros] as const,
  usuarios: ['usuarios'] as const,
  diretorio: ['usuarios', 'resumo'] as const,
};
