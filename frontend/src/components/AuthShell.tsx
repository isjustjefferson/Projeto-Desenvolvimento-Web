import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';

export function AuthShell({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-700 to-brand-900 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <Link to="/login" className="mb-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
              <Building2 className="h-8 w-8" />
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Gestão Predial</h1>
          <p className="mt-1 text-sm text-gray-500">{subtitulo}</p>
        </div>

        <h2 className="mb-4 text-lg font-semibold text-gray-800">{titulo}</h2>

        {children}
      </div>
    </div>
  );
}
