import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChamados } from '../context/ChamadosContext';
import { useDiretorio } from '../context/DiretorioContext';
import { pode, statusVisiveisPorRole } from '../rbac';
import {
  categoriaLabel,
  prioridadeLabel,
  statusLabel,
  tempoRelativo,
} from '../helpers';
import { PrioridadeBadge, StatusBadge } from '../components/Badge';
import type { Status } from '../types';

export function ChamadosLista() {
  const { usuario } = useAuth();
  const { chamados, carregando, erro } = useChamados();
  const { nomeUsuario } = useDiretorio();
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroPrioridade, setFiltroPrioridade] = useState('');
  const [busca, setBusca] = useState('');
  const [aba, setAba] = useState<'disponiveis' | 'meus'>('disponiveis');

  const visiveis = useMemo(() => {
    if (!usuario) return [];
    return chamados
      .filter((c) => {
        // Perfil determina quais status aparecem
        const statusPermitidos = statusVisiveisPorRole[usuario.role];
        if (!statusPermitidos.includes(c.status)) return false;

        // Solicitante só enxerga os próprios chamados
        if (usuario.role === 'SOLICITANTE' && c.criadoPorId !== usuario.id) {
          return false;
        }

        // Técnico: aba de disponíveis (revisados) ou de meus atribuídos
        if (usuario.role === 'TECNICO') {
          if (aba === 'disponiveis') {
            if (c.status !== 'REVISADO') return false;
          } else {
            if (c.tecnicoId !== usuario.id) return false;
          }
        }

        // Filtros manuais
        if (filtroStatus && c.status !== filtroStatus) return false;
        if (filtroPrioridade && c.prioridade !== filtroPrioridade) return false;
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
  }, [chamados, usuario, aba, filtroStatus, filtroPrioridade, busca]);

  const podeCriar = usuario ? pode(usuario.role, 'criar') : false;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chamados</h1>
          <p className="text-sm text-gray-500">
            {usuario?.role === 'SOLICITANTE' && 'Seus chamados de manutenção'}
            {usuario?.role === 'TECNICO' && 'Chamados disponíveis e atribuídos a você'}
            {usuario?.role === 'GESTOR' && 'Fila de triagem e chamados da edificação'}
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

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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
          {(Object.keys(statusLabel) as Status[]).map((s) => (
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
      </div>

      {carregando ? (
        <div className="card py-12 text-center text-gray-500">
          Carregando chamados…
        </div>
      ) : erro ? (
        <div className="card py-12 text-center text-red-500">{erro}</div>
      ) : visiveis.length === 0 ? (
        <div className="card py-12 text-center text-gray-500">
          Nenhum chamado encontrado para este perfil.
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
