import { useQuery } from '@tanstack/react-query';
import { relatorioDespesas, type FiltrosRelatorioDespesas } from '../api/relatorios';
import { chaves } from '../query/keys';
import { useAuth } from '../context/AuthContext';

export function useRelatorioDespesas(filtros: FiltrosRelatorioDespesas) {
  const { usuario } = useAuth();
  const chave = JSON.stringify(filtros);
  return useQuery({
    queryKey: chaves.relatorioDespesas(chave),
    queryFn: () => relatorioDespesas(filtros),
    enabled: Boolean(usuario && (usuario.role === 'GESTOR' || usuario.role === 'ADMINISTRADOR')),
  });
}
