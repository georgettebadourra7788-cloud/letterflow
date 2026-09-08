import { NavLink, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'inventory_2' },
  { path: '/students', label: 'Students', icon: 'school' },
  { path: '/settings', label: 'Settings', icon: 'history_edu' },
];

export function Header({ title, subtitle, backTo, showLogo = true }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl shadow-sm">
      <div className="h-16 px-screen-edge flex items-center justify-between">
        <div className="flex items-center gap-gutter-sm min-w-0">
          {backTo && (
            <button
              aria-label="Go back"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 text-on-surface hover:text-secondary transition-colors"
              onClick={() => navigate(backTo)}
              type="button"
            >
              <Icon name="arrow_back" className="text-[24px]" />
            </button>
          )}
          {showLogo && !backTo && (
            <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0">
              <Icon name="history_edu" className="text-[20px]" />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-headline-sm text-headline-sm text-on-surface leading-none truncate">
              {title || 'LetterFlow'}
            </span>
            {subtitle && (
              <span className="font-label-sm text-label-sm text-on-surface-variant font-normal leading-none mt-0.5 truncate">
                {subtitle}
              </span>
            )}
          </div>
        </div>
        <button
          aria-label="Sign out"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface"
          onClick={() => logout()}
          type="button"
        >
          <Icon name="logout" className="text-[20px]" />
        </button>
      </div>
    </header>
  );
}

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 w-full z-50 bg-surface/95 backdrop-blur-xl shadow-[0_-1px_8px_rgba(0,0,0,0.03)]">
      <div className="flex justify-around items-center h-16 px-gutter-sm">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-w-[44px] min-h-[44px] gap-0.5 transition-colors ${
                isActive ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface'
              }`
            }
          >
            <Icon name={item.icon} className="text-[22px]" />
            <span className="font-label-sm text-label-sm">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default function Layout({ title, subtitle, backTo, hideNav = false, children }) {
  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <Header title={title} subtitle={subtitle} backTo={backTo} />
      <main className={`flex-1 w-full pt-16 px-screen-edge ${hideNav ? 'pb-8' : 'pb-24'}`}>
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-gutter-md py-gutter-md">{children}</div>
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
