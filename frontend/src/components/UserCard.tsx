import { useAuth } from '../context/AuthContext';
import { roleLabel, roleColor, iniciais, avatarCor } from '../helpers';

export function UserCard() {
  const { usuario } = useAuth();

  if (!usuario) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5">
      {usuario.foto ? (
        <img
          src={usuario.foto}
          alt="Foto de perfil"
          className="h-8 w-8 rounded-full object-cover ring-2 ring-brand-500"
        />
      ) : (
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${avatarCor(
            usuario.nome,
          )}`}
        >
          {iniciais(usuario.nome)}
        </span>
      )}
      <span className="hidden sm:block">
        <span className="block max-w-[9rem] truncate text-xs font-semibold leading-tight text-gray-800">
          {usuario.nome}
        </span>
        <span
          className={`inline-block rounded-full px-1.5 py-px text-[10px] font-semibold leading-tight ${roleColor[usuario.role]}`}
        >
          {roleLabel[usuario.role]}
        </span>
      </span>
    </div>
  );
}
