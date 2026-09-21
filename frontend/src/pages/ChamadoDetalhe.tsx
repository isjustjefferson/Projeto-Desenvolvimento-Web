import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Hammer,
  Lock,
  Play,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChamados } from '../context/ChamadosContext';
import { useDiretorio } from '../context/DiretorioContext';
import { ApiError } from '../api/client';
import { categoriaLabel, formatarData, prioridadeLabel, statusLabel } from '../helpers';
import { PrioridadeBadge, StatusBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import type { Prioridade } from '../types';

const prioridades: Prioridade[] = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];

export function ChamadoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const {
    getChamado,
    obterChamado,
    carregando,
    aprovarChamado,
    iniciarChamado,
    concluirChamado,
  } = useChamados();
  const { tecnicos, nomeUsuario } = useDiretorio();

  const [modalAprovar, setModalAprovar] = useState(false);
  const [modalConcluir, setModalConcluir] = useState(false);
  const [prioridadeSel, setPrioridadeSel] = useState<Prioridade>('MEDIA');
  const [tecnicoSel, setTecnicoSel] = useState('');
  const [solDesc, setSolDesc] = useState('');
  const [solMat, setSolMat] = useState('');
  const [erroAcao, setErroAcao] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [naoEncontrado, setNaoEncontrado] = useState(false);

  const alvoId = id ? Number(id) : undefined;
  const chamado = alvoId !== undefined ? getChamado(alvoId) : undefined;

  // Se o chamado não estiver na listagem (acesso direto pela URL ou status fora
  // do escopo da lista), busca pelo endpoint de detalhe.
  useEffect(() => {
    if (carregando || alvoId === undefined || chamado) return;
    let ativo = true;
    setBuscando(true);
    obterChamado(alvoId)
      .catch(() => {
        if (ativo) setNaoEncontrado(true);
      })
      .finally(() => {
        if (ativo) setBuscando(false);
      });
    return () => {
      ativo = false;
    };
  }, [carregando, alvoId, chamado, obterChamado]);

  if (carregando || buscando) {
    return (
      <div className="card py-12 text-center text-gray-500">
        Carregando chamado…
      </div>
    );
  }

  if (!usuario || !chamado || naoEncontrado) {
    return (
      <div className="card py-12 text-center text-gray-500">
        Chamado não encontrado.{' '}
        <Link to="/chamados" className="text-brand-600">
          Voltar
        </Link>
      </div>
    );
  }

  const c = chamado;

  const podeVer =
    usuario.role === 'GESTOR' ||
    usuario.role === 'ADMINISTRADOR' ||
    (usuario.role === 'SOLICITANTE' && chamado.criadoPorId === usuario.id) ||
    (usuario.role === 'TECNICO' &&
      (chamado.tecnicoId === usuario.id || chamado.status === 'REVISADO'));

  const podeAprovar =
    (usuario.role === 'GESTOR' || usuario.role === 'ADMINISTRADOR') &&
    chamado.status === 'AGUARDANDO_APROVACAO';
  const podeIniciar =
    (usuario.role === 'GESTOR' ||
      usuario.role === 'TECNICO' ||
      usuario.role === 'ADMINISTRADOR') &&
    chamado.status === 'REVISADO' &&
    (usuario.role === 'GESTOR' ||
      usuario.role === 'ADMINISTRADOR' ||
      chamado.tecnicoId === usuario.id);
  const podeConcluir =
    (usuario.role === 'TECNICO' || usuario.role === 'ADMINISTRADOR') &&
    chamado.status === 'EM_ANDAMENTO' &&
    (usuario.role === 'ADMINISTRADOR' || chamado.tecnicoId === usuario.id);

  async function aprovar() {
    if (!tecnicoSel) return;
    setErroAcao('');
    try {
      await aprovarChamado(c.id, prioridadeSel, Number(tecnicoSel));
      setModalAprovar(false);
    } catch (err) {
      setErroAcao(
        err instanceof ApiError ? err.message : 'Não foi possível aprovar.',
      );
    }
  }

  async function iniciar() {
    setErroAcao('');
    try {
      await iniciarChamado(c.id);
    } catch (err) {
      setErroAcao(
        err instanceof ApiError ? err.message : 'Não foi possível iniciar.',
      );
    }
  }

  async function concluir() {
    if (!solDesc.trim() || !solMat.trim()) return;
    setErroAcao('');
    try {
      await concluirChamado(c.id, {
        descricao: solDesc.trim(),
        materiais: solMat.trim(),
      });
      setModalConcluir(false);
      setSolDesc('');
      setSolMat('');
    } catch (err) {
      setErroAcao(
        err instanceof ApiError ? err.message : 'Não foi possível concluir.',
      );
    }
  }

  if (!podeVer) {
    return (
      <div className="card flex flex-col items-center gap-2 py-12 text-center">
        <Lock className="h-8 w-8 text-gray-400" />
        <p className="text-gray-500">
          Você não tem permissão para visualizar este chamado.
        </p>
        <Link to="/chamados" className="btn-secondary">
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <button onClick={() => navigate('/chamados')} className="btn-secondary !px-3 !py-1.5">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <div className="card">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-400">#{chamado.id}</span>
          <h1 className="text-xl font-bold text-gray-900">{chamado.titulo}</h1>
          <StatusBadge status={chamado.status} />
          <PrioridadeBadge prioridade={chamado.prioridade} />
        </div>

        <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700">
          {chamado.descricao}
        </p>

        {chamado.foto && (
          <div className="mt-4">
            <img
              src={chamado.foto}
              alt="Foto do chamado"
              className="max-h-72 w-full rounded-lg border border-gray-200 object-cover"
            />
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-3 text-sm sm:grid-cols-3">
          <div>
            <div className="text-xs text-gray-500">Categoria</div>
            <div className="font-medium">{categoriaLabel[chamado.categoria]}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Local</div>
            <div className="font-medium">
              {chamado.local.predio}
              {chamado.local.andar ? ` · ${chamado.local.andar}` : ''}
              {chamado.local.sala ? ` · ${chamado.local.sala}` : ''}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Solicitante</div>
            <div className="font-medium">{nomeUsuario(chamado.criadoPorId)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Técnico</div>
            <div className="font-medium">
              {chamado.tecnicoId ? nomeUsuario(chamado.tecnicoId) : 'Não atribuído'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Aberto</div>
            <div className="font-medium">{formatarData(chamado.criadoEm)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Atualizado</div>
            <div className="font-medium">{formatarData(chamado.atualizadoEm)}</div>
          </div>
        </div>

        {chamado.solucao && (
          <div className="mt-4 rounded-lg bg-emerald-500 p-3">
            <h2 className="flex items-center gap-1 text-sm font-bold text-white">
              <CheckCircle2 className="h-4 w-4" /> Solução aplicada
            </h2>
            <p className="mt-1 text-sm text-white">{chamado.solucao.descricao}</p>
            <p className="mt-2 text-xs font-medium text-white">
              Materiais: {chamado.solucao.materiais}
            </p>
          </div>
        )}

        {erroAcao && (
          <div className="mt-4 rounded-lg bg-red-500 px-3 py-2 text-sm text-white">
            {erroAcao}
          </div>
        )}

        {chamado.status !== 'CONCLUIDO' && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
            {podeAprovar && (
              <button onClick={() => setModalAprovar(true)} className="btn-primary">
                <Briefcase className="h-4 w-4" /> Aprovar e Liberar Chamado
              </button>
            )}
            {podeIniciar && (
              <button onClick={iniciar} className="btn-primary">
                <Play className="h-4 w-4" /> Iniciar atendimento
              </button>
            )}
            {podeConcluir && (
              <button onClick={() => setModalConcluir(true)} className="btn-secondary">
                <Hammer className="h-4 w-4" /> Concluir chamado
              </button>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold text-gray-800">Histórico</h2>
        <div className="space-y-3">
          {chamado.historico.map((h) => (
            <div key={h.id} className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
              <div className="text-sm">
                <span className="font-medium text-gray-800">
                  {nomeUsuario(h.usuarioId)}
                </span>
                <span className="text-gray-500">
                  {h.de
                    ? ` alterou de ${statusLabel[h.de]} para ${statusLabel[h.para]}`
                    : ' abriu o chamado'}
                </span>
                {h.observacao && (
                  <div className="mt-0.5 text-xs italic text-gray-400">
                    {h.observacao}
                  </div>
                )}
                <div className="text-xs text-gray-400">
                  {formatarData(h.dataHora)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={modalAprovar} onClose={() => setModalAprovar(false)} title="Aprovar chamado">
        <div className="space-y-4">
          <div>
            <label className="label">Prioridade</label>
            <div className="grid grid-cols-4 gap-2">
              {prioridades.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPrioridadeSel(p)}
                  className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                    prioridadeSel === p
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {prioridadeLabel[p]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Atribuir ao técnico</label>
            <select
              className="input"
              value={tecnicoSel}
              onChange={(e) => setTecnicoSel(e.target.value)}
            >
              <option value="">Selecione o técnico</option>
              {tecnicos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome} ({t.especialidade})
                </option>
              ))}
            </select>
          </div>
          <button onClick={aprovar} className="btn-primary w-full" disabled={!tecnicoSel}>
            Aprovar e atribuir
          </button>
        </div>
      </Modal>

      <Modal open={modalConcluir} onClose={() => setModalConcluir(false)} title="Concluir chamado">
        <div className="space-y-4">
          <div>
            <label className="label">Solução aplicada</label>
            <textarea
              className="input min-h-[90px]"
              value={solDesc}
              onChange={(e) => setSolDesc(e.target.value)}
              placeholder="Descreva como o problema foi resolvido"
              required
            />
          </div>
          <div>
            <label className="label">Materiais utilizados</label>
            <input
              className="input"
              value={solMat}
              onChange={(e) => setSolMat(e.target.value)}
              placeholder="Ex: 1 tomada, fita isolante"
              required
            />
          </div>
          <button
            onClick={concluir}
            className="btn-primary w-full"
            disabled={!solDesc.trim() || !solMat.trim()}
          >
            Concluir
          </button>
        </div>
      </Modal>
    </div>
  );
}
