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
  Trash2,
  Upload,
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
import {
  categoriaDespesaLabel,
  categoriaLabel,
  formatarData,
  formatarMoeda,
  parseMoedaParaCentavos,
  prioridadeLabel,
  statusDespesaColor,
  statusDespesaLabel,
  statusLabel,
  tipoAnexoLabel,
  tipoDocumentoFiscalLabel,
} from '../helpers';
import { PrioridadeBadge, StatusBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import type { CategoriaDespesa, Prioridade } from '../types';

const prioridades: Prioridade[] = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];

const categoriasDespesa: CategoriaDespesa[] = [
  'MATERIAL',
  'MAO_DE_OBRA',
  'SERVICO_TERCEIRO',
  'DESLOCAMENTO',
  'OUTROS',
];

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
  const { tecnicos, nomeUsuario } = useDiretorio();

  const [modalAprovar, setModalAprovar] = useState(false);
  const [modalConcluir, setModalConcluir] = useState(false);
  const [modalDespesa, setModalDespesa] = useState(false);
  const [modalRejeitar, setModalRejeitar] = useState(false);
  const [prioridadeSel, setPrioridadeSel] = useState<Prioridade>('MEDIA');
  const [tecnicoSel, setTecnicoSel] = useState('');
  const [solDesc, setSolDesc] = useState('');
  const [solMat, setSolMat] = useState('');
  const [erroAcao, setErroAcao] = useState('');
  const [despCat, setDespCat] = useState<CategoriaDespesa>('MATERIAL');
  const [despDesc, setDespDesc] = useState('');
  const [despValor, setDespValor] = useState('');
  const [despFornecedor, setDespFornecedor] = useState('');
  const [despNota, setDespNota] = useState('');
  const [despData, setDespData] = useState('');
  const [despAnexos, setDespAnexos] = useState<
    Array<{
      tipo: 'NOTA_FISCAL' | 'RECIBO' | 'COMPROVANTE_PAGAMENTO' | 'OUTRO';
      tipoDocumentoFiscal?: 'NFE' | 'NFSE' | 'NFCE' | 'CUPOM_FISCAL' | 'RECIBO' | 'BOLETO_COMPROVANTE' | 'OUTRO';
      nomeArquivo: string;
      mimeType: string;
      tamanhoBytes: number;
      conteudo: string;
    }>
  >([]);
  const [anexoTipoDoc, setAnexoTipoDoc] = useState<string>('');
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

  const podeGerenciarDespesas =
    (usuario.role === 'GESTOR' || usuario.role === 'ADMINISTRADOR') ||
    (usuario.role === 'TECNICO' && chamado.tecnicoId === usuario.id);

  const podeAprovarDespesas =
    usuario.role === 'GESTOR' || usuario.role === 'ADMINISTRADOR';

  const despesas = chamado.despesas || [];
  const resumo = chamado.resumoFinanceiro || {
    totalCentavos: 0,
    aprovadoCentavos: 0,
    pendenteCentavos: 0,
    rejeitadoCentavos: 0,
  };

  function abrirAprovacao() {
    setPrioridadeSel('MEDIA');
    setModalAprovar(true);
  }

  // Ações disparadas de um modal reportam o erro via toast: o banner `erroAcao`
  // fica renderizado fora do modal e estaria escondido atrás do overlay.
  async function aprovar() {
    if (!tecnicoSel || aprovarChamado.isPending) return;
    setErroAcao('');
    try {
      await aprovarChamado.mutateAsync({
        id: c.id,
        prioridade: prioridadeSel,
        tecnicoId: Number(tecnicoSel),
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

  function abrirNovaDespesa() {
    setDespCat('MATERIAL');
    setDespDesc('');
    setDespValor('');
    setDespFornecedor('');
    setDespNota('');
    setDespData('');
    setDespAnexos([]);
    setAnexoTipoDoc('');
    setErroAcao('');
    setModalDespesa(true);
  }

  async function adicionarAnexoDespesaArquivo(arquivo: File) {
    if (!arquivo) return;
    if (arquivo.size > 5 * 1024 * 1024) {
      toast.error('Anexo excede o limite de 5MB.');
      return;
    }
    const mime = arquivo.type || 'application/octet-stream';
    if (!['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(mime)) {
      toast.error('Tipo de arquivo não permitido.');
      return;
    }
    if (despAnexos.length >= 5) {
      toast.error('Máximo de 5 anexos por despesa.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const conteudo = String(reader.result || '');
      setDespAnexos((prev) => [
        ...prev,
        {
          tipo: mime === 'application/pdf' ? 'NOTA_FISCAL' : 'COMPROVANTE_PAGAMENTO',
          tipoDocumentoFiscal: (anexoTipoDoc as any) || undefined,
          nomeArquivo: arquivo.name,
          mimeType: mime,
          tamanhoBytes: arquivo.size,
          conteudo,
        },
      ]);
    };
    reader.readAsDataURL(arquivo);
  }

  async function salvarDespesa() {
    if (!despDesc.trim() || !despValor || criarDespesa.isPending) return;
    const valorCentavos = parseMoedaParaCentavos(despValor);
    if (valorCentavos <= 0) {
      toast.error('Informe um valor válido.');
      return;
    }
    setErroAcao('');
    try {
      await criarDespesa.mutateAsync({
        chamadoId: c.id,
        input: {
          categoria: despCat,
          descricao: despDesc.trim(),
          fornecedor: despFornecedor.trim() || undefined,
          numeroNota: despNota.trim() || undefined,
          dataEmissao: despData || undefined,
          valorCentavos,
          anexos: despAnexos,
        },
      });
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
        {usuario.role === 'SOLICITANTE' ? (
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
                  <div className="mt-2 flex flex-wrap gap-1">
                    {d.anexos.map((a) => (
                      <span key={a.id} className="flex items-center gap-1 rounded bg-gray-50 px-2 py-0.5 text-xs text-gray-600">
                        <FileText className="h-3 w-3" />
                        {a.tipoDocumentoFiscal ? tipoDocumentoFiscalLabel[a.tipoDocumentoFiscal as keyof typeof tipoDocumentoFiscalLabel] : tipoAnexoLabel[a.tipo]} · {a.nomeArquivo}
                      </span>
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
                  {t.nome}
                  {t.especialidade ? ` (${t.especialidade})` : ''}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => void aprovar()}
            className="btn-primary w-full"
            disabled={!tecnicoSel || aprovarChamado.isPending}
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
        <div className="space-y-3">
          <div>
            <label className="label">Categoria</label>
            <select className="input" value={despCat} onChange={(e) => setDespCat(e.target.value as CategoriaDespesa)}>
              {categoriasDespesa.map((c) => (
                <option key={c} value={c}>{categoriaDespesaLabel[c]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Descrição</label>
            <input className="input" value={despDesc} onChange={(e) => setDespDesc(e.target.value)} placeholder="Ex: Compra de peças" />
          </div>
          <div>
            <label className="label">Valor (R$)</label>
            <input className="input" value={despValor} onChange={(e) => setDespValor(e.target.value)} placeholder="Ex: 150,00" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Fornecedor</label>
              <input className="input" value={despFornecedor} onChange={(e) => setDespFornecedor(e.target.value)} />
            </div>
            <div>
              <label className="label">Nº da Nota</label>
              <input className="input" value={despNota} onChange={(e) => setDespNota(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Data de emissão</label>
            <input type="date" className="input" value={despData} onChange={(e) => setDespData(e.target.value)} />
          </div>
          <div>
            <label className="label">Tipo de documento fiscal (opcional)</label>
            <select className="input" value={anexoTipoDoc} onChange={(e) => setAnexoTipoDoc(e.target.value)}>
              <option value="">Não classificar</option>
              <option value="NFE">NF-e (NFe)</option>
              <option value="NFSE">NFS-e</option>
              <option value="NFCE">NFC-e</option>
              <option value="CUPOM_FISCAL">Cupom Fiscal</option>
              <option value="RECIBO">Recibo</option>
              <option value="BOLETO_COMPROVANTE">Comprovante/Boleto</option>
              <option value="OUTRO">Outro</option>
            </select>
          </div>
          <div>
            <label className="label">Anexos (NF/comprovante)</label>
            <label className="btn-secondary inline-flex cursor-pointer !px-2 !py-1 text-xs">
              <Upload className="h-3 w-3" /> Adicionar arquivo
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void adicionarAnexoDespesaArquivo(f);
                e.target.value = '';
              }} />
            </label>
            {despAnexos.length > 0 && (
              <div className="mt-2 space-y-1">
                {despAnexos.map((a, i) => (
                  <div key={i} className="flex items-center justify-between rounded bg-gray-50 px-2 py-1 text-xs">
                    <span className="truncate">{a.nomeArquivo}</span>
                    <button onClick={() => setDespAnexos((p) => p.filter((_, idx) => idx !== i))} className="text-red-500">Remover</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => void salvarDespesa()} className="btn-primary w-full" disabled={!despDesc.trim() || !despValor || criarDespesa.isPending}>
            {criarDespesa.isPending ? 'Salvando…' : 'Salvar despesa'}
          </button>
        </div>
      </Modal>

      <Modal open={modalRejeitar} onClose={() => setModalRejeitar(false)} title="Rejeitar despesa">
        <div className="space-y-3">
          <div>
            <label className="label">Motivo</label>
            <textarea className="input min-h-[80px]" value={motivoRejeicao} onChange={(e) => setMotivoRejeicao(e.target.value)} placeholder="Informe o motivo da rejeição" />
          </div>
          <button onClick={() => void rejeitarDespesaAcao()} className="btn-primary w-full" disabled={!motivoRejeicao.trim() || rejeitarDespesa.isPending}>
            {rejeitarDespesa.isPending ? 'Rejeitando…' : 'Rejeitar'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
