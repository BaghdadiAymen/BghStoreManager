import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Package,
  BarChart3,
  TrendingUp,
  CreditCard,
  Info,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Download
} from 'lucide-react';
import { User, ActiveTab } from '../types';
import { AccountModal } from './AccountModal';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: User | null;
  onLogout: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  isDark,
  onToggleTheme,
  isCollapsed,
  setIsCollapsed
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert("To install BiPOS PRO as a Desktop/Mobile App: Click the 'Install App' icon or '+' in your browser address bar top-right corner next to the bookmark star!");
    }
  };

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  const navItems = [
    {
      id: 'pos' as ActiveTab,
      label: 'POS Register',
      icon: ShoppingCart,
      badge: 'Live',
    },
    {
      id: 'stock' as ActiveTab,
      label: 'Inventory & Stock',
      icon: Package,
      badge: null,
    },
    {
      id: 'sales' as ActiveTab,
      label: 'Sales Report',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'debts' as ActiveTab,
      label: 'Debts Management',
      icon: CreditCard,
      badge: 'Dettes',
    },
    ...(currentUser?.role === 'admin'
      ? [
          {
            id: 'analytics' as ActiveTab,
            label: 'Analytics & Loss',
            icon: TrendingUp,
            badge: 'Admin',
          }
        ]
      : []),
    {
      id: 'about' as ActiveTab,
      label: 'About BGHaymen',
      icon: Info,
      badge: 'Dev',
    }
  ];

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="md:hidden sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-sm flex items-center justify-center shadow-md font-mono shrink-0">
            BGH
          </div>
          <div>
            <h1 className="font-black text-slate-900 dark:text-white text-base leading-tight">BiPOS</h1>
            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">By BGHaymen</p>
          </div>
        </div>

        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Backdrop overlay for mobile drawer */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 z-40 md:hidden backdrop-blur-2xs transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 ${
          isMobileOpen ? 'translate-x-0 w-72 p-4' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-20 md:p-3' : 'md:w-72 md:p-4'}`}
      >
        <div className="space-y-6">
          {/* Logo & Brand Header - Centered & Perfectly Aligned when Collapsed */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            {isCollapsed ? (
              <div className="w-full flex flex-col items-center justify-center gap-2">
                <div
                  className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-500/20 font-mono tracking-tight cursor-pointer shrink-0"
                  onClick={() => setIsCollapsed(false)}
                  title="BiPOS by BGHaymen - Click to Expand Menu"
                >
                  BGH
                </div>
                <button
                  onClick={() => setIsCollapsed(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Expand Menu"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-500/20 font-mono tracking-tight shrink-0">
                    BGH
                  </div>
                  <div className="min-w-0">
                    <h1 className="font-black text-slate-900 dark:text-white text-lg tracking-tight truncate">
                      BiPOS <span className="text-blue-600 dark:text-blue-400 font-extrabold text-xs px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">PRO</span>
                    </h1>
                    <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
                      By BGHaymen
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsCollapsed(true)}
                    className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Collapse Sidebar"
                  >
                    <PanelLeftClose className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setIsMobileOpen(false)}
                    className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            {!isCollapsed && (
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 pb-1">
                Main Navigation
              </div>
            )}

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center px-0 py-3' : 'justify-between px-3.5 py-3'
                  } rounded-xl font-bold text-sm transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!isCollapsed && item.badge && (
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Theme Switcher & Install App */}
          <div className="pt-2 space-y-2">
            {!isCollapsed && (
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 pb-1">
                App & Appearance
              </div>
            )}

            {/* Install App Button */}
            <button
              onClick={handleInstallApp}
              title={isCollapsed ? 'Install BiPOS App on PC / Mobile' : undefined}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'
              } rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all cursor-pointer`}
            >
              <div className="flex items-center gap-2.5">
                <Download className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                {!isCollapsed && <span>Install App</span>}
              </div>
              {!isCollapsed && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-600 text-white uppercase">
                  PWA
                </span>
              )}
            </button>

            {/* Dark Mode Switcher */}
            <button
              onClick={onToggleTheme}
              title={isCollapsed ? (isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode') : undefined}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'
              } rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer`}
            >
              <div className="flex items-center gap-2.5">
                {isDark ? (
                  <Moon className="w-4 h-4 text-purple-400 shrink-0" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                {!isCollapsed && <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>}
              </div>
              {!isCollapsed && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 uppercase">
                  Switch
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Footer Account Section */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {currentUser && (
            <div className={`bg-slate-50 dark:bg-slate-800/60 rounded-xl ${isCollapsed ? 'p-2 justify-center' : 'p-3 justify-between'} border border-slate-200 dark:border-slate-700/60 flex items-center`}>
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
                {!isCollapsed && (
                  <div className="min-w-0">
                    <div className="font-extrabold text-slate-900 dark:text-white text-xs truncate">
                      {currentUser.username}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize font-medium">
                        {currentUser.role}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <button
                  onClick={() => setIsAccountModalOpen(true)}
                  className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  title="Account Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {!isCollapsed ? (
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 px-1 pt-1">
              <span>BiPOS Terminal</span>
              <button
                onClick={onLogout}
                className="text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-bold flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onLogout}
              className="w-full flex justify-center p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
              title="Log Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Account Settings Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        currentUser={currentUser}
        onLogout={onLogout}
      />
    </>
  );
};
