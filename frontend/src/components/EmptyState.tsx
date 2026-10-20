import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

// Estado vazio com sugestão do próximo passo.
export function EmptyState({
  icon: Icon,
  titulo,
  descricao,
  acao,
}: {
  icon: LucideIcon;
  titulo: string;
  descricao: string;
  acao?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <span className="mb-1 inline-flex rounded-2xl bg-gray-100 p-4 text-gray-400">
        <Icon className="h-8 w-8" />
      </span>
      <h3 className="font-semibold text-gray-800">{titulo}</h3>
      <p className="max-w-sm text-sm text-gray-500">{descricao}</p>
      {acao && <div className="mt-2">{acao}</div>}
    </div>
  );
}
