import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { UsuarioResumo } from '../types';
import { useAuth } from './AuthContext';
import * as usuariosApi from '../api/usuarios';

interface DiretorioContextValue {
  usuarios: UsuarioResumo[];
  tecnicos: UsuarioResumo[];
  nomeUsuario: (id: number | null | undefined) => string;
  recarregar: () => Promise<void>;
}

const DiretorioContext = createContext<DiretorioContextValue | undefined>(
  undefined,
);

export function DiretorioProvider({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);

  const recarregar = useCallback(async () => {
    try {
      setUsuarios(await usuariosApi.listarResumo());
    } catch {
      // silencioso: o diretório é apenas apoio de exibição
    }
  }, []);

  useEffect(() => {
    if (!usuario) {
      setUsuarios([]);
      return;
    }
    void recarregar();
  }, [usuario, recarregar]);

  const value = useMemo<DiretorioContextValue>(
    () => ({
      usuarios,
      tecnicos: usuarios.filter((u) => u.role === 'TECNICO'),
      nomeUsuario: (id) =>
        id ? usuarios.find((u) => u.id === id)?.nome || '—' : '—',
      recarregar,
    }),
    [usuarios, recarregar],
  );

  return (
    <DiretorioContext.Provider value={value}>
      {children}
    </DiretorioContext.Provider>
  );
}

export function useDiretorio(): DiretorioContextValue {
  const ctx = useContext(DiretorioContext);
  if (!ctx) {
    throw new Error('useDiretorio deve ser usado dentro de DiretorioProvider');
  }
  return ctx;
}
