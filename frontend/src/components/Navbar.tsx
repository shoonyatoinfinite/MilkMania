import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTranslation, translations } from '../utils/translations';
import {
  LayoutDashboard,
  ShoppingBag,
  Receipt,
  Settings,
  Sparkles,
  TrendingUp,
  ShoppingCart,
  Users,
  LogOut,
  Download,
  Menu,
  X,
  Languages,
  User
} from 'lucide-react';

interface NavItem {
  key: keyof typeof translations['en'];
  path: string;
  icon: React.ComponentType<any>;
}

export const Navbar: React.FC = () => {
  const {
    user,
    logout,
    language,
    setLanguage,
    enableMilkBought,
    isInstallable,
    isStandalone,
    handleInstallPrompt
  } = useApp();
  const { t } = useTranslation(language);
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  // Dynamic navigation items based on settings toggle
  const mainNavs: NavItem[] = [
    { key: 'dashboard', path: '/', icon: LayoutDashboard },
    { key: 'sales', path: '/sales', icon: ShoppingBag },
    ...(enableMilkBought ? [{ key: 'milkBought' as any, path: '/#milk-bought', icon: ShoppingCart }] : []),
    { key: 'expenses', path: '/expenses', icon: Receipt },
    { key: 'settings', path: '/settings', icon: Settings },
  ];

  const moreNavs: NavItem[] = [
    { key: 'customers', path: '/customers', icon: Users },
    { key: 'analytics', path: '/analytics', icon: TrendingUp },
    { key: 'profile', path: '/profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  return (
    <>
      {/* 1. DESKTOP GLASS SIDEBAR */}
      <aside className="hidden lg:flex flex-col justify-between fixed left-5 top-5 bottom-5 w-64 bg-white/95 backdrop-blur-xl border border-sky-100 shadow-xl rounded-4xl p-5 z-50 overflow-hidden">
        {/* Header Brand */}
        <div className="flex items-center justify-between px-2 mb-6 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">🥛</span>
            <div>
              <h1 className="font-space font-bold text-lg leading-none text-dairy-text">Milk Mania</h1>
              <span className="text-[10px] tracking-widest text-dairy-sky font-bold uppercase">{t('welcome')}</span>
            </div>
          </div>

          <button
            onClick={toggleLanguage}
            className="px-2 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-xl text-xs font-bold transition-all"
            title="Switch Language"
          >
            {language === 'en' ? 'हिन्दी' : 'English'}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5 overflow-y-auto flex-1 pr-1 mb-4 select-none scrollbar-thin">
          {[...mainNavs, ...moreNavs].map((nav) => {
            const Icon = nav.icon;
            return (
              <NavLink
                key={nav.path}
                to={nav.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-semibold tracking-wide transition-all duration-200 ${isActive
                    ? 'bg-dairy-sky text-white shadow-md shadow-sky-500/20'
                    : 'text-dairy-text/75 hover:bg-sky-50 hover:text-dairy-sky'
                  }`
                }
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{t(nav.key)}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer & Logout */}
        <div className="flex flex-col gap-3 border-t border-sky-100 pt-4 shrink-0">
          <NavLink
            to="/profile"
            className="flex items-center justify-between p-2 rounded-2xl hover:bg-sky-50/80 transition-all border border-transparent hover:border-sky-100 group"
            title="Edit Profile & Credentials"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-dairy-sky flex items-center justify-center font-bold text-white text-xs shadow-xs group-hover:scale-105 transition-transform">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="leading-tight">
                <p className="text-xs font-bold text-dairy-text max-w-[110px] truncate group-hover:text-dairy-sky transition-colors">{user?.name || 'User'}</p>
                <p className="text-[10px] text-dairy-text/60 max-w-[110px] truncate">@{user?.username || 'user'}</p>
              </div>
            </div>
            <span className="text-[9px] font-bold text-dairy-sky bg-sky-100/60 px-1.5 py-0.5 rounded-md uppercase">
              {user?.role === 'ADMIN' ? 'Admin' : 'Staff'}
            </span>
          </NavLink>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 rounded-2xl text-xs font-bold text-dairy-coral hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* 3. MOBILE BOTTOM NAVIGATION (Optimized for thumb tap) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-xl border-t border-sky-100 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] z-50 flex items-center justify-around px-2 print:hidden">
        {mainNavs.slice(0, 4).map((nav) => {
          const Icon = nav.icon;
          return (
            <NavLink
              key={nav.path}
              to={nav.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl transition-all ${isActive
                  ? 'text-dairy-sky font-extrabold scale-105'
                  : 'text-dairy-text/60 hover:text-dairy-text'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold tracking-tight truncate max-w-[55px] text-center">{t(nav.key)}</span>
            </NavLink>
          );
        })}

        {/* Dynamic More Drawer trigger */}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl text-dairy-text/60 hover:text-dairy-text"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-semibold">{t('moreMenu')}</span>
        </button>
      </nav>

      {/* 4. MOBILE DRAWER OVERLAY */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end print:hidden">
          <div className="absolute inset-0" onClick={() => setMoreOpen(false)} />

          <div className="relative w-full bg-white rounded-t-[32px] p-6 shadow-2xl border-t border-sky-100 max-h-[85vh] overflow-y-auto flex flex-col gap-5">
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-sky-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🥛</span>
                <div>
                  <h2 className="font-space font-bold text-dairy-text">Milk Mania</h2>
                  <p className="text-[10px] text-dairy-text/50 font-bold uppercase tracking-wider">{t('moreMenu')}</p>
                </div>
              </div>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-2 rounded-full bg-sky-50 border border-sky-100"
              >
                <X className="w-5 h-5 text-dairy-text" />
              </button>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-3 gap-3">
              {[...mainNavs, ...moreNavs].map((nav) => {
                const Icon = nav.icon;
                return (
                  <button
                    key={nav.path}
                    onClick={() => {
                      setMoreOpen(false);
                      navigate(nav.path);
                    }}
                    className="flex flex-col items-center justify-center gap-2 p-3 bg-sky-50/60 border border-sky-100 rounded-2xl active:scale-95 transition-all text-center"
                  >
                    <div className="p-2 bg-dairy-sky/10 rounded-xl text-dairy-sky">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-dairy-text truncate w-full">{t(nav.key)}</span>
                  </button>
                );
              })}
            </div>

            {/* Language switch */}
            <div className="flex items-center justify-center p-3.5 bg-sky-50/60 border border-sky-100 rounded-2xl">
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-sky-200 text-xs font-bold text-dairy-sky shadow-sm"
              >
                <Languages className="w-4 h-4" />
                <span>{language === 'en' ? '🇮🇳 Switch to हिन्दी' : '🇬🇧 Switch to English'}</span>
              </button>
            </div>

            {/* Logout Trigger */}
            <button
              onClick={() => {
                setMoreOpen(false);
                handleLogout();
              }}
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-red-50 hover:bg-red-100 rounded-2xl text-xs font-bold text-dairy-coral transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
