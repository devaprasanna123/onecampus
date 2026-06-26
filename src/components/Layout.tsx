import React, { useState, useEffect } from 'react';
import ChatGPTFloatingButton from './ChatGPTFloatingButton';

import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { useTheme } from '../features/theme/ThemeContext';
import { usePresence } from '../hooks/usePresence';
import { 
  BookOpen, 
  LayoutDashboard, 
  Bookmark, 
  RefreshCw, 
  User as UserIcon, 
  LogOut, 
  Search, 
  Sun, 
  Moon,
  Menu,
  X,
  MessageCircle,
  Bell
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  setActivePage: (page: string) => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activePage, 
  setActivePage,
  globalSearchQuery,
  setGlobalSearchQuery
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync user presence
  usePresence(user, activePage, profile);

  // Sync activePage with current URL
  useEffect(() => {
    const path = location.pathname;
    if (path === '/') setActivePage('Dashboard');
    else if (path.startsWith('/subject')) setActivePage('Engineering Chemistry');
    else if (path === '/bookmarks') setActivePage('Bookmarks');
    else if (path === '/revision') setActivePage('Revision');
    else if (path === '/profile') setActivePage('Profile');
    
  }, [location.pathname]);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, role: 'student' },
    { name: 'Engineering Chemistry', icon: BookOpen, role: 'student' },
    { name: 'Bookmarks', icon: Bookmark, role: 'student' },
    { name: 'Revision', icon: RefreshCw, role: 'student' },
    { name: 'Profile', icon: UserIcon, role: 'student' },
    {
      name: 'Feedback',
      icon: MessageCircle,
      role: 'student',
      externalUrl: 'https://forms.gle/Q5tntnwtB8xnhG9t8',
    },
  ];

  const visibleNavItems = navItems.filter(item => {
    if (item.role === 'admin') {
      return profile?.role === 'admin';
    }
    return true;
  });

  return (
    <div className="min-h-screen flex bg-secondary-50 dark:bg-slate-950 text-secondary-900 dark:text-slate-100 transition-colors duration-200 font-sans">
      
      {/* ── SIDEBAR (DESKTOP) ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col w-[280px] bg-white dark:bg-slate-900 border-r border-secondary-200 dark:border-slate-800 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-14 px-6 border-b border-secondary-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded bg-primary-600 text-white font-bold text-[10px]">
              OC
            </div>
            <span className="font-semibold text-[15px] tracking-tight">OneCampus</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-secondary-400 hover:text-secondary-900 dark:hover:text-white">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.name;
            return (
              <button
                key={item.name}
                onClick={() => {
                  setActivePage(item.name);
                  setSidebarOpen(false);
                  if ((item as any).externalUrl) {
                    window.open((item as any).externalUrl, '_blank', 'noopener,noreferrer');
                    setSidebarOpen(false);
                    return;
                  }

                  const routeMap: Record<string, string> = {
                    Dashboard: '/',
                    'Engineering Chemistry': '/subject/subject-chem',
                    Bookmarks: '/bookmarks',
                    Revision: '/revision',
                    Profile: '/profile',
                    Feedback: '/',
                  };
                  const target = routeMap[item.name] || '/';
                  navigate(target);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-[14px] font-medium transition-colors duration-150 ${
                  isActive 
                    ? 'bg-secondary-100 dark:bg-slate-800 text-primary-600 dark:text-primary-400' 
                    : 'text-secondary-600 dark:text-slate-400 hover:bg-secondary-50 dark:hover:bg-slate-800/50 hover:text-secondary-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon size={16} className={isActive ? "text-primary-600 dark:text-primary-400" : "text-secondary-400 dark:text-slate-500"} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-secondary-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-3 px-2">
            <img 
              src={profile?.profile_photo || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='16' fill='%232563EB'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='14' font-family='Inter,sans-serif' font-weight='600'%3E${(profile?.name || 'S').charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`} 
              alt="Profile" 
              className="w-8 h-8 rounded-full border border-secondary-200 dark:border-slate-700"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-secondary-900 dark:text-white truncate leading-tight">{profile?.name || 'Student'}</p>
              <p className="text-[11px] text-secondary-500 dark:text-slate-400 truncate leading-tight">{profile?.role || 'Student'}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-[13px] font-medium text-secondary-600 dark:text-slate-400 hover:bg-secondary-50 dark:hover:bg-slate-800 rounded-md transition-colors"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-secondary-900/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Floating ChatGPT button */}
      <ChatGPTFloatingButton />

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col lg:pl-[280px] min-w-0 pb-16 lg:pb-0">
        
        {/* TOP BAR */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-6 bg-white/80 dark:bg-slate-900/80 border-b border-secondary-200 dark:border-slate-800 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 text-secondary-500 hover:text-secondary-900 dark:text-slate-400 dark:hover:text-white lg:hidden bg-secondary-50 dark:bg-slate-800 rounded-md"
            >
              <Menu size={18} />
            </button>
            <h2 className="hidden md:block text-[15px] font-semibold text-secondary-900 dark:text-white">
              {activePage}
            </h2>
          </div>

          <div className="flex items-center gap-4 flex-1 justify-end">
            {/* Compact Search */}
            <div className="relative hidden sm:block w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-secondary-400 pointer-events-none">
                <Search size={14} />
              </span>
              <input
                type="text"
                value={globalSearchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setGlobalSearchQuery(value);
                  if (activePage !== 'Engineering Chemistry') {
                    setActivePage('Engineering Chemistry');
                  }
                  if (location.pathname !== '/subject/subject-chem') {
                    navigate('/subject/subject-chem', { replace: true });
                  }
                }}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 text-[13px] bg-secondary-50 dark:bg-slate-800/50 border border-secondary-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
              />
            </div>

            <div className="flex items-center gap-2">
              <button className="p-1.5 text-secondary-500 hover:text-secondary-900 dark:text-slate-400 dark:hover:text-white rounded-md hover:bg-secondary-50 dark:hover:bg-slate-800 transition-colors">
                <Bell size={16} />
              </button>
              <button
                onClick={() => void toggleTheme()}
                className="p-1.5 text-secondary-500 hover:text-secondary-900 dark:text-slate-400 dark:hover:text-white rounded-md hover:bg-secondary-50 dark:hover:bg-slate-800 transition-colors"
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main className="flex-1 p-6 overflow-y-auto max-w-[1280px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* ── BOTTOM NAVIGATION (MOBILE) ── */}
      <nav className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-around h-14 bg-white dark:bg-slate-900 border-t border-secondary-200 dark:border-slate-800 lg:hidden pb-safe">
        {visibleNavItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.name;
          return (
            <button
              key={item.name}
              onClick={() => {
                setActivePage(item.name);
                const routeMap: Record<string, string> = {
                  Dashboard: '/',
                  'Engineering Chemistry': '/subject/subject-chem',
                  Bookmarks: '/bookmarks',
                  Revision: '/revision',
                  Profile: '/profile',
                };
                navigate(routeMap[item.name] || '/');
              }}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-secondary-500 dark:text-slate-400'}`}
            >
              <Icon size={18} />
              <span className="text-[10px] mt-0.5 font-medium">{item.name === 'Engineering Chemistry' ? 'Subject' : item.name}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
};
export default Layout;
