import { Link } from 'react-router-dom';
import {
  BarChart3,
  FileText,
  Receipt,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRelatorioDespesas } from '../hooks/useRelatorios';
import { useDiretorio } from '../hooks/useUsuarios';
import { categoriaDespesaLabel, formatarData, formatarMoeda, statusDespesaLabel } from '../helpers';
import { EmptyState } from '../components/EmptyState';
import { useState } from 'react';

export function RelatoriosDespesas() {
  const { usuario } = useAuth();
  const { usuarios } = useDiretorio();
  const [filtros, setFiltros] = useState({
    de: '',
    ate: '',
    status: '',
    categoria: '',
    registradoPorId: '',
    temDocumento: '',
  });
  const { data, isPending, error, refetch } = useRelatorioDespesas(filtros);

  if (!usuario || (usuario.role !== 'GESTOR' && usuario.role !== 'ADMINISTRADOR')) {
    return (
      <div className="card py-12 text-center text-gray-500">
        Apenas gestor ou administrador podem acessar relatórios.
      </div>
    );
  }

  const resumo = data?.resumo || {
    totalCentavos: 0,
    aprovadoCentavos: 0,
    pendenteCentavos: 0,
    rejeitadoCentavos: 0,
    quantidade: 0,
    aprovadas: 0,
    comDocumento: 0,
    pctComDocumento: 0,
  };
  const despesas = data?.despesas || [];
  const porCategoria = data?.porCategoria || {};
  const porRegistrante = data?.porRegistrante || {};
  const registrantes = [...(usuarios || [])].sort((a, b) => a.nome.localeCompare(b.nome));

  const cards = [
    { label: 'Total', valor: formatarMoeda(resumo.totalCentavos), icon: Receipt, cor: 'bg-brand-500 text-white' },
    { label: 'Aprovado', valor: formatarMoeda(resumo.aprovadoCentavos), icon: TrendingUp, cor: 'bg-emerald-500 text-white' },
    { label: 'Pendente', valor: formatarMoeda(resumo.pendenteCentavos), icon: FileText, cor: 'bg-amber-500 text-white' },
    { label: 'Com documento fiscal', valor: `${resumo.comDocumento}/${resumo.aprovadas} (${resumo.pctComDocumento}%)`, icon: BarChart3, cor: 'bg-blue-500 text-white' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatório de Despesas</h1>
        <p className="text-sm text-gray-500">Consolidado por chamado, registrante, categoria e tipo de documento</p>
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold text-gray-800">Filtros</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <input type="date" className="input" value={filtros.de} onChange={(e) => setFiltros((f) => ({ ...f, de: e.target.value }))} />
          <input type="date" className="input" value={filtros.ate} onChange={(e) => setFiltros((f) => ({ ...f, ate: e.target.value }))} />
          <select className="input" value={filtros.status} onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))}>
            <option value="">Status: todos</option>
            <option value="PENDENTE">Pendente</option>
            <option value="APROVADA">Aprovada</option>
            <option value="REJEITADA">Rejeitada</option>
          </select>
          <select className="input" value={filtros.categoria} onChange={(e) => setFiltros((f) => ({ ...f, categoria: e.target.value }))}>
            <option value="">Categoria: todas</option>
            <option value="MATERIAL">Material</option>
            <option value="MAO_DE_OBRA">Mão de obra</option>
            <option value="SERVICO_TERCEIRO">Serviço terceiro</option>
            <option value="DESLOCAMENTO">Deslocamento</option>
            <option value="OUTROS">Outros</option>
          </select>
          <select className="input" value={filtros.registradoPorId} onChange={(e) => setFiltros((f) => ({ ...f, registradoPorId: e.target.value }))}>
            <option value="">Registrado por: todos</option>
            {registrantes.map((t) => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
          <select className="input" value={filtros.temDocumento} onChange={(e) => setFiltros((f) => ({ ...f, temDocumento: e.target.value }))}>
            <option value="">Documento fiscal: todos</option>
            <option value="sim">Com documento classificado</option>
            <option value="nao">Sem documento classificado</option>
          </select>
        </div>
        <div className="mt-2 flex gap-2">
          <button onClick={() => refetch()} className="btn-primary !px-2 !py-1 text-xs">Aplicar</button>
          <button onClick={() => setFiltros({ de: '', ate: '', status: '', categoria: '', registradoPorId: '', temDocumento: '' })} className="btn-secondary !px-2 !py-1 text-xs">Limpar</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card !p-4">
              <div className={`mb-2 inline-flex rounded-lg p-2 ${card.cor}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-lg font-bold text-gray-900">{card.valor}</div>
              <div className="mt-1 text-xs text-gray-500">{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-semibold text-gray-800">Por categoria</h2>
          <div className="space-y-2">
            {Object.entries(porCategoria).length === 0 ? (
              <p className="text-sm text-gray-400">Sem dados</p>
            ) : (
              Object.entries(porCategoria).map(([cat, val]) => (
                <div key={cat} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span className="text-sm text-gray-600">{categoriaDespesaLabel[cat as keyof typeof categoriaDespesaLabel] || cat}</span>
                  <span className="text-sm font-semibold">{formatarMoeda(val as number)}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="card">
          <h2 className="mb-3 font-semibold text-gray-800">Por registrante</h2>
          <div className="space-y-2">
            {Object.entries(porRegistrante).length === 0 ? (
              <p className="text-sm text-gray-400">Sem dados</p>
            ) : (
              Object.entries(porRegistrante).map(([tid, val]) => {
                const u = usuarios?.find((x) => String(x.id) === tid);
                return (
                  <div key={tid} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <span className="flex items-center gap-2 text-sm text-gray-600"><Users className="h-4 w-4" /> {u?.nome || `Usuário #${tid}`}</span>
                    <span className="text-sm font-semibold">{formatarMoeda(val as number)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="border-b border-gray-200 p-4">
          <h2 className="font-semibold text-gray-800">Despesas detalhadas</h2>
          <p className="text-xs text-gray-500">{despesas.length} registro(s)</p>
        </div>
        {isPending ? (
          <div className="p-6 text-center text-gray-500">Carregando...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">Erro ao carregar relatório</div>
        ) : despesas.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={Receipt} titulo="Nenhuma despesa" descricao="Ajuste os filtros para ver resultados." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Chamado</th>
                  <th className="px-4 py-3">Registrado por</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Fornecedor</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Docs</th>
                </tr>
              </thead>
              <tbody>
                {despesas.map((d) => {
                  const u = usuarios?.find((x) => x.id === d.registradoPorId);
                  const docs = d.anexos?.filter((a) => a.tipoDocumentoFiscal).map((a) => a.tipoDocumentoFiscal).join(', ');
                  return (
                    <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-500">{formatarData(d.criadoEm)}</td>
                      <td className="px-4 py-3">
                        <Link to={`/chamados/${d.chamadoId}`} className="text-brand-700 hover:underline">
                          #{d.chamadoNumero} {d.chamadoTitulo?.substring(0, 40)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{u?.nome || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{categoriaDespesaLabel[d.categoria] || d.categoria}</td>
                      <td className="px-4 py-3 text-gray-600">{d.fornecedor || '-'}</td>
                      <td className="px-4 py-3 font-semibold">{formatarMoeda(d.valorCentavos)}</td>
                      <td className="px-4 py-3 text-xs">{statusDespesaLabel[d.status]}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{docs || (d.anexos?.length ? 'Anexo(s)' : 'Sem classif.')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
