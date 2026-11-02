import type {
  Categoria,
  CategoriaDespesa,
  FormaPagamento,
  PagoPor,
  Prioridade,
  Role,
  Status,
  StatusDespesa,
  TipoAnexo,
} from './types';

export const statusLabel: Record<Status, string> = {
  AGUARDANDO_APROVACAO: 'Aguardando Aprovação',
  REVISADO: 'Revisado',
  EM_ANDAMENTO: 'Em Andamento',
  CONCLUIDO: 'Concluído',
};

export const statusDespesaLabel: Record<StatusDespesa, string> = {
  PENDENTE: 'Pendente',
  APROVADA: 'Aprovada',
  REJEITADA: 'Rejeitada',
};

export const statusDespesaColor: Record<StatusDespesa, string> = {
  PENDENTE: 'bg-amber-500 text-white',
  APROVADA: 'bg-emerald-500 text-white',
  REJEITADA: 'bg-red-500 text-white',
};

export const categoriaDespesaLabel: Record<CategoriaDespesa, string> = {
  MATERIAL: 'Material',
  MAO_DE_OBRA: 'Mão de obra',
  SERVICO_TERCEIRO: 'Serviço terceiro',
  DESLOCAMENTO: 'Deslocamento',
  OUTROS: 'Outros',
};

export const formaPagamentoLabel: Record<FormaPagamento, string> = {
  DINHEIRO: 'Dinheiro',
  PIX: 'PIX',
  CARTAO: 'Cartão',
  FATURADO: 'Faturado',
};

export const pagoPorLabel: Record<PagoPor, string> = {
  TECNICO: 'Prestador',
  EMPRESA: 'Empresa',
};

export const tipoAnexoLabel: Record<TipoAnexo, string> = {
  NOTA_FISCAL: 'Nota Fiscal',
  RECIBO: 'Recibo',
  COMPROVANTE_PAGAMENTO: 'Comprovante de Pagamento',
  OUTRO: 'Outro',
};

export const tipoDocumentoFiscalLabel: Record<
  'NFE' | 'NFSE' | 'NFCE' | 'CUPOM_FISCAL' | 'RECIBO' | 'BOLETO_COMPROVANTE' | 'OUTRO',
  string
> = {
  NFE: 'NF-e (NFe)',
  NFSE: 'NFS-e',
  NFCE: 'NFC-e',
  CUPOM_FISCAL: 'Cupom Fiscal',
  RECIBO: 'Recibo',
  BOLETO_COMPROVANTE: 'Comprovante/Boleto',
  OUTRO: 'Outro',
};

export const statusColor: Record<Status, string> = {
  AGUARDANDO_APROVACAO: 'bg-amber-500 text-white',
  REVISADO: 'bg-blue-500 text-white',
  EM_ANDAMENTO: 'bg-indigo-500 text-white',
  CONCLUIDO: 'bg-emerald-500 text-white',
};

export const prioridadeLabel: Record<Prioridade, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
};

export const prioridadeColor: Record<Prioridade, string> = {
  BAIXA: 'bg-emerald-500 text-white',
  MEDIA: 'bg-yellow-500 text-yellow-950',
  ALTA: 'bg-orange-500 text-white',
  CRITICA: 'bg-red-500 text-white',
};

export const roleLabel: Record<Role, string> = {
  CONDOMINO: 'Condômino',
  PRESTADOR: 'Prestador de Serviços',
  SINDICO: 'Síndico',
  ADMINISTRADOR: 'Administrador',
};

export const roleColor: Record<Role, string> = {
  CONDOMINO: 'bg-gray-500 text-white',
  PRESTADOR: 'bg-blue-500 text-white',
  SINDICO: 'bg-amber-500 text-white',
  ADMINISTRADOR: 'bg-purple-500 text-white',
};

export const categoriaLabel: Record<Categoria, string> = {
  ELETRICA: 'Elétrica',
  HIDRAULICA: 'Hidráulica',
  CLIMATIZACAO: 'Climatização',
  MOBILIARIO: 'Mobiliário',
  ESTRUTURAL: 'Estrutural',
  OUTROS: 'Outros',
};

export function formatarData(iso?: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${min} min atrás`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `${horas} h atrás`;
  const dias = Math.floor(horas / 24);
  return `${dias} dia${dias > 1 ? 's' : ''} atrás`;
}

export function iniciais(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const AVATAR_CORES = [
  'bg-brand-600',
  'bg-blue-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-purple-600',
  'bg-rose-600',
];

export function avatarCor(nome: string): string {
  const soma = nome
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_CORES[soma % AVATAR_CORES.length];
}

const MOEDA = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

// Valores monetários trafegam em centavos (inteiro) para evitar erro de ponto
// flutuante; só a exibição converte para reais. Ausente conta como zero.
export function formatarMoeda(centavos?: number | null): string {
  return MOEDA.format((typeof centavos === 'number' ? centavos : 0) / 100);
}

export function parseMoedaParaCentavos(texto: string): number {
  const limpo = texto.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const num = Number(limpo);
  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100);
}

// Até R$ 9.999.999.999,99 — acima disso o número perderia precisão.
const MAX_DIGITOS_MOEDA = 12;

// Lê o texto digitado como em caixa eletrônico: cada dígito entra pela direita
// ("1" → R$ 0,01, "1234" → R$ 12,34). Qualquer outro caractere é ignorado.
export function centavosDeDigitos(texto: string): number {
  const digitos = texto.replace(/\D/g, '').slice(0, MAX_DIGITOS_MOEDA);
  return digitos ? Number(digitos) : 0;
}

export interface Pagina<T> {
  itens: T[];
  pagina: number;
  totalPaginas: number;
  total: number;
}

// Paginação no cliente: a API ainda devolve a lista inteira. A página pedida é
// corrigida para o intervalo válido (ex.: após um filtro reduzir a lista).
export function paginar<T>(itens: T[], pagina: number, porPagina: number): Pagina<T> {
  const totalPaginas = Math.max(1, Math.ceil(itens.length / porPagina));
  const atual = Math.min(Math.max(1, pagina), totalPaginas);
  const inicio = (atual - 1) * porPagina;
  return {
    itens: itens.slice(inicio, inicio + porPagina),
    pagina: atual,
    totalPaginas,
    total: itens.length,
  };
}
