import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { AuthShell } from '../components/AuthShell';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErro('Informe um e-mail válido.');
      return;
    }
    // Simulação de envio do link de recuperação (sem backend)
    sessionStorage.setItem('predial.resetEmail', email.trim());
    setEnviado(true);
  };

  return (
    <AuthShell
      titulo="Esqueci a senha"
      subtitulo="Recupere o acesso à sua conta"
    >
      {enviado ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-emerald-500 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-white" />
            <p className="text-sm text-white">
              Se o e-mail informado existir, enviamos um link de redefinição de
              senha para <strong>{email.trim()}</strong>. Verifique sua caixa de
              entrada.
            </p>
          </div>
          <Link
            to="/reset-password"
            className="btn-primary w-full"
          >
            Continuar para redefinição
          </Link>
          <Link
            to="/login"
            className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao login
          </Link>
        </div>
      ) : (
        <form onSubmit={enviar} className="space-y-4">
          <p className="text-sm text-gray-600">
            Informe seu e-mail cadastrado e enviaremos um código/link para
            redefinir sua senha.
          </p>
          {erro && (
            <div className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white">
              {erro}
            </div>
          )}
          <div>
            <label className="label" htmlFor="forgot-email">
              E-mail
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                className="input pl-9"
                placeholder="voce@predial.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full">
            <Send className="h-4 w-4" /> Enviar solicitação
          </button>
          <Link
            to="/login"
            className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao login
          </Link>
        </form>
      )}
    </AuthShell>
  );
}
