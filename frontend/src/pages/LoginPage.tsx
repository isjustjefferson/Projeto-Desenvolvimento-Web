import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthShell } from '../components/AuthShell';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');

  const entrar = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    const res = login(email, senha);
    if (!res.ok) {
      setErro(res.erro || 'Não foi possível entrar.');
      return;
    }
    navigate('/', { replace: true });
  };

  return (
    <AuthShell
      titulo="Entrar"
      subtitulo="Acesse sua conta para gerenciar chamados"
    >
      <form onSubmit={entrar} className="space-y-4">
        {erro && (
          <div className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white">
            {erro}
          </div>
        )}

        <div>
          <label className="label" htmlFor="login-email">
            E-mail
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              className="input pl-9"
              placeholder="voce@predial.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="login-senha">
            Senha
          </label>
          <div className="relative">
            <input
              id="login-senha"
              type={mostrarSenha ? 'text' : 'password'}
              autoComplete="current-password"
              className="input pr-10"
              placeholder="••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600"
              onClick={() => setMostrarSenha((v) => !v)}
              aria-label="Mostrar senha"
            >
              {mostrarSenha ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <Link
            to="/forgot-password"
            className="font-medium text-brand-600 hover:underline"
          >
            Esqueci a senha
          </Link>
        </div>

        <button type="submit" className="btn-primary w-full">
          <LogIn className="h-4 w-4" /> Entrar
        </button>

        <p className="text-center text-sm text-gray-600">
          Não tem conta?{' '}
          <Link
            to="/register"
            className="font-semibold text-brand-600 hover:underline"
          >
            Criar conta
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
