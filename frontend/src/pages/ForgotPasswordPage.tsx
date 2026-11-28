import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AuthShell } from '../components/AuthShell';

export function ForgotPasswordPage() {
  return (
    <AuthShell titulo="Recuperar senha" subtitulo="Recupere o acesso à sua conta">
      <p className="mb-4 text-sm text-gray-600">
        A recuperação automática de senha está indisponível. Procure a administração para recuperar o acesso.
      </p>
      <Link
        to="/login"
        className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao login
      </Link>
    </AuthShell>
  );
}
