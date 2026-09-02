import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, User, Home, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthShell } from '../components/AuthShell';

export function RegisterPage() {
  const { registrar } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [unidade, setUnidade] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (senha !== confirmar) {
      setErro('As senhas não coincidem.');
      return;
    }
    const res = registrar({ nome, email, unidade, senha });
    if (!res.ok) {
      setErro(res.erro || 'Não foi possível criar a conta.');
      return;
    }
    navigate('/', { replace: true });
  };

  const inputProps = (value: string, set: (v: string) => void) => ({
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(e.target.value),
  });

  return (
    <AuthShell
      titulo="Criar conta"
      subtitulo="Cadastre-se como Solicitante / Morador"
    >
      <form onSubmit={enviar} className="space-y-4">
        {erro && (
          <div className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white">
            {erro}
          </div>
        )}

        <div>
          <label className="label" htmlFor="reg-nome">
            Nome completo
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="reg-nome"
              className="input pl-9"
              placeholder="Seu nome completo"
              {...inputProps(nome, setNome)}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="reg-email">
            E-mail
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              className="input pl-9"
              placeholder="voce@email.com"
              {...inputProps(email, setEmail)}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="reg-unidade">
            Unidade / Bloco
          </label>
          <div className="relative">
            <Home className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="reg-unidade"
              className="input pl-9"
              placeholder="Ex.: Bloco A, Ap 204"
              {...inputProps(unidade, setUnidade)}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="reg-senha">
            Senha
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="reg-senha"
              type={mostrarSenha ? 'text' : 'password'}
              autoComplete="new-password"
              className="input pl-9 pr-10"
              placeholder="Mínimo 6 caracteres"
              {...inputProps(senha, setSenha)}
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
          <label className="label" htmlFor="reg-confirmar">
            Confirmar senha
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="reg-confirmar"
              type={mostrarSenha ? 'text' : 'password'}
              autoComplete="new-password"
              className="input pl-9"
              placeholder="Repita a senha"
              {...inputProps(confirmar, setConfirmar)}
            />
          </div>
        </div>

        <button type="submit" className="btn-primary w-full">
          Criar conta
        </button>

        <p className="text-center text-sm text-gray-600">
          Já tem conta?{' '}
          <Link
            to="/login"
            className="font-semibold text-brand-600 hover:underline"
          >
            Entrar
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
