import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center">
      <span className="inline-flex rounded-2xl bg-brand-100 p-4 text-brand-600">
        <Compass className="h-10 w-10" />
      </span>
      <p className="text-6xl font-bold text-gray-900">404</p>
      <h1 className="text-xl font-semibold text-gray-800">
        Página não encontrada
      </h1>
      <p className="max-w-md text-sm text-gray-500">
        O endereço que você acessou não existe ou foi movido.
      </p>
      <Link to="/" className="btn-primary">
        Ir para o Dashboard
      </Link>
    </div>
  );
}
