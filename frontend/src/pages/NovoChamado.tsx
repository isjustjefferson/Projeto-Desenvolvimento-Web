import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ImagePlus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChamados } from '../context/ChamadosContext';
import { categoriaLabel } from '../helpers';
import type { Categoria } from '../types';

const categorias = Object.keys(categoriaLabel) as Categoria[];

export function NovoChamado() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { criarChamado } = useChamados();

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState<Categoria>('ELETRICA');
  const [predio, setPredio] = useState('');
  const [andar, setAndar] = useState('');
  const [sala, setSala] = useState('');
  const [foto, setFoto] = useState('');
  const [fotoNome, setFotoNome] = useState('');
  const [erro, setErro] = useState('');

  if (!usuario) return null;
  const user = usuario;

  // RN do solicitante: ele NÃO define prioridade (o gestor define na aprovação)

  function onArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setFotoNome(arquivo.name);
    const reader = new FileReader();
    reader.onload = () => setFoto(String(reader.result || ''));
    reader.readAsDataURL(arquivo);
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (!titulo.trim() || !descricao.trim() || !predio.trim()) {
      setErro('Preencha título, descrição e prédio.');
      return;
    }
    const chamado = criarChamado(
      {
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        categoria,
        local: {
          predio: predio.trim(),
          andar: andar.trim() || undefined,
          sala: sala.trim() || undefined,
        },
        foto: foto || undefined,
      },
      user,
    );
    navigate(`/chamados/${chamado.id}`);
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Novo Chamado</h1>
        <p className="text-sm text-gray-500">
          Descreva o problema. Ele ficará aguardando aprovação do gestor.
        </p>
      </div>

      <form onSubmit={enviar} className="card space-y-4">
        <div>
          <label className="label">Título do problema</label>
          <input
            className="input"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Tomada sem energia"
            required
          />
        </div>

        <div>
          <label className="label">Categoria</label>
          <select
            className="input"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as Categoria)}
          >
            {categorias.map((c) => (
              <option key={c} value={c}>{categoriaLabel[c]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Local</label>
          <div className="grid grid-cols-3 gap-2">
            <input
              className="input"
              placeholder="Bloco/Torre"
              value={predio}
              onChange={(e) => setPredio(e.target.value)}
              required
            />
            <input
              className="input"
              placeholder="Andar"
              value={andar}
              onChange={(e) => setAndar(e.target.value)}
              required
            />
            <input
              className="input"
              placeholder="Lugar"
              value={sala}
              onChange={(e) => setSala(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="label">Foto (opcional)</label>
          {foto ? (
            <div className="relative overflow-hidden rounded-lg border border-gray-200">
              <img
                src={foto}
                alt={fotoNome}
                className="h-40 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setFoto('');
                  setFotoNome('');
                }}
                className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
              >
                <X className="h-3.5 w-3.5" /> Remover
              </button>
              <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[11px] text-white">
                {fotoNome}
              </span>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-8 text-center transition hover:border-brand-400 hover:bg-gray-100">
              <ImagePlus className="h-8 w-8 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">
                Clique para anexar uma foto
              </span>
              <span className="text-xs text-gray-400">
                JPG ou PNG (simulado — não é enviado a nenhum servidor)
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onArquivo}
              />
            </label>
          )}
        </div>

        <div>
          <label className="label">Descrição do problema</label>
          <textarea
            className="input min-h-[100px]"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreva o que está acontecendo para facilitar o atendimento."
            required
          />
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-amber-500 px-3 py-2 text-xs text-white">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            A prioridade será definida pelo gestor durante a triagem.
          </span>
        </div>

        {erro && (
          <div className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white">
            {erro}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button type="submit" className="btn-primary">
            Abrir chamado
          </button>
        </div>
      </form>
    </div>
  );
}
