import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/client';

// Instância única da aplicação. Cada teste cria a sua (ver hooks.test.tsx).
export function criarQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Dados mudam pouco e as mutações já invalidam o que interessa.
        staleTime: 30_000,
        // Erro de aplicação (4xx: sem permissão, não encontrado) não resolve
        // repetindo a chamada; rede e 5xx sim, até 2 tentativas.
        retry: (tentativas, erro) =>
          !(erro instanceof ApiError && erro.status < 500) && tentativas < 2,
      },
    },
  });
}
