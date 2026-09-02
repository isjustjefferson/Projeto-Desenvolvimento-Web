import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Building2,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { roleLabel, iniciais, avatarCor } from '../helpers';
import { pode } from '../rbac';
import { UserCard } from './UserCard';
import { ContaModal } from './ContaModal';

export function Layout() {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  const [contaAberta, setContaAberta] = useState(false);

  if (!usuario) return null;

  const links = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      visivel: pode(usuario.role, 'dashboard'),
      end: true,
    },
    {
      to: '/chamados',
      label: 'Chamados',
      icon: LifeBuoy,
      visivel: true,
      end: false,
    },
    {
      to: '/usuarios',
      label: 'Usuários',
      icon: Users,
      visivel: pode(usuario.role, 'tudo'),
      end: false,
    },
  ].filter((l) => l.visivel);

  const sairDoSistema = () => {
    sair();
    navigate('/login');
  };

  const NavLista = ({ onClick }: { onClick?: () => void }) => (
    <>
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={onClick}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {link.label}
          </NavLink>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row">
      {/* Sidebar desktop (estática/fixa) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-white md:sticky md:top-0 md:flex md:h-screen">
        <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Building2 className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold text-gray-900">Gestão Predial</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <NavLista />
        </nav>
        <div className="border-t border-gray-100 p-4">
          <div className="mb-3 flex items-center gap-3">
            {usuario.foto ? (
              <img
                src={usuario.foto}
                alt="Foto de perfil"
                className="h-10 w-10 rounded-full object-cover ring-2 ring-brand-500"
              />
            ) : (
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${avatarCor(
                  usuario.nome,
                )}`}
              >
                {iniciais(usuario.nome)}
              </span>
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-gray-800">
                {usuario.nome}
              </div>
              <div className="text-xs text-gray-500">
                {roleLabel[usuario.role]}
              </div>
            </div>
          </div>
          <button
            onClick={() => setContaAberta(true)}
            className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-brand-500 hover:text-white hover:border-brand-500"
          >
            <UserCog className="h-4 w-4" /> Minha conta
          </button>
          <button
            onClick={sairDoSistema}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-red-500 hover:text-white hover:border-red-500"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        {/* Navbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:h-16 md:px-6">
          <div className="flex items-center gap-2">
            <button
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:hidden"
              onClick={() => setMenuAberto(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white md:hidden">
              <Building2 className="h-4 w-4" />
            </span>
            <span className="font-bold text-gray-900 md:hidden">Gestão Predial</span>
            <span className="hidden text-sm text-gray-500 md:block">
              Sistema de Manutenção Predial e Helpdesk
            </span>
          </div>
          <div className="flex items-center gap-2">
            <UserCard />
          </div>
        </header>

        <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Menu mobile */}
      {menuAberto && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuAberto(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-gray-100 px-4">
              <span className="font-bold text-gray-900">Gestão Predial</span>
              <button
                onClick={() => setMenuAberto(false)}
                className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
                aria-label="Fechar menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-4">
              <NavLista onClick={() => setMenuAberto(false)} />
            </nav>
            <div className="border-t border-gray-100 p-4">
              <div className="mb-3 flex items-center gap-3">
                {usuario.foto ? (
                  <img
                    src={usuario.foto}
                    alt="Foto de perfil"
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-brand-500"
                  />
                ) : (
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${avatarCor(
                      usuario.nome,
                    )}`}
                  >
                    {iniciais(usuario.nome)}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-gray-800">
                    {usuario.nome}
                  </div>
                  <div className="text-xs text-gray-500">
                    {roleLabel[usuario.role]}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setMenuAberto(false);
                  setContaAberta(true);
                }}
                className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-brand-500 hover:text-white hover:border-brand-500"
              >
                <UserCog className="h-4 w-4" /> Minha conta
              </button>
              <button
                onClick={sairDoSistema}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-red-500 hover:text-white hover:border-red-500"
              >
                <LogOut className="h-4 w-4" /> Sair
              </button>
            </div>
          </div>
        </div>
      )}
      <ContaModal open={contaAberta} onClose={() => setContaAberta(false)} />
    </div>
  );
}
