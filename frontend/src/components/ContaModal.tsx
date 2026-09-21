import { useEffect, useState } from 'react';
import { ImagePlus, Trash2, X, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Modal } from './Modal';
import { comprimirImagem } from '../imagem';
import { roleLabel, iniciais, avatarCor } from '../helpers';

export function ContaModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { usuario, atualizarConta, excluirConta } = useAuth();
  const [nome, setNome] = useState('');
  const [foto, setFoto] = useState('');
  const [confirmar, setConfirmar] = useState(false);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (open && usuario) {
      setNome(usuario.nome);
      setFoto(usuario.foto || '');
      setConfirmar(false);
      setErro('');
    }
  }, [open, usuario]);

  if (!usuario) return null;

  const onArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const arquivo = input.files?.[0];
    if (!arquivo) return;
    setErro('');
    try {
      setFoto(await comprimirImagem(arquivo));
    } catch {
      setErro('Não foi possível processar a imagem selecionada.');
    } finally {
      input.value = '';
    }
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!nome.trim()) {
      setErro('Informe um nome válido.');
      return;
    }
    setSalvando(true);
    const res = await atualizarConta({
      nome: nome.trim(),
      foto: foto || undefined,
    });
    setSalvando(false);
    if (!res.ok) {
      setErro(res.erro || 'Não foi possível salvar as alterações.');
      return;
    }
    onClose();
  };

  const apagar = async () => {
    setErro('');
    setSalvando(true);
    const res = await excluirConta();
    setSalvando(false);
    if (!res.ok) {
      setErro(res.erro || 'Não foi possível apagar a conta.');
      return;
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Minha conta">
      <form onSubmit={salvar} className="space-y-4">
        {/* Foto de perfil */}
        <div className="flex flex-col items-center gap-3">
          {foto ? (
            <div className="relative">
              <img
                src={foto}
                alt="Foto de perfil"
                className="h-24 w-24 rounded-full object-cover ring-2 ring-brand-500"
              />
              <button
                type="button"
                onClick={() => setFoto('')}
                className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                aria-label="Remover foto"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <span
              className={`flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white ${avatarCor(
                usuario.nome,
              )}`}
            >
              {iniciais(usuario.nome)}
            </span>
          )}

          <label className="btn-secondary cursor-pointer !px-3 !py-1.5 text-sm">
            <ImagePlus className="h-4 w-4" />
            {foto ? 'Trocar foto' : 'Inserir foto'}
            <input type="file" accept="image/*" className="hidden" onChange={onArquivo} />
          </label>
        </div>

        {/* Nome */}
        <div>
          <label className="label">Nome completo</label>
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-gray-400" />
            <input
              className="input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
        </div>

        <div className="text-sm text-gray-500">
          E-mail: <span className="text-gray-700">{usuario.email}</span>
          <span className="ml-2 rounded-full bg-gray-500 px-2 py-0.5 text-[11px] font-semibold text-white">
            {roleLabel[usuario.role]}
          </span>
        </div>

        {erro && (
          <div className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white">
            {erro}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>

      {/* Zona de perigo */}
      <div className="mt-4 border-t border-gray-200 pt-4">
        {!confirmar ? (
          <button
            type="button"
            onClick={() => setConfirmar(true)}
            className="btn w-full !px-3 !py-2 border border-red-300 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500"
          >
            <Trash2 className="h-4 w-4" /> Apagar conta
          </button>
        ) : (
          <div className="rounded-lg bg-red-500 p-3 text-white">
            <p className="mb-3 text-sm">
              Tem certeza? Esta ação apagará sua conta e fará logout. Essa ação
              não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmar(false)}
                className="btn bg-white text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void apagar()}
                disabled={salvando}
                className="btn bg-red-600 text-white hover:bg-red-700"
              >
                Apagar definitivamente
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
