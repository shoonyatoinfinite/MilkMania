import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTranslation, translations } from '../utils/translations';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  Receipt, 
  Menu, 
  X, 
  LogOut, 
  Settings, 
  Binary, 
  Sparkles, 
  TrendingUp, 
  User, 
  Warehouse
} from 'lucide-react';

interface NavItem {
  key: keyof typeof translations['en'];
  path: string;
  icon: React.ComponentType<any>;
}

export const Navbar: React.FC = () => {
  const { user, logout, theme, toggleTheme, language } = useApp();
  const { t } = useTranslation(language);
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const mainNavs: NavItem[] = [
    { key: 'dashboard', path: '/', icon: LayoutDashboard },
    { key: 'customers', path: '/customers', icon: Users },
    { key: 'sales', path: '/sales', icon: ShoppingBag },
    { key: 'expenses', path: '/expenses', icon: Receipt },
  ];

  const moreNavs: NavItem[] = [
    { key: 'animals', path: '/animals', icon: Sparkles },
    { key: 'inventory', path: '/inventory', icon: Warehouse },
    { key: 'analytics', path: '/analytics', icon: TrendingUp },
    { key: 'reports', path: '/reports', icon: Binary },
    { key: 'settings', path: '/settings', icon: Settings },
    { key: 'profile', path: '/profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* 1. DESKTOP GLASS SIDEBAR */}
      <aside className="hidden lg:flex flex-col justify-between fixed left-5 top-5 bottom-5 w-64 glass-card rounded-4xl p-5 z-50 overflow-hidden">
        {/* Header Brand (Locked at Top) */}
        <div className="flex items-center gap-3 px-2 mb-6 shrink-0">
          <span className="text-3xl">🥛</span>
          <div>
            <h1 className="font-space font-bold text-lg leading-none text-dairy-text">Milk Mania</h1>
            <span className="text-[10px] tracking-widest text-dairy-sky font-bold uppercase">{t('welcome')}</span>
          </div>
        </div>

        {/* Scrollable Navigation Links Wrapper */}
        <nav className="flex flex-col gap-1.5 overflow-y-auto flex-1 pr-1 mb-4 select-none scrollbar-thin">
          {[...mainNavs, ...moreNavs].map((nav) => {
            const Icon = nav.icon;
            return (
              <NavLink
                key={nav.path}
                to={nav.path}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-semibold tracking-wide transition-all duration-300 relative ${
                    isActive 
                      ? 'bg-dairy-sky text-white shadow-lg shadow-dairy-sky/20' 
                      : 'text-dairy-text/75 hover:bg-white/40 hover:text-dairy-text'
                  }`
                }
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{t(nav.key)}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer Profile & Settings (Locked at Bottom) */}
        <div className="flex flex-col gap-3.5 border-t border-white/30 pt-4 shrink-0">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-dairy-sky/10 flex items-center justify-center font-bold text-dairy-sky text-xs">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="leading-tight">
                <p className="text-xs font-bold text-dairy-text max-w-[100px] truncate">{user?.name || 'Admin User'}</p>
                <p className="text-[10px] text-dairy-text/60 max-w-[100px] truncate">@{user?.username || 'admin'}</p>
              </div>
            </div>
            
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-xl bg-white/50 border border-white/80 hover:bg-white shadow-sm text-sm"
              title="Switch Shift Theme"
            >
              {theme === 'morning' ? '☀️' : theme === 'evening' ? '🌙' : '🌑'}
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-2xl text-xs font-bold text-dairy-coral hover:bg-dairy-coral/10 transition-colors"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* 2. MOBILE PERSISTENT BOTTOM NAV BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/70 backdrop-blur-xl border-t border-white/60 shadow-[0_-8px_30px_rgb(0,0,0,0.03)] z-50 flex items-center justify-around px-4 print:hidden">
        {mainNavs.map((nav) => {
          const Icon = nav.icon;
          return (
            <NavLink
              key={nav.path}
              to={nav.path}
              className={({ isActive }) => 
                `flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-xl transition-all ${
                  isActive 
                    ? 'text-dairy-sky scale-110 font-bold' 
                    : 'text-dairy-text/60'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{t(nav.key)}</span>
            </NavLink>
          );
        })}

        {/* Dynamic More Drawer trigger */}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-xl text-dairy-text/60"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-semibold">More</span>
        </button>
      </nav>

      {/* 3. MOBILE drawer overlays */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm flex items-end print:hidden">
          {/* Backdrop Touch Dismiss */}
          <div className="absolute inset-0" onClick={() => setMoreOpen(false)} />

          <div className="relative w-full bg-milk-50 rounded-t-[32px] p-6 shadow-2xl border-t border-white/60 max-h-[85vh] overflow-y-auto flex flex-col gap-6">
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-dairy-sky/10">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🥛</span>
                <div>
                  <h2 className="font-space font-bold text-dairy-text">Milk Mania</h2>
                  <p className="text-[10px] text-dairy-text/50 font-bold uppercase tracking-wider">Extended Menu</p>
                </div>
              </div>
              <button 
                onClick={() => setMoreOpen(false)}
                className="p-2 rounded-full bg-white border border-white/80 shadow-sm"
              >
                <X className="w-5 h-5 text-dairy-text/80" />
              </button>
            </div>

            {/* Extended menu Grid */}
            <div className="grid grid-cols-3 gap-3">
              {moreNavs.map((nav) => {
                const Icon = nav.icon;
                return (
                  <button
                    key={nav.path}
                    onClick={() => {
                      setMoreOpen(false);
                      navigate(nav.path);
                    }}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-white/60 border border-white/80 rounded-2xl shadow-sm hover:bg-white active:scale-95 transition-all text-center"
                  >
                    <div className="p-2.5 bg-dairy-sky/10 rounded-xl text-dairy-sky">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-dairy-text">{t(nav.key)}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Shift Switch & User Info */}
            <div className="flex items-center justify-between p-4 bg-white/40 border border-white/60 rounded-2xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-dairy-sky/10 flex items-center justify-center font-bold text-dairy-sky">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-bold text-dairy-text">{user?.name || 'Admin User'}</p>
                  <p className="text-[10px] text-dairy-text/50">@{user?.username || 'admin'}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-white/80 shadow-sm text-xs font-bold text-dairy-text"
                >
                  <span>{theme === 'morning' ? `☀️ ${t('morning')}` : theme === 'evening' ? `🌙 ${t('evening')}` : '🌑 Midnight'}</span>
                </button>
              </div>
            </div>

            {/* Logout Trigger button */}
            <button
              onClick={() => {
                setMoreOpen(false);
                handleLogout();
              }}
              className="flex items-center justify-center gap-2 w-full py-4 bg-dairy-coral/10 hover:bg-dairy-coral/20 rounded-2xl text-sm font-bold text-dairy-coral transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
export default Navbar;
