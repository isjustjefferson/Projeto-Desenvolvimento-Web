import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  pagina: number;
  totalPaginas: number;
  total: number;
  onMudar: (pagina: number) => void;
}

export function Paginacao({ pagina, totalPaginas, total, onMudar }: Props) {
  if (totalPaginas <= 1) return null;

  return (
    <nav
      aria-label="Paginação"
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-sm text-gray-500">
        Página {pagina} de {totalPaginas} · {total} chamados
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onMudar(pagina - 1)}
          disabled={pagina <= 1}
          className="btn-secondary"
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </button>
        <button
          onClick={() => onMudar(pagina + 1)}
          disabled={pagina >= totalPaginas}
          className="btn-secondary"
        >
          Próxima <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
