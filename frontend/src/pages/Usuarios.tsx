import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Lock,
  Shield,
  ShieldCheck,
  Trash2,
  UserRoundPlus,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDiretorio } from '../context/DiretorioContext';
import * as usuariosApi from '../api/usuarios';
import { ApiError } from '../api/client';
import { roleColor, roleLabel } from '../helpers';
import { Modal } from '../components/Modal';
import type { Role, Usuario } from '../types';

const roles: Role[] = ['SOLICITANTE', 'TECNICO', 'GESTOR', 'ADMINISTRADOR'];

// Cargos que o admin pode atribuir a um morador (o base "Solicitante" é o padrão)
const cargosPromoviveis: Role[] = ['TECNICO', 'GESTOR', 'ADMINISTRADOR'];

function mensagemErro(erro: unknown): string {
  if (erro instanceof ApiError) return erro.message;
  return 'Não foi possível concluir a operação.';
}

function LinhaMorador({
  m,
  definirCargo,
  removerCargo,
  excluir,
}: {
  m: Usuario;
  definirCargo: (id: number, role: Role) => void;
  removerCargo: (id: number) => void;
  excluir: (id: number) => void;
}) {
  const [novoCargo, setNovoCargo] = useState<Role>('TECNICO');
  const promovido = m.role !== 'SOLICITANTE';

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {m.foto ? (
            <img
              src={m.foto}
              alt="Foto"
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
              {m.nome.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div>
            <div className="font-medium text-gray-800">{m.nome}</div>
            <div className="text-xs text-gray-400">{m.email}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${roleColor[m.role]}`}
        >
          {promovido && <BadgeCheck className="h-3 w-3" />}
          {roleLabel[m.role]}
        </span>
        {!promovido && (
          <div className="mt-1 text-[11px] text-gray-400">cargo base</div>
        )}
      </td>
      <td className="px-4 py-3 text-gray-500">
        {m.unidade || m.setor || '—'}
      </td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            m.ativo ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'
          }`}
        >
          {m.ativo ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <select
              className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40"
              value={novoCargo}
              onChange={(e) => setNovoCargo(e.target.value as Role)}
            >
              {cargosPromoviveis.map((r) => (
                <option key={r} value={r}>
                  {roleLabel[r]}
                </option>
              ))}
            </select>
            <button
              onClick={() => definirCargo(m.id, novoCargo)}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-500 hover:text-white hover:border-emerald-500"
              title="Atribuir cargo"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Atribuir
            </button>
          </div>
          {promovido && (
            <button
              onClick={() => removerCargo(m.id)}
              className="flex items-center gap-1.5 rounded-lg border border-amber-300 px-2.5 py-1.5 text-xs font-semibold text-amber-600 transition hover:bg-amber-500 hover:text-white hover:border-amber-500"
              title="Remover cargo (volta a Solicitante)"
            >
              <UserRoundPlus className="h-3.5 w-3.5 rotate-180" /> Remover cargo
            </button>
          )}
          <button
            onClick={() => excluir(m.id)}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-500 hover:text-white hover:border-red-500"
            title="Excluir conta"
          >
            <Trash2 className="h-3.5 w-3.5" /> Excluir
          </button>
        </div>
      </td>
    </tr>
  );
}

export function Usuarios() {
  const {
    usuario,
    criarUsuario,
    definirCargo,
    removerCargo,
    excluirContaPorId,
  } = useAuth();
  const { recarregar: recarregarDiretorio } = useDiretorio();
  const [lista, setLista] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [modal, setModal] = useState(false);
  const [nome, setNome] = useState('');
  const [role, setRole] = useState<Role>('SOLICITANTE');
  const [especialidade, setEspecialidade] = useState('');
  const [setor, setSetor] = useState('');
  const [erroCriar, setErroCriar] = useState('');

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      setLista(await usuariosApi.listar());
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setCarregando(false);
    }
  }, []);

  const ehAdmin = usuario?.role === 'ADMINISTRADOR';

  useEffect(() => {
    if (ehAdmin) void recarregar();
  }, [ehAdmin, recarregar]);

  async function executarAcao(
    operacao: () => Promise<{ ok: boolean; erro?: string }>,
  ) {
    setErro('');
    const res = await operacao();
    if (!res.ok) {
      setErro(res.erro || 'Operação não concluída.');
      return;
    }
    await recarregar();
    await recarregarDiretorio();
  }

  if (!ehAdmin) {
    return (
      <div className="card flex flex-col items-center gap-2 py-12 text-center">
        <Lock className="h-8 w-8 text-gray-400" />
        <p className="text-gray-500">
          Acesso restrito ao perfil Administrador.
        </p>
        <Link to="/" className="btn-secondary">
          Voltar ao início
        </Link>
      </div>
    );
  }

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setErroCriar('');
    const email = `${nome
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '.')}@predial.com`;
    const res = await criarUsuario({
      nome: nome.trim(),
      email,
      senha: '123456',
      role,
      especialidade,
      setor,
    });
    if (!res.ok) {
      setErroCriar(res.erro || 'Não foi possível criar o usuário.');
      return;
    }
    setModal(false);
    setNome('');
    setRole('SOLICITANTE');
    setEspecialidade('');
    setSetor('');
    await recarregar();
    await recarregarDiretorio();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Shield className="h-6 w-6 text-brand-600" /> Usuários e Perfis
          </h1>
          <p className="text-sm text-gray-500">
            Gestão de perfis e permissões de acesso (RBAC).
          </p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">
          <UserRoundPlus className="h-4 w-4" /> Novo usuário
        </button>
      </div>

      {erro && (
        <div className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white">
          {erro}
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
                <th className="px-4 py-3 font-semibold">Usuário</th>
                <th className="px-4 py-3 font-semibold">Perfil</th>
                <th className="px-4 py-3 font-semibold">Detalhe</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {carregando ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                    Carregando usuários…
                  </td>
                </tr>
              ) : (
                lista.map((u) => (
                  <LinhaMorador
                    key={u.id}
                    m={u}
                    definirCargo={(id, novo) =>
                      void executarAcao(() => definirCargo(id, novo))
                    }
                    removerCargo={(id) =>
                      void executarAcao(() => removerCargo(id))
                    }
                    excluir={(id) =>
                      void executarAcao(() => excluirContaPorId(id))
                    }
                  />
                ))
              )}
              {!carregando && lista.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                    Nenhum usuário cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-800">
          <Users className="h-4 w-4" /> Resumo de permissões
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-gray-50 p-3 text-sm">
            <strong className="text-gray-700">Solicitante</strong>
            <p className="text-xs text-gray-500">
              Cria chamados (sem prioridade) e acompanha os próprios chamados.
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-sm">
            <strong className="text-gray-700">Técnico</strong>
            <p className="text-xs text-gray-500">
              Vê chamados revisados/disponíveis e executa (inicia e conclui).
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-sm">
            <strong className="text-gray-700">Gestor</strong>
            <p className="text-xs text-gray-500">
              Faz triagem, define prioridade, aprova e vê o dashboard.
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-sm">
            <strong className="text-gray-700">Administrador</strong>
            <p className="text-xs text-gray-500">
              Acesso total, gestão de perfis e configurações.
            </p>
          </div>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Novo usuário">
        <form onSubmit={adicionar} className="space-y-4">
          <div>
            <label className="label">Nome</label>
            <input
              className="input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Perfil</label>
            <select
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              {roles.map((r) => (
                <option key={r} value={r}>{roleLabel[r]}</option>
              ))}
            </select>
          </div>
          {role === 'TECNICO' ? (
            <div>
              <label className="label">Especialidade</label>
              <input
                className="input"
                value={especialidade}
                onChange={(e) => setEspecialidade(e.target.value)}
                placeholder="Ex: Elétrica"
              />
            </div>
          ) : (
            <div>
              <label className="label">Setor / Unidade</label>
              <input
                className="input"
                value={setor}
                onChange={(e) => setSetor(e.target.value)}
                placeholder="Ex: Administração"
              />
            </div>
          )}
          {erroCriar && (
            <div className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white">
              {erroCriar}
            </div>
          )}
          <button type="submit" className="btn-primary w-full">
            Criar usuário
          </button>
        </form>
      </Modal>
    </div>
  );
}
