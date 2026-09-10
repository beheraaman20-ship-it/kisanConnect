import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Bell, BookOpen, Home, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navLinkClass = ({ isActive }: { isActive: boolean }): string => {
  return [
    'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-primary-50 text-primary-700'
      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
  ].join(' ');
};

const iconProps = { size: 18, 'aria-hidden': true } as const;

export const AppShell: React.FC = () => {
  const { user, logout } = useAuth();

  const firstName = user?.name?.split(' ')[0] || 'Farmer';

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
              🌾
            </span>
            <span className="text-lg font-bold text-primary-700">
              KisanConnect
            </span>
          </NavLink>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              <Home {...iconProps} />
              <span className="hidden sm:inline">Home</span>
            </NavLink>
            <NavLink to="/bookings" className={navLinkClass}>
              <BookOpen {...iconProps} />
              <span className="hidden sm:inline">Bookings</span>
            </NavLink>
            <NavLink to="/notifications" className={navLinkClass}>
              <Bell {...iconProps} />
              <span className="hidden sm:inline">Alerts</span>
            </NavLink>
            <NavLink to="/profile" className={navLinkClass}>
              <User {...iconProps} />
              <span className="hidden sm:inline">Profile</span>
            </NavLink>
            <button
              type="button"
              onClick={() => void logout()}
              title="Logout"
              className="ml-1 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-error transition-colors hover:bg-red-50"
            >
              <LogOut {...iconProps} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <p className="mb-4 text-sm text-neutral-500">
          Namaste, <span className="font-semibold text-neutral-800">{firstName}</span>
        </p>
        <Outlet />
      </main>

      <footer className="border-t border-neutral-200 py-4 text-center text-xs text-neutral-400">
        KisanConnect — Smart Farmer Procurement Management
      </footer>
    </div>
  );
};