import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthShell } from '../components/AuthShell';

export function ResetPasswordPage() {
  const { redefinirSenha } = useAuth();
  const navigate = useNavigate();
  const [token] = useState<string>(
    () => sessionStorage.getItem('predial.resetToken') || '',
  );
  const [email] = useState<string>(
    () => sessionStorage.getItem('predial.resetEmail') || '',
  );

  if (!token) {
    return <Navigate to="/forgot-password" replace />;
  }

  return (
    <ResetForm
      email={email}
      onConfirm={(novaSenha) => redefinirSenha(token, novaSenha)}
      onSuccess={() => {
        sessionStorage.removeItem('predial.resetToken');
        sessionStorage.removeItem('predial.resetEmail');
      }}
      onDone={() => navigate('/login', { replace: true })}
    />
  );
}

function ResetForm({
  email,
  onConfirm,
  onSuccess,
  onDone,
}: {
  email: string;
  onConfirm: (novaSenha: string) => Promise<{ ok: boolean; erro?: string }>;
  onSuccess: () => void;
  onDone: () => void;
}) {
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (senha.length < 6) {
      setErro('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (senha !== confirmar) {
      setErro('As senhas não coincidem.');
      return;
    }
    setEnviando(true);
    const res = await onConfirm(senha);
    setEnviando(false);
    if (!res.ok) {
      setErro(res.erro || 'Não foi possível redefinir a senha.');
      return;
    }
    onSuccess();
    setConcluido(true);
    setTimeout(onDone, 2000);
  };

  if (concluido) {
    return (
      <AuthShell
        titulo="Redefinição concluída"
        subtitulo="Gestão Predial"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          <p className="text-sm text-gray-600">
            Sua senha foi redefinida com sucesso. Redirecionando para o login…
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      titulo="Redefinir senha"
      subtitulo="Defina uma nova senha para sua conta"
    >
      <form onSubmit={enviar} className="space-y-4">
        {email && (
          <p className="text-sm text-gray-600">
            Redefinindo a senha de <strong>{email}</strong>.
          </p>
        )}
        {erro && (
          <div className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white">
            {erro}
          </div>
        )}

        <div>
          <label className="label" htmlFor="reset-senha">
            Nova senha
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="reset-senha"
              type={mostrarSenha ? 'text' : 'password'}
              autoComplete="new-password"
              className="input pl-9 pr-10"
              placeholder="Mínimo 6 caracteres"
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

        <div>
          <label className="label" htmlFor="reset-confirmar">
            Confirmar nova senha
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="reset-confirmar"
              type={mostrarSenha ? 'text' : 'password'}
              autoComplete="new-password"
              className="input pl-9"
              placeholder="Repita a nova senha"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={enviando}>
          {enviando ? 'Redefinindo…' : 'Confirmar nova senha'}
        </button>
      </form>
    </AuthShell>
  );
}
