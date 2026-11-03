import { useId, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import type { CriarDespesaInput } from '../api/despesas';
import {
  apenasDigitos,
  categoriaDespesaLabel,
  dataLocalIso,
  formaPagamentoLabel,
  formatarChaveNFe,
  formatarCpfCnpj,
  pagoPorLabel,
} from '../helpers';
import type {
  CategoriaDespesa,
  FormaPagamento,
  PagoPor,
  TipoDocumentoFiscal,
} from '../types';
import { CampoMoeda } from './CampoMoeda';

type Anexo = NonNullable<CriarDespesaInput['anexos']>[number];
type AnexoArquivo = Omit<Anexo, 'tipoDocumentoFiscal' | 'chaveNFe'>;

const categoriasDespesa: CategoriaDespesa[] = [
  'MATERIAL',
  'MAO_DE_OBRA',
  'SERVICO_TERCEIRO',
  'DESLOCAMENTO',
  'OUTROS',
];

// Limites iguais aos validados pelo backend (CriarDespesaDto)
const MAX_DESCRICAO = 500;
const MAX_FORNECEDOR = 200;
const MAX_DIGITOS_NOTA = 15;
const MAX_DIGITOS_SERIE = 3;
const DIGITOS_CHAVE_NFE = 44;
const MAX_ANEXOS = 5;
const MAX_BYTES_ANEXO = 5 * 1024 * 1024;
const TIPOS_ANEXO = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

// Só NF-e e NFC-e têm chave de acesso de 44 dígitos
const TEM_CHAVE: TipoDocumentoFiscal[] = ['NFE', 'NFCE'];

interface Props {
  salvando: boolean;
  onSalvar: (input: CriarDespesaInput) => void | Promise<void>;
}

// Formulário de "Adicionar despesa": cada campo já aceita só o formato que a API
// espera (valor em centavos, documento e nota só com dígitos, data até hoje).
export function FormularioDespesa({ salvando, onSalvar }: Props) {
  const id = useId();
  const [categoria, setCategoria] = useState<CategoriaDespesa>('MATERIAL');
  const [descricao, setDescricao] = useState('');
  const [valorCentavos, setValorCentavos] = useState(0);
  const [fornecedor, setFornecedor] = useState('');
  const [documento, setDocumento] = useState('');
  const [numeroNota, setNumeroNota] = useState('');
  const [serie, setSerie] = useState('');
  const [dataEmissao, setDataEmissao] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento | ''>('');
  const [pagoPor, setPagoPor] = useState<PagoPor | ''>('');
  const [tipoDoc, setTipoDoc] = useState<TipoDocumentoFiscal | ''>('');
  const [chaveNFe, setChaveNFe] = useState('');
  const [anexos, setAnexos] = useState<AnexoArquivo[]>([]);
  const [erro, setErro] = useState('');

  const hoje = dataLocalIso();
  const temChave = tipoDoc !== '' && TEM_CHAVE.includes(tipoDoc);
  const podeSalvar =
    Boolean(descricao.trim()) && valorCentavos > 0 && !salvando;

  function adicionarAnexo(arquivo: File) {
    if (arquivo.size > MAX_BYTES_ANEXO) {
      toast.error('Anexo excede o limite de 5MB.');
      return;
    }
    const mime = arquivo.type || 'application/octet-stream';
    if (!TIPOS_ANEXO.includes(mime)) {
      toast.error('Tipo de arquivo não permitido.');
      return;
    }
    if (anexos.length >= MAX_ANEXOS) {
      toast.error('Máximo de 5 anexos por despesa.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAnexos((prev) => [
        ...prev,
        {
          tipo:
            mime === 'application/pdf'
              ? 'NOTA_FISCAL'
              : 'COMPROVANTE_PAGAMENTO',
          nomeArquivo: arquivo.name,
          mimeType: mime,
          tamanhoBytes: arquivo.size,
          conteudo: String(reader.result || ''),
        },
      ]);
    };
    reader.readAsDataURL(arquivo);
  }

  // Devolve a mensagem do primeiro problema encontrado, ou '' se está tudo certo
  function validar(): string {
    const digitosDocumento = apenasDigitos(documento).length;
    if (
      digitosDocumento > 0 &&
      digitosDocumento !== 11 &&
      digitosDocumento !== 14
    ) {
      return 'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) completo.';
    }
    if (dataEmissao && dataEmissao > hoje) {
      return 'A data de emissão não pode ser no futuro.';
    }
    const digitosChave = apenasDigitos(chaveNFe);
    if (temChave && digitosChave) {
      if (digitosChave.length !== DIGITOS_CHAVE_NFE) {
        return 'A chave de acesso deve ter 44 dígitos.';
      }
      if (anexos.length === 0) {
        return 'Anexe a nota para registrar a chave de acesso.';
      }
    }
    return '';
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!podeSalvar) return;
    const problema = validar();
    setErro(problema);
    if (problema) return;

    const chave = temChave ? apenasDigitos(chaveNFe) || undefined : undefined;
    await onSalvar({
      categoria,
      descricao: descricao.trim(),
      valorCentavos,
      fornecedor: fornecedor.trim() || undefined,
      cnpj: documento || undefined,
      numeroNota: numeroNota || undefined,
      serie: serie || undefined,
      dataEmissao: dataEmissao || undefined,
      formaPagamento: formaPagamento || undefined,
      pagoPor: pagoPor || undefined,
      // O tipo de documento e a chave valem para todos os anexos desta despesa
      anexos: anexos.map((a) => ({
        ...a,
        tipoDocumentoFiscal: tipoDoc || undefined,
        chaveNFe: chave,
      })),
    });
  }

  return (
    <form onSubmit={(e) => void salvar(e)} className="space-y-3" noValidate>
      <div>
        <label htmlFor={`${id}-categoria`} className="label">
          Categoria
        </label>
        <select
          id={`${id}-categoria`}
          className="input"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value as CategoriaDespesa)}
        >
          {categoriasDespesa.map((c) => (
            <option key={c} value={c}>
              {categoriaDespesaLabel[c]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${id}-descricao`} className="label">
          Descrição
        </label>
        <input
          id={`${id}-descricao`}
          className="input"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          maxLength={MAX_DESCRICAO}
          placeholder="Ex: Compra de fios e disjuntor"
        />
      </div>
      <div>
        <label htmlFor={`${id}-valor`} className="label">
          Valor (R$)
        </label>
        <CampoMoeda
          id={`${id}-valor`}
          value={valorCentavos}
          onChange={setValorCentavos}
          placeholder="R$ 0,00"
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-fornecedor`} className="label">
            Fornecedor
          </label>
          <input
            id={`${id}-fornecedor`}
            className="input"
            value={fornecedor}
            onChange={(e) => setFornecedor(e.target.value)}
            maxLength={MAX_FORNECEDOR}
            placeholder="Ex: Casa das Ferragens Ltda"
          />
        </div>
        <div>
          <label htmlFor={`${id}-documento`} className="label">
            CPF/CNPJ do fornecedor
          </label>
          <input
            id={`${id}-documento`}
            className="input"
            inputMode="numeric"
            value={documento}
            onChange={(e) => setDocumento(formatarCpfCnpj(e.target.value))}
            placeholder="000.000.000-00 ou 00.000.000/0000-00"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor={`${id}-nota`} className="label">
            Nº da nota
          </label>
          <input
            id={`${id}-nota`}
            className="input"
            inputMode="numeric"
            value={numeroNota}
            onChange={(e) =>
              setNumeroNota(apenasDigitos(e.target.value, MAX_DIGITOS_NOTA))
            }
            placeholder="Ex: 123456"
          />
        </div>
        <div>
          <label htmlFor={`${id}-serie`} className="label">
            Série
          </label>
          <input
            id={`${id}-serie`}
            className="input"
            inputMode="numeric"
            value={serie}
            onChange={(e) =>
              setSerie(apenasDigitos(e.target.value, MAX_DIGITOS_SERIE))
            }
            placeholder="Ex: 1"
          />
        </div>
      </div>
      <div>
        <label htmlFor={`${id}-data`} className="label">
          Data de emissão
        </label>
        <input
          id={`${id}-data`}
          type="date"
          className="input"
          value={dataEmissao}
          max={hoje}
          onChange={(e) => setDataEmissao(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-pagamento`} className="label">
            Forma de pagamento
          </label>
          <select
            id={`${id}-pagamento`}
            className="input"
            value={formaPagamento}
            onChange={(e) =>
              setFormaPagamento(e.target.value as FormaPagamento | '')
            }
          >
            <option value="">Não informar</option>
            {(Object.keys(formaPagamentoLabel) as FormaPagamento[]).map((f) => (
              <option key={f} value={f}>
                {formaPagamentoLabel[f]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-pago-por`} className="label">
            Pago por
          </label>
          <select
            id={`${id}-pago-por`}
            className="input"
            value={pagoPor}
            onChange={(e) => setPagoPor(e.target.value as PagoPor | '')}
          >
            <option value="">Não informar</option>
            {(Object.keys(pagoPorLabel) as PagoPor[]).map((p) => (
              <option key={p} value={p}>
                {pagoPorLabel[p]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor={`${id}-tipo-doc`} className="label">
          Tipo de documento fiscal (opcional)
        </label>
        <select
          id={`${id}-tipo-doc`}
          className="input"
          value={tipoDoc}
          onChange={(e) =>
            setTipoDoc(e.target.value as TipoDocumentoFiscal | '')
          }
        >
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
      {temChave && (
        <div>
          <label htmlFor={`${id}-chave`} className="label">
            Chave de acesso (44 dígitos)
          </label>
          <input
            id={`${id}-chave`}
            className="input font-mono text-xs"
            inputMode="numeric"
            value={chaveNFe}
            onChange={(e) => setChaveNFe(formatarChaveNFe(e.target.value))}
            placeholder="0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000"
          />
          <p className="mt-1 text-xs text-gray-500">
            Fica registrada junto com os anexos da nota.
          </p>
        </div>
      )}
      <div>
        <span className="label">Anexos (NF/comprovante)</span>
        <label className="btn-secondary inline-flex cursor-pointer !px-2 !py-1 text-xs">
          <Upload className="h-3 w-3" /> Adicionar arquivo
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) adicionarAnexo(f);
              e.target.value = '';
            }}
          />
        </label>
        {anexos.length > 0 && (
          <div className="mt-2 space-y-1">
            {anexos.map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded bg-gray-50 px-2 py-1 text-xs"
              >
                <span className="truncate">{a.nomeArquivo}</span>
                <button
                  type="button"
                  onClick={() =>
                    setAnexos((p) => p.filter((_, idx) => idx !== i))
                  }
                  className="text-red-500"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {erro && (
        <div
          role="alert"
          className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white"
        >
          {erro}
        </div>
      )}
      <button
        type="submit"
        className="btn-primary w-full"
        disabled={!podeSalvar}
      >
        {salvando ? 'Salvando…' : 'Salvar despesa'}
      </button>
    </form>
  );
}
