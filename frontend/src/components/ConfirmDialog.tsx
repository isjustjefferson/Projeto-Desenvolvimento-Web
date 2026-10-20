import { Modal } from './Modal';

// Confirmação visual usada em ações destrutivas (substitui window.confirm).
export function ConfirmDialog({
  open,
  titulo,
  mensagem,
  rotuloConfirmar = 'Confirmar',
  carregando = false,
  aoConfirmar,
  aoCancelar,
}: {
  open: boolean;
  titulo: string;
  mensagem: string;
  rotuloConfirmar?: string;
  carregando?: boolean;
  aoConfirmar: () => void;
  aoCancelar: () => void;
}) {
  if (!open) return null;

  return (
    <Modal open={open} onClose={aoCancelar} title={titulo}>
      <p className="text-sm text-gray-600">{mensagem}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={aoCancelar}
          disabled={carregando}
          className="btn-secondary disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={aoConfirmar}
          disabled={carregando}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {carregando ? 'Aguarde…' : rotuloConfirmar}
        </button>
      </div>
    </Modal>
  );
}
