import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Inbox,
  Users,
} from 'lucide-react';
import { useChamados } from '../hooks/useChamados';
import { useDiretorio } from '../hooks/useUsuarios';
import { useAuth } from '../context/AuthContext';
import { mensagemDeErro } from '../api/client';
import {
  chamadosVisiveis,
  especialidadeParaCategoria,
  pode,
  statusVisiveisPorRole,
  tecnicoSemEspecialidade,
} from '../rbac';
import {
  categoriaLabel,
  formatarData,
  prioridadeLabel,
  prioridadeColor,
  statusLabel,
  statusColor,
} from '../helpers';
import { PrioridadeBadge, StatusBadge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import type { Prioridade, Status } from '../types';

const statuses: Status[] = [
  'AGUARDANDO_APROVACAO',
  'REVISADO',
  'EM_ANDAMENTO',
  'CONCLUIDO',
];

const prioridades: Prioridade[] = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];

const prioridadeIconeCor: Record<Prioridade, string> = {
  CRITICA: 'bg-red-500 text-white',
  ALTA: 'bg-orange-500 text-white',
  MEDIA: 'bg-yellow-400 text-gray-900',
  BAIXA: 'bg-emerald-500 text-white',
};

export function Dashboard() {
  const { data: chamados = [], isPending, error, refetch } = useChamados();
  const { usuario } = useAuth();
  const { nomeUsuario } = useDiretorio();
  const navigate = useNavigate();
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroPrioridade, setFiltroPrioridade] = useState('');

  // Chamados que o perfil pode enxergar (recorte por papel/especialidade)
  const visiveis = useMemo(
    () => (usuario ? chamadosVisiveis(chamados, usuario) : []),
    [chamados, usuario],
  );

  const dados = useMemo(() => {
    if (!usuario) {
      return {
        abertos: 0,
        concluidos: 0,
        triagem: 0,
        porStatus: {} as Record<string, number>,
        porCategoria: {} as Record<string, number>,
        porPrioridadeAtiva: {} as Record<Prioridade, number>,
        criticasPendentes: 0,
      };
    }
    const porStatus = visiveis.reduce<Record<string, number>>((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});
    const porCategoria = visiveis.reduce<Record<string, number>>((acc, c) => {
      acc[c.categoria] = (acc[c.categoria] || 0) + 1;
      return acc;
    }, {});
    const porPrioridadeAtiva = prioridades.reduce(
      (acc, p) => {
        acc[p] = visiveis.filter(
          (c) => c.prioridade === p && c.status !== 'CONCLUIDO',
        ).length;
        return acc;
      },
      {} as Record<Prioridade, number>,
    );
    return {
      abertos: visiveis.filter((c) => c.status !== 'CONCLUIDO').length,
      concluidos: visiveis.filter((c) => c.status === 'CONCLUIDO').length,
      triagem: porStatus['AGUARDANDO_APROVACAO'] || 0,
      porStatus,
      porCategoria,
      porPrioridadeAtiva,
      criticasPendentes: porPrioridadeAtiva['CRITICA'],
    };
  }, [visiveis, usuario]);

  const podeVerTriagem = usuario ? pode(usuario.role, 'triar') : false;

  const filtrados = useMemo(
    () =>
      visiveis
        .filter((c) => {
          if (filtroStatus && c.status !== filtroStatus) return false;
          if (filtroPrioridade && c.prioridade !== filtroPrioridade) return false;
          return true;
        })
        .sort(
          (a, b) =>
            new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
        ),
    [visiveis, filtroStatus, filtroPrioridade],
  );

  const semEspecialidade = usuario ? tecnicoSemEspecialidade(usuario) : false;

  const listaChamados = filtrados.slice(0, 8);

  if (!usuario) return null;

  if (isPending) {
    return (
      <div className="card py-12 text-center text-gray-500">
        Carregando indicadores…
      </div>
    );
  }

  if (error) {
    return (
      <div className="card flex flex-col items-center gap-2 py-12 text-center">
        <p className="text-red-500">
          {mensagemDeErro(error, 'Não foi possível carregar os chamados.')}
        </p>
        <button onClick={() => void refetch()} className="btn-secondary">
          Tentar novamente
        </button>
      </div>
    );
  }

  const cards = [
    {
      label: 'Total de Chamados Abertos',
      valor: dados.abertos,
      icon: Inbox,
      cor: 'bg-brand-500 text-white',
    },
    {
      label: 'Chamados Fechados / Concluídos',
      valor: dados.concluidos,
      icon: CheckCircle2,
      cor: 'bg-emerald-500 text-white',
    },
    ...(podeVerTriagem
      ? [
          {
            label: 'Aguardando Triagem / Aprovação',
            valor: dados.triagem,
            icon: Clock,
            cor: 'bg-amber-500 text-white',
          },
        ]
      : []),
    {
      label: 'Críticas Pendentes',
      valor: dados.criticasPendentes,
      icon: AlertTriangle,
      cor: 'bg-red-500 text-white',
    },
  ];

  const maxCategoria = Math.max(1, ...Object.values(dados.porCategoria));

  // Só oferece filtro/linha de status que o perfil realmente enxerga
  const statusDoPerfil = statuses.filter((s) =>
    statusVisiveisPorRole[usuario.role].includes(s),
  );

  const escopoLabel = (() => {
    if (usuario.role === 'SOLICITANTE') {
      return 'Exibindo apenas os chamados abertos por você.';
    }
    if (usuario.role === 'TECNICO') {
      const cat = especialidadeParaCategoria(usuario.especialidade);
      return cat
        ? `Exibindo os chamados de ${categoriaLabel[cat]} e os atribuídos a você.`
        : 'Exibindo apenas os chamados atribuídos a você.';
    }
    return 'Visão geral de todos os chamados.';
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Geral</h1>
        <p className="text-sm text-gray-500">
          Painel do sistema · {usuario.nome} ({usuario.role})
        </p>
        <p className="mt-0.5 text-xs text-gray-400">{escopoLabel}</p>
      </div>

      {semEspecialidade && (
        <div className="card border-amber-200 bg-amber-50 text-sm text-amber-800">
          Sua especialidade não está definida. Você está vendo apenas os chamados
          atribuídos a você — fale com o gestor para definir sua especialidade.
        </div>
      )}

      {/* Indicadores rápidos */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card !p-4">
              <div className={`mb-2 inline-flex rounded-lg p-2 ${card.cor}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {card.valor}
              </div>
              <div className="mt-1 text-xs leading-snug text-gray-500">
                {card.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Chamados por prioridade (ativos) */}
      <div>
        <h2 className="mb-2 font-semibold text-gray-800">
          Chamados por prioridade (ativos)
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {prioridades.map((p) => (
            <button
              key={p}
              onClick={() => navigate(`/chamados?prioridade=${encodeURIComponent(p)}`)}
              className="card !p-4 text-left transition hover:border-brand-300 hover:shadow"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex rounded-lg p-2 ${prioridadeIconeCor[p]}`}
                >
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <span className="text-2xl font-bold text-gray-900">
                  {dados.porPrioridadeAtiva[p] ?? 0}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${prioridadeColor[p]}`}
                >
                  {prioridadeLabel[p]}
                </span>{' '}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-semibold text-gray-800">
            Chamados por status
          </h2>
          <div className="space-y-2">
            {statusDoPerfil.map((s) => (
              <button
                key={s}
                onClick={() => navigate(`/chamados?status=${encodeURIComponent(s)}`)}
                className="flex w-full items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-left transition hover:bg-gray-100"
              >
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor[s]}`}
                >
                  {statusLabel[s]}
                </span>
                <span className="text-sm font-bold">
                  {dados.porStatus[s] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="mb-3 font-semibold text-gray-800">Por categoria</h2>
          <div className="space-y-3">
            {Object.entries(dados.porCategoria).map(([cat, total]) => (
              <button
                key={cat}
                onClick={() => navigate(`/chamados?categoria=${encodeURIComponent(cat)}`)}
                className="group w-full rounded-lg px-2 py-1 text-left transition hover:bg-brand-50/70"
              >
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-gray-600 transition group-hover:text-brand-700">
                    {categoriaLabel[cat as keyof typeof categoriaLabel]}
                  </span>
                  <span className="font-semibold">{total}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-brand-500 transition group-hover:brightness-110"
                    style={{ width: `${(total / maxCategoria) * 100}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`grid gap-6 ${podeVerTriagem ? 'lg:grid-cols-2' : ''}`}>
        {podeVerTriagem && (
          <div className="card flex flex-col items-center justify-center text-center">
            <span className="mb-2 inline-flex rounded-lg bg-brand-500 p-3 text-white">
              <Users className="h-6 w-6" />
            </span>
            <h2 className="text-sm font-semibold text-gray-700">
              Fila de Triagem do Gestor
            </h2>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {dados.triagem}
            </p>
            <p className="text-xs text-gray-500">
              chamados aguardando aprovação
            </p>
          </div>
        )}

        <div className="card">
          <h2 className="mb-3 font-semibold text-gray-800">
            Últimos chamados
          </h2>
          <p className="flex items-center gap-1 text-xs text-gray-500">
            <Activity className="h-4 w-4" /> Resumo dos chamados mais recentes
          </p>
          <ul className="mt-3 space-y-2">
            {listaChamados.slice(0, 4).map((c) => (
              <li key={c.id}>
                <Link
                  to={`/chamados/${c.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm transition hover:border-brand-300 hover:bg-gray-100"
                >
                  <span className="truncate font-medium text-gray-700">
                    #{c.id} {c.titulo}
                  </span>
                  <span
                    className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusColor[c.status]}`}
                  >
                    {statusLabel[c.status]}
                  </span>
                </Link>
              </li>
            ))}
            {listaChamados.length === 0 && (
              <li className="text-sm text-gray-400">
                Nenhum chamado registrado.
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Lista e Filtro de Chamados */}
      <div className="card !p-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-4">
          <div>
            <h2 className="font-semibold text-gray-800">
              Lista e Filtro de Chamados
            </h2>
            <p className="text-xs text-gray-500">
              {filtrados.length} de {visiveis.length} chamados
            </p>
          </div>
          <Link to="/chamados" className="btn-secondary">
            Ver todos
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-2 border-b border-gray-200 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <select
            className="input"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            aria-label="Filtrar por status"
          >
            <option value="">Status: todos</option>
            {statusDoPerfil.map((s) => (
              <option key={s} value={s}>
                {statusLabel[s]}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={filtroPrioridade}
            onChange={(e) => setFiltroPrioridade(e.target.value)}
            aria-label="Filtrar por prioridade"
          >
            <option value="">Prioridade: todas</option>
            {prioridades.map((p) => (
              <option key={p} value={p}>
                {prioridadeLabel[p]}
              </option>
            ))}
          </select>
          {(filtroStatus || filtroPrioridade) && (
            <button
              onClick={() => {
                setFiltroStatus('');
                setFiltroPrioridade('');
              }}
              className="btn-secondary"
            >
              Limpar filtros
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Solicitante</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Prioridade</th>
                <th className="px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {listaChamados.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-50 transition hover:bg-gray-100"
                >
                  <td className="px-4 py-3 font-bold text-gray-400">
                    #{c.id}
                  </td>
                  <td className="max-w-[220px] px-4 py-3">
                    <Link
                      to={`/chamados/${c.id}`}
                      className="font-medium text-brand-700 hover:underline"
                    >
                      {c.titulo}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {nomeUsuario(c.criadoPorId)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {categoriaLabel[c.categoria]}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3">
                    <PrioridadeBadge prioridade={c.prioridade} sugestao={c.classificacao?.prioridadeSugerida} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                    {formatarData(c.criadoEm)}
                  </td>
                </tr>
              ))}
              {listaChamados.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-4">
                    <EmptyState
                      icon={Inbox}
                      titulo="Nenhum chamado por aqui"
                      descricao={
                        filtroStatus || filtroPrioridade
                          ? 'Nenhum chamado corresponde aos filtros aplicados.'
                          : 'Quando houver chamados que você possa acompanhar, eles aparecem aqui.'
                      }
                      acao={
                        filtroStatus || filtroPrioridade ? (
                          <button
                            onClick={() => {
                              setFiltroStatus('');
                              setFiltroPrioridade('');
                            }}
                            className="btn-secondary"
                          >
                            Limpar filtros
                          </button>
                        ) : undefined
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
