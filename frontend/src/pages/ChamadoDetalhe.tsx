import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  FileText,
  Hammer,
  Lock,
  Play,
  Plus,
  Receipt,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  useAprovarChamado,
  useAprovarDespesa,
  useChamado,
  useConcluirChamado,
  useCriarDespesa,
  useIniciarChamado,
  useRejeitarDespesa,
  useRemoverDespesa,
} from '../hooks/useChamados';
import { useDiretorio } from '../hooks/useUsuarios';
import { ApiError, mensagemDeErro } from '../api/client';
import type { CriarDespesaInput } from '../api/despesas';
import {
  categoriaDespesaLabel,
  categoriaLabel,
  formatarData,
  formatarMoeda,
  prioridadeLabel,
  statusDespesaColor,
  statusDespesaLabel,
  statusLabel,
  tipoAnexoLabel,
  tipoDocumentoFiscalLabel,
} from '../helpers';
import { PrioridadeBadge, StatusBadge } from '../components/Badge';
import { FormularioDespesa } from '../components/FormularioDespesa';
import { Modal } from '../components/Modal';
import type { Prioridade } from '../types';

const prioridades: Prioridade[] = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];

interface AnexoArquivo {
  nomeArquivo: string;
  mimeType: string;
  conteudo?: string;
}

function criarUrlAnexo(anexo: AnexoArquivo): string | null {
  if (!anexo.conteudo) return null;
  const virgula = anexo.conteudo.indexOf(',');
  const base64 =
    virgula >= 0 ? anexo.conteudo.slice(virgula + 1) : anexo.conteudo;
  const meta = virgula >= 0 ? anexo.conteudo.slice(0, virgula) : '';
  const mime = meta.match(/^data:([^;,]+)/)?.[1] ?? anexo.mimeType;

  try {
    const binario = atob(base64);
    const bytes = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i += 1) {
      bytes[i] = binario.charCodeAt(i);
    }
    return URL.createObjectURL(new Blob([bytes], { type: mime }));
  } catch {
    return null;
  }
}

function abrirAnexo(anexo: AnexoArquivo) {
  const url = criarUrlAnexo(anexo);
  if (!url) {
    toast.error('Não foi possível abrir o anexo.');
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function baixarAnexo(anexo: AnexoArquivo) {
  const url = criarUrlAnexo(anexo);
  if (!url) {
    toast.error('Não foi possível baixar o anexo.');
    return;
  }
  const link = document.createElement('a');
  link.href = url;
  link.download = anexo.nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function ChamadoNaoEncontrado() {
  return (
    <div className="card py-12 text-center text-gray-500">
      Chamado não encontrado.{' '}
      <Link to="/chamados" className="text-brand-600">
        Voltar
      </Link>
    </div>
  );
}

export function ChamadoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const chamadoQuery = useChamado(id ? Number(id) : undefined);
  const aprovarChamado = useAprovarChamado();
  const iniciarChamado = useIniciarChamado();
  const concluirChamado = useConcluirChamado();
  const criarDespesa = useCriarDespesa();
  // const anexarDespesa = useAnexarDespesa();
  // const removerAnexoDespesa = useRemoverAnexoDespesa();
  const removerDespesa = useRemoverDespesa();
  const aprovarDespesa = useAprovarDespesa();
  const rejeitarDespesa = useRejeitarDespesa();
  const { prestadores, nomeUsuario } = useDiretorio();

  const [modalAprovar, setModalAprovar] = useState(false);
  const [modalConcluir, setModalConcluir] = useState(false);
  const [modalDespesa, setModalDespesa] = useState(false);
  const [modalRejeitar, setModalRejeitar] = useState(false);
  const [prioridadeSel, setPrioridadeSel] = useState<Prioridade>('MEDIA');
  const [prestadorSel, setPrestadorSel] = useState('');
  const [solDesc, setSolDesc] = useState('');
  const [solMat, setSolMat] = useState('');
  const [erroAcao, setErroAcao] = useState('');
  const [despesaRejeitarId, setDespesaRejeitarId] = useState<number | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');

  // id não numérico não vira requisição: já cai direto em "não encontrado"
  const alvoId = id ? Number(id) : undefined;
  const chamado = chamadoQuery.data;
  const naoEncontrado =
    chamadoQuery.isError &&
    chamadoQuery.error instanceof ApiError &&
    chamadoQuery.error.status === 404;

  if (alvoId === undefined) return <ChamadoNaoEncontrado />;

  if (chamadoQuery.isPending) {
    return (
      <div className="card py-12 text-center text-gray-500">
        Carregando chamado…
      </div>
    );
  }

  if (naoEncontrado) return <ChamadoNaoEncontrado />;

  if (chamadoQuery.isError) {
    return (
      <div className="card flex flex-col items-center gap-2 py-12 text-center">
        <p className="text-red-500">
          {mensagemDeErro(
            chamadoQuery.error,
            'Não foi possível carregar o chamado. Verifique sua conexão.',
          )}
        </p>
        <div className="flex gap-2">
          <button onClick={() => void chamadoQuery.refetch()} className="btn-secondary">
            Tentar novamente
          </button>
          <Link to="/chamados" className="btn-secondary">
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  if (!usuario || !chamado) return <ChamadoNaoEncontrado />;

  const c = chamado;

  const podeVer =
    usuario.role === 'SINDICO' ||
    usuario.role === 'ADMINISTRADOR' ||
    (usuario.role === 'CONDOMINO' && chamado.criadoPorId === usuario.id) ||
    (usuario.role === 'PRESTADOR' &&
      (chamado.prestadorId === usuario.id || chamado.status === 'REVISADO'));

  const podeAprovar =
    (usuario.role === 'SINDICO' || usuario.role === 'ADMINISTRADOR') &&
    chamado.status === 'AGUARDANDO_APROVACAO';
  const podeIniciar =
    (usuario.role === 'SINDICO' ||
      usuario.role === 'PRESTADOR' ||
      usuario.role === 'ADMINISTRADOR') &&
    chamado.status === 'REVISADO' &&
    (usuario.role === 'SINDICO' ||
      usuario.role === 'ADMINISTRADOR' ||
      chamado.prestadorId === usuario.id);
  const podeConcluir =
    (usuario.role === 'PRESTADOR' || usuario.role === 'ADMINISTRADOR') &&
    chamado.status === 'EM_ANDAMENTO' &&
    (usuario.role === 'ADMINISTRADOR' || chamado.prestadorId === usuario.id);

  const podeGerenciarDespesas =
    (usuario.role === 'SINDICO' || usuario.role === 'ADMINISTRADOR') ||
    (usuario.role === 'PRESTADOR' && chamado.prestadorId === usuario.id);

  const podeAprovarDespesas =
    usuario.role === 'SINDICO' || usuario.role === 'ADMINISTRADOR';

  const despesas = chamado.despesas || [];
  const resumo = chamado.resumoFinanceiro || {
    totalCentavos: 0,
    aprovadoCentavos: 0,
    pendenteCentavos: 0,
    rejeitadoCentavos: 0,
  };

  function abrirAprovacao() {
    setPrioridadeSel(c.classificacao?.prioridadeSugerida ?? 'MEDIA');
    setModalAprovar(true);
  }

  // Ações disparadas de um modal reportam o erro via toast: o banner `erroAcao`
  // fica renderizado fora do modal e estaria escondido atrás do overlay.
  async function aprovar() {
    if (!prestadorSel || aprovarChamado.isPending) return;
    setErroAcao('');
    try {
      await aprovarChamado.mutateAsync({
        id: c.id,
        prioridade: prioridadeSel,
        prestadorId: Number(prestadorSel),
      });
      setModalAprovar(false);
      toast.success('Chamado aprovado e liberado para atendimento.');
    } catch (err) {
      toast.error(mensagemDeErro(err, 'Não foi possível aprovar.'));
    }
  }

  async function iniciar() {
    if (iniciarChamado.isPending) return;
    setErroAcao('');
    try {
      await iniciarChamado.mutateAsync(c.id);
      toast.success('Chamado em andamento.');
    } catch (err) {
      // O banner fica na própria página, então aqui o erro inline continua visível.
      setErroAcao(mensagemDeErro(err, 'Não foi possível iniciar.'));
    }
  }

  async function concluir() {
    if (!solDesc.trim() || !solMat.trim() || concluirChamado.isPending) return;
    setErroAcao('');
    try {
      await concluirChamado.mutateAsync({
        id: c.id,
        solucao: { descricao: solDesc.trim(), materiais: solMat.trim() },
      });
      setModalConcluir(false);
      setSolDesc('');
      setSolMat('');
      toast.success('Chamado concluído.');
    } catch (err) {
      toast.error(mensagemDeErro(err, 'Não foi possível concluir.'));
    }
  }

  // O formulário é desmontado ao fechar o modal, então sempre abre em branco
  function abrirNovaDespesa() {
    setErroAcao('');
    setModalDespesa(true);
  }

  async function salvarDespesa(input: CriarDespesaInput) {
    if (criarDespesa.isPending) return;
    setErroAcao('');
    try {
      await criarDespesa.mutateAsync({ chamadoId: c.id, input });
      setModalDespesa(false);
      toast.success('Despesa lançada.');
    } catch (err) {
      toast.error(mensagemDeErro(err, 'Não foi possível lançar a despesa.'));
    }
  }

  async function aprovarDespesaAcao(despesaId: number) {
    const d = despesas.find((x) => x.id === despesaId);
    if (d && d.anexos.length === 0) {
      const ok = window.confirm(
        'Esta despesa não possui comprovante/anexo. Tem certeza que deseja aprová-la mesmo assim?',
      );
      if (!ok) return;
    } else if (d && d.anexos.length > 0 && d.categoria === 'SERVICO_TERCEIRO') {
      const temFiscal = d.anexos.some((a) => a.tipoDocumentoFiscal === 'NFE' || a.tipoDocumentoFiscal === 'NFSE');
      if (!temFiscal) {
        const ok = window.confirm(
          'Para despesa de SERVIÇO TERCEIRO, recomenda-se anexar NFe ou NFS-e. Tem certeza que deseja aprová-la mesmo assim?',
        );
        if (!ok) return;
      }
    }
    try {
      await aprovarDespesa.mutateAsync({ chamadoId: c.id, despesaId });
      toast.success('Despesa aprovada.');
    } catch (err) {
      toast.error(mensagemDeErro(err, 'Não foi possível aprovar.'));
    }
  }

  function abrirRejeitar(despesaId: number) {
    setDespesaRejeitarId(despesaId);
    setMotivoRejeicao('');
    setModalRejeitar(true);
  }

  async function rejeitarDespesaAcao() {
    if (!despesaRejeitarId || !motivoRejeicao.trim() || rejeitarDespesa.isPending) return;
    try {
      await rejeitarDespesa.mutateAsync({
        chamadoId: c.id,
        despesaId: despesaRejeitarId,
        motivo: motivoRejeicao.trim(),
      });
      setModalRejeitar(false);
      toast.success('Despesa rejeitada.');
    } catch (err) {
      toast.error(mensagemDeErro(err, 'Não foi possível rejeitar.'));
    }
  }

  async function removerDespesaAcao(despesaId: number) {
    if (!confirm('Remover esta despesa?')) return;
    try {
      await removerDespesa.mutateAsync({ chamadoId: c.id, despesaId });
      toast.success('Despesa removida.');
    } catch (err) {
      toast.error(mensagemDeErro(err, 'Não foi possível remover.'));
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
          <PrioridadeBadge
            prioridade={chamado.prioridade}
            sugestao={chamado.classificacao?.prioridadeSugerida}
          />
        </div>

        {chamado.classificacao && (
          <div className="mt-4 rounded-lg border border-brand-100 bg-brand-50 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-600" />
              <span className="text-sm font-semibold text-brand-700">
                Sugestão automática
              </span>
              <PrioridadeBadge
                prioridade={chamado.classificacao.prioridadeSugerida}
              />
              <span className="text-xs text-gray-500">
                {chamado.classificacao.pontuacao}/100
              </span>
            </div>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {chamado.classificacao.motivos.map((motivo) => (
                <li
                  key={motivo}
                  className="rounded bg-white px-2 py-0.5 text-[11px] text-gray-600 ring-1 ring-gray-200"
                >
                  {motivo}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-gray-500">
              Sugestão do sistema. A prioridade final é definida pelo síndico na
              aprovação.
            </p>
          </div>
        )}

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
            <div className="text-xs text-gray-500">Condômino</div>
            <div className="font-medium">{nomeUsuario(chamado.criadoPorId)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Prestador</div>
            <div className="font-medium">
              {chamado.prestadorId ? nomeUsuario(chamado.prestadorId) : 'Não atribuído'}
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
              <button onClick={abrirAprovacao} className="btn-primary">
                <Briefcase className="h-4 w-4" /> Aprovar e Liberar Chamado
              </button>
            )}
            {podeIniciar && (
              <button
                onClick={() => void iniciar()}
                className="btn-primary"
                disabled={iniciarChamado.isPending}
              >
                <Play className="h-4 w-4" />{' '}
                {iniciarChamado.isPending ? 'Iniciando…' : 'Iniciar atendimento'}
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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-semibold text-gray-800">
            <Receipt className="h-4 w-4" /> Custos e notas fiscais
          </h2>
          {podeGerenciarDespesas && chamado.status === 'EM_ANDAMENTO' && (
            <button onClick={abrirNovaDespesa} className="btn-secondary !px-2 !py-1 text-xs">
              <Plus className="h-3 w-3" /> Adicionar despesa
            </button>
          )}
        </div>
        <div className="mb-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div className="rounded-lg bg-gray-50 p-2">
            <div className="text-xs text-gray-500">Total</div>
            <div className="font-semibold">{formatarMoeda(resumo.totalCentavos)}</div>
          </div>
          <div className="rounded-lg bg-emerald-50 p-2">
            <div className="text-xs text-gray-500">Aprovado</div>
            <div className="font-semibold text-emerald-700">{formatarMoeda(resumo.aprovadoCentavos)}</div>
          </div>
          <div className="rounded-lg bg-amber-50 p-2">
            <div className="text-xs text-gray-500">Pendente</div>
            <div className="font-semibold text-amber-700">{formatarMoeda(resumo.pendenteCentavos)}</div>
          </div>
          <div className="rounded-lg bg-red-50 p-2">
            <div className="text-xs text-gray-500">Rejeitado</div>
            <div className="font-semibold text-red-700">{formatarMoeda(resumo.rejeitadoCentavos)}</div>
          </div>
        </div>
        {usuario.role === 'CONDOMINO' ? (
          <p className="text-xs text-gray-500">Apenas o total aprovado é exibido.</p>
        ) : despesas.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma despesa lançada.</p>
        ) : (
          <div className="space-y-2">
            {despesas.map((d) => (
              <div key={d.id} className="rounded-lg border border-gray-100 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{d.descricao}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusDespesaColor[d.status]}`}>
                        {statusDespesaLabel[d.status]}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {categoriaDespesaLabel[d.categoria]}
                      {d.fornecedor ? ` · ${d.fornecedor}` : ''}
                      {d.numeroNota ? ` · NF ${d.numeroNota}` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatarMoeda(d.valorCentavos)}</div>
                    <div className="text-xs text-gray-400">{d.anexos.length} anexo(s)</div>
                  </div>
                </div>
                {d.motivoRejeicao && (
                  <div className="mt-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700">
                    Motivo: {d.motivoRejeicao}
                  </div>
                )}
                {d.anexos.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {d.anexos.map((a) => (
                      <div key={a.id} className="flex flex-wrap items-center gap-2 rounded bg-gray-50 px-2 py-1 text-xs text-gray-600">
                        <FileText className="h-3 w-3 shrink-0" />
                        <span className="min-w-0 flex-1 truncate">
                          {a.tipoDocumentoFiscal ? tipoDocumentoFiscalLabel[a.tipoDocumentoFiscal as keyof typeof tipoDocumentoFiscalLabel] : tipoAnexoLabel[a.tipo]} · {a.nomeArquivo}
                        </span>
                        <button
                          type="button"
                          onClick={() => abrirAnexo(a)}
                          className="font-medium text-brand-700 hover:underline"
                        >
                          Visualizar
                        </button>
                        <button
                          type="button"
                          onClick={() => baixarAnexo(a)}
                          className="font-medium text-brand-700 hover:underline"
                        >
                          Baixar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {podeAprovarDespesas && d.status === 'PENDENTE' && (
                    <>
                      <button onClick={() => void aprovarDespesaAcao(d.id)} className="btn-primary !px-2 !py-1 text-xs" disabled={aprovarDespesa.isPending}>
                        Aprovar
                      </button>
                      <button onClick={() => abrirRejeitar(d.id)} className="btn-secondary !px-2 !py-1 text-xs">
                        Rejeitar
                      </button>
                    </>
                  )}
                  {podeGerenciarDespesas && d.status === 'PENDENTE' && (
                    <button onClick={() => void removerDespesaAcao(d.id)} className="btn-secondary !px-2 !py-1 text-xs text-red-600" disabled={removerDespesa.isPending}>
                      <Trash2 className="h-3 w-3" /> Remover
                    </button>
                  )}
                </div>
              </div>
            ))}
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
            {c.classificacao && (
              <p className="mt-2 text-xs text-gray-500">
                Sugestão automática:{' '}
                {prioridadeLabel[c.classificacao.prioridadeSugerida]} (
                {c.classificacao.pontuacao}/100).
              </p>
            )}
          </div>
          <div>
            <label className="label">Atribuir ao prestador</label>
            <select
              className="input"
              value={prestadorSel}
              onChange={(e) => setPrestadorSel(e.target.value)}
            >
              <option value="">Selecione o prestador</option>
              {prestadores.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                  {t.especialidade ? ` (${t.especialidade})` : ''}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => void aprovar()}
            className="btn-primary w-full"
            disabled={!prestadorSel || aprovarChamado.isPending}
          >
            {aprovarChamado.isPending ? 'Aprovando…' : 'Aprovar e atribuir'}
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
              maxLength={2000}
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
            onClick={() => void concluir()}
            className="btn-primary w-full"
            disabled={
              !solDesc.trim() || !solMat.trim() || concluirChamado.isPending
            }
          >
            {concluirChamado.isPending ? 'Concluindo…' : 'Concluir'}
          </button>
        </div>
      </Modal>

      <Modal open={modalDespesa} onClose={() => setModalDespesa(false)} title="Adicionar despesa">
        <FormularioDespesa
          salvando={criarDespesa.isPending}
          onSalvar={salvarDespesa}
        />
      </Modal>

      <Modal open={modalRejeitar} onClose={() => setModalRejeitar(false)} title="Rejeitar despesa">
        <div className="space-y-3">
          <div>
            <label className="label">Motivo</label>
            <textarea className="input min-h-[80px]" value={motivoRejeicao} onChange={(e) => setMotivoRejeicao(e.target.value)} maxLength={500} placeholder="Informe o motivo da rejeição" />
          </div>
          <button onClick={() => void rejeitarDespesaAcao()} className="btn-primary w-full" disabled={!motivoRejeicao.trim() || rejeitarDespesa.isPending}>
            {rejeitarDespesa.isPending ? 'Rejeitando…' : 'Rejeitar'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
