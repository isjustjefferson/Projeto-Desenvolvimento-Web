import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Inbox, Plus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChamados } from '../hooks/useChamados';
import { useDiretorio } from '../hooks/useUsuarios';
import { mensagemDeErro } from '../api/client';
import {
  chamadosVisiveis,
  pode,
  statusVisiveisPorRole,
  tecnicoSemEspecialidade,
} from '../rbac';
import {
  categoriaLabel,
  prioridadeLabel,
  statusLabel,
  tempoRelativo,
} from '../helpers';
import { PrioridadeBadge, StatusBadge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import type { Status } from '../types';

export function ChamadosLista() {
  const { usuario } = useAuth();
  const { data: chamados = [], isPending, error } = useChamados();
  const { nomeUsuario } = useDiretorio();
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroPrioridade, setFiltroPrioridade] = useState('');
  const [busca, setBusca] = useState('');
  const [aba, setAba] = useState<'disponiveis' | 'meus'>('disponiveis');
  const [filtroSolicitante, setFiltroSolicitante] = useState('');

  const visiveis = useMemo(() => {
    if (!usuario) return [];
    return chamadosVisiveis(chamados, usuario)
      .filter((c) => {
        // Técnico: aba de disponíveis (da especialidade dele, ainda sem técnico)
        // ou de meus atribuídos
        if (usuario.role === 'TECNICO') {
          if (aba === 'disponiveis') {
            if (c.tecnicoId) return false;
          } else {
            if (c.tecnicoId !== usuario.id) return false;
          }
        }

        // Gestor: filtrar por próprios chamados ou por solicitante
        if (usuario.role === 'GESTOR') {
          if (aba === 'meus') {
            if (c.criadoPorId !== usuario.id) return false;
          }
        }

        // Filtros manuais
        if (filtroStatus && c.status !== filtroStatus) return false;
        if (filtroPrioridade && c.prioridade !== filtroPrioridade) return false;
        if (filtroSolicitante) {
          if (c.criadoPorId !== Number(filtroSolicitante)) return false;
        }
        if (busca) {
          const termo = busca.toLowerCase();
          const match =
            c.titulo.toLowerCase().includes(termo) ||
            c.descricao.toLowerCase().includes(termo) ||
            c.local.predio.toLowerCase().includes(termo);
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }, [chamados, usuario, aba, filtroStatus, filtroPrioridade, busca, filtroSolicitante]);

  const podeCriar = usuario ? pode(usuario.role, 'criar') : false;
  const semEspecialidade = usuario ? tecnicoSemEspecialidade(usuario) : false;
  const statusDoPerfil = usuario
    ? (Object.keys(statusLabel) as Status[]).filter((s) =>
        statusVisiveisPorRole[usuario.role].includes(s),
      )
    : [];
  const filtrosAtivos = Boolean(busca || filtroStatus || filtroPrioridade || filtroSolicitante);

  const solicitantes = useMemo(() => {
    const ids = new Set<number>();
    for (const c of chamados) ids.add(c.criadoPorId);
    return Array.from(ids)
      .map((id) => ({ id, nome: nomeUsuario(id) }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [chamados, nomeUsuario]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/"
            className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-brand-700"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Chamados</h1>
          <p className="text-sm text-gray-500">
            {usuario?.role === 'SOLICITANTE' && 'Seus chamados de manutenção'}
            {usuario?.role === 'GESTOR' && 'Seus chamados e chamados da edificação'}
            {usuario?.role === 'TECNICO' && 'Chamados da sua especialidade e atribuídos a você'}
            {usuario?.role === 'ADMINISTRADOR' && 'Gestão completa de chamados'}
          </p>
        </div>
        {podeCriar && (
          <Link to="/chamados/novo" className="btn-primary">
            <Plus className="h-4 w-4" /> Novo Chamado
          </Link>
        )}
      </div>

      {usuario?.role === 'TECNICO' && (
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
          <button
            onClick={() => setAba('disponiveis')}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              aba === 'disponiveis'
                ? 'bg-brand-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Disponíveis
          </button>
          <button
            onClick={() => setAba('meus')}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              aba === 'meus'
                ? 'bg-brand-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Meus Chamados Atribuídos
          </button>
        </div>
      )}

      {usuario?.role === 'GESTOR' && (
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
          <button
            onClick={() => setAba('disponiveis')}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              aba === 'disponiveis'
                ? 'bg-brand-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Todos os chamados
          </button>
          <button
            onClick={() => setAba('meus')}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              aba === 'meus'
                ? 'bg-brand-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Meus chamados
          </button>
        </div>
      )}

      {semEspecialidade && (
        <div className="card border-amber-200 bg-amber-50 text-sm text-amber-800">
          Sua especialidade não está definida. Você está vendo apenas os chamados
          atribuídos a você — fale com o gestor para definir sua especialidade.
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
        <div className="relative sm:col-span-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Buscar por título ou local"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <select
          className="input"
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
        >
          <option value="">Status: todos</option>
          {statusDoPerfil.map((s) => (
            <option key={s} value={s}>{statusLabel[s]}</option>
          ))}
        </select>
        <select
          className="input"
          value={filtroPrioridade}
          onChange={(e) => setFiltroPrioridade(e.target.value)}
        >
          <option value="">Prioridade: todas</option>
          {Object.entries(prioridadeLabel).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        {(usuario?.role === 'GESTOR' || usuario?.role === 'ADMINISTRADOR') && (
          <select
            className="input"
            value={filtroSolicitante}
            onChange={(e) => setFiltroSolicitante(e.target.value)}
          >
            <option value="">Solicitante: todos</option>
            {solicitantes.map((s) => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </select>
        )}
      </div>

      {isPending ? (
        <div className="card py-12 text-center text-gray-500">
          Carregando chamados…
        </div>
      ) : error ? (
        <div className="card py-12 text-center text-red-500">
          {mensagemDeErro(error, 'Não foi possível carregar os chamados.')}
        </div>
      ) : visiveis.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Inbox}
            titulo={
              usuario?.role === 'TECNICO' && aba === 'disponiveis'
                ? 'Nenhum chamado disponível'
                : 'Nenhum chamado por aqui'
            }
            descricao={
              filtrosAtivos
                ? 'Nenhum chamado corresponde à sua busca ou aos filtros aplicados.'
                : usuario?.role === 'TECNICO' && aba === 'disponiveis'
                  ? 'Não há chamados da sua especialidade aguardando atendimento no momento.'
                  : usuario?.role === 'GESTOR' && aba === 'meus'
                    ? 'Você ainda não abriu nenhum chamado.'
                    : 'Quando houver chamados que você possa acompanhar, eles aparecem aqui.'
            }
            acao={
              filtrosAtivos ? (
                <button
                  onClick={() => {
                    setBusca('');
                    setFiltroStatus('');
                    setFiltroPrioridade('');
                    setFiltroSolicitante('');
                  }}
                  className="btn-secondary"
                >
                  Limpar filtros
                </button>
              ) : usuario?.role === 'GESTOR' && aba === 'meus' ? undefined : podeCriar ? (
                <Link to="/chamados/novo" className="btn-primary">
                  <Plus className="h-4 w-4" /> Abrir chamado
                </Link>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {visiveis.map((c) => (
            <Link
              key={c.id}
              to={`/chamados/${c.id}`}
              className="card block transition hover:border-brand-300 hover:shadow"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-400">#{c.id}</span>
                <h3 className="font-semibold text-gray-900">{c.titulo}</h3>
                <StatusBadge status={c.status} />
                <PrioridadeBadge prioridade={c.prioridade} />
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-gray-500">{c.descricao}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>{categoriaLabel[c.categoria]}</span>
                <span>
                  {c.local.predio}
                  {c.local.andar ? ` · ${c.local.andar}` : ''}
                  {c.local.sala ? ` · ${c.local.sala}` : ''}
                </span>
                <span>{tempoRelativo(c.criadoEm)}</span>
                <span>Solicitante: {nomeUsuario(c.criadoPorId)}</span>
                {c.tecnicoId && (
                  <span>Técnico: {nomeUsuario(c.tecnicoId)}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
