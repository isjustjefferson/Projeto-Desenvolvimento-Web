import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Inbox, LayoutGrid, List, Plus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChamados } from '../hooks/useChamados';
import { useDiretorio } from '../hooks/useUsuarios';
import { useVisualizacao, type Visualizacao } from '../hooks/useVisualizacao';
import { mensagemDeErro } from '../api/client';
import {
  chamadosVisiveis,
  pode,
  statusVisiveisPorRole,
  prestadorSemEspecialidade,
} from '../rbac';
import { categoriaLabel, paginar, prioridadeLabel, statusLabel } from '../helpers';
import { ChamadoCard, ChamadoLinha } from '../components/ChamadoItem';
import { EmptyState } from '../components/EmptyState';
import { Paginacao } from '../components/Paginacao';
import type { Status } from '../types';

const POR_PAGINA = 8;

const opcoesVisualizacao: { valor: Visualizacao; rotulo: string; icone: typeof List }[] = [
  { valor: 'cards', rotulo: 'Visualização em cards', icone: LayoutGrid },
  { valor: 'lista', rotulo: 'Visualização em lista', icone: List },
];

export function ChamadosLista() {
  const { usuario } = useAuth();
  const { data: chamados = [], isPending, error } = useChamados();
  const { nomeUsuario } = useDiretorio();
  const [params, setParams] = useSearchParams();
  const [busca, setBusca] = useState('');
  const [aba, setAba] = useState<'disponiveis' | 'meus'>('disponiveis');
  const [filtroCondomino, setFiltroCondomino] = useState('');
  const [visualizacao, setVisualizacao] = useVisualizacao();

  const statusDoPerfil = usuario
    ? (Object.keys(statusLabel) as Status[]).filter((s) =>
        statusVisiveisPorRole[usuario.role].includes(s),
      )
    : [];

  // Status, prioridade e categoria vivem na URL (?status=&prioridade=&categoria=),
  // para que links do dashboard abram a lista já filtrada. Valor que não existe
  // (ou status fora do perfil) é ignorado.
  const filtroDaUrl = (chave: string, validos: readonly string[]) => {
    const valor = params.get(chave) ?? '';
    return validos.includes(valor) ? valor : '';
  };
  const filtroStatus = filtroDaUrl('status', statusDoPerfil);
  const filtroPrioridade = filtroDaUrl('prioridade', Object.keys(prioridadeLabel));
  const filtroCategoria = filtroDaUrl('categoria', Object.keys(categoriaLabel));
  const definirFiltroUrl = (chave: string) => (valor: string) =>
    setParams(
      (atuais) => {
        const novos = new URLSearchParams(atuais);
        if (valor) novos.set(chave, valor);
        else novos.delete(chave);
        return novos;
      },
      { replace: true },
    );
  const setFiltroStatus = definirFiltroUrl('status');
  const setFiltroPrioridade = definirFiltroUrl('prioridade');
  const setFiltroCategoria = definirFiltroUrl('categoria');

  const visiveis = useMemo(() => {
    if (!usuario) return [];
    return chamadosVisiveis(chamados, usuario)
      .filter((c) => {
        // Prestador: aba de disponíveis (da especialidade dele, ainda sem prestador)
        // ou de meus atribuídos
        if (usuario.role === 'PRESTADOR') {
          if (aba === 'disponiveis') {
            if (c.prestadorId) return false;
          } else {
            if (c.prestadorId !== usuario.id) return false;
          }
        }

        // Síndico: filtrar por próprios chamados ou por condômino
        if (usuario.role === 'SINDICO') {
          if (aba === 'meus') {
            if (c.criadoPorId !== usuario.id) return false;
          }
        }

        // Filtros manuais
        if (filtroStatus && c.status !== filtroStatus) return false;
        if (filtroPrioridade && c.prioridade !== filtroPrioridade) return false;
        if (filtroCategoria && c.categoria !== filtroCategoria) return false;
        if (filtroCondomino) {
          if (c.criadoPorId !== Number(filtroCondomino)) return false;
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
  }, [chamados, usuario, aba, filtroStatus, filtroPrioridade, filtroCategoria, busca, filtroCondomino]);

  // Mudou a busca, um filtro ou a aba: a página guardada é de outro recorte,
  // então volta para a primeira (sem efeito colateral de re-render).
  const chaveRecorte = [aba, filtroStatus, filtroPrioridade, filtroCategoria, filtroCondomino, busca].join('|');
  const [paginacao, setPaginacao] = useState({ chave: chaveRecorte, pagina: 1 });
  const pagina = paginar(
    visiveis,
    paginacao.chave === chaveRecorte ? paginacao.pagina : 1,
    POR_PAGINA,
  );
  const irParaPagina = (n: number) => {
    setPaginacao({ chave: chaveRecorte, pagina: n });
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
  };

  const podeCriar = usuario ? pode(usuario.role, 'criar') : false;
  const semEspecialidade = usuario ? prestadorSemEspecialidade(usuario) : false;
  const filtrosAtivos = Boolean(
    busca || filtroStatus || filtroPrioridade || filtroCategoria || filtroCondomino,
  );

  const condominos = useMemo(() => {
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
            {usuario?.role === 'CONDOMINO' && 'Seus chamados de manutenção'}
            {usuario?.role === 'SINDICO' && 'Seus chamados e chamados da edificação'}
            {usuario?.role === 'PRESTADOR' && 'Chamados da sua especialidade e atribuídos a você'}
            {usuario?.role === 'ADMINISTRADOR' && 'Gestão completa de chamados'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label="Modo de visualização"
            className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1"
          >
            {opcoesVisualizacao.map(({ valor, rotulo, icone: Icone }) => (
              <button
                key={valor}
                onClick={() => setVisualizacao(valor)}
                aria-label={rotulo}
                aria-pressed={visualizacao === valor}
                title={rotulo}
                className={`rounded-md p-1.5 transition ${
                  visualizacao === valor
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Icone className="h-4 w-4" />
              </button>
            ))}
          </div>
          {podeCriar && (
            <Link to="/chamados/novo" className="btn-primary">
              <Plus className="h-4 w-4" /> Novo Chamado
            </Link>
          )}
        </div>
      </div>

      {usuario?.role === 'PRESTADOR' && (
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

      {usuario?.role === 'SINDICO' && (
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
          atribuídos a você — fale com o síndico para definir sua especialidade.
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
        <select
          className="input"
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
        >
          <option value="">Categoria: todas</option>
          {Object.entries(categoriaLabel).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        {(usuario?.role === 'SINDICO' || usuario?.role === 'ADMINISTRADOR') && (
          <select
            className="input"
            value={filtroCondomino}
            onChange={(e) => setFiltroCondomino(e.target.value)}
          >
            <option value="">Condômino: todos</option>
            {condominos.map((s) => (
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
              usuario?.role === 'PRESTADOR' && aba === 'disponiveis'
                ? 'Nenhum chamado disponível'
                : 'Nenhum chamado por aqui'
            }
            descricao={
              filtrosAtivos
                ? 'Nenhum chamado corresponde à sua busca ou aos filtros aplicados.'
                : usuario?.role === 'PRESTADOR' && aba === 'disponiveis'
                  ? 'Não há chamados da sua especialidade aguardando atendimento no momento.'
                  : usuario?.role === 'SINDICO' && aba === 'meus'
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
                    setFiltroCategoria('');
                    setFiltroCondomino('');
                  }}
                  className="btn-secondary"
                >
                  Limpar filtros
                </button>
              ) : usuario?.role === 'SINDICO' && aba === 'meus' ? undefined : podeCriar ? (
                <Link to="/chamados/novo" className="btn-primary">
                  <Plus className="h-4 w-4" /> Abrir chamado
                </Link>
              ) : undefined
            }
          />
        </div>
      ) : (
        <>
          {visualizacao === 'cards' ? (
            <div className="space-y-3">
              {pagina.itens.map((c) => (
                <ChamadoCard key={c.id} chamado={c} nomeUsuario={nomeUsuario} />
              ))}
            </div>
          ) : (
            <div className="card !p-0 divide-y divide-gray-100 overflow-hidden">
              {pagina.itens.map((c) => (
                <ChamadoLinha key={c.id} chamado={c} />
              ))}
            </div>
          )}
          <Paginacao
            pagina={pagina.pagina}
            totalPaginas={pagina.totalPaginas}
            total={pagina.total}
            onMudar={irParaPagina}
          />
        </>
      )}
    </div>
  );
}
