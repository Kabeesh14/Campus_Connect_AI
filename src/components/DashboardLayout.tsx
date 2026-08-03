import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, User as UserIcon, Building2, Briefcase, Map, CalendarDays,
  Brain, FileText, Target, MessageSquare, Settings, Bell, Search, LogOut,
  Menu, X, Sun, Moon, Sparkles, ChevronRight, CheckCircle2, Clock,
  Megaphone, TrendingUp,
} from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { notifications as notifData } from '../data/mockData';
import { cn } from '../utils/cn';
import type { Role } from '../types';

interface NavItem { to: string; label: string; icon: typeof LayoutDashboard; roles?: Role[] }

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: 'Main',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/profile', label: 'Profile', icon: UserIcon },
      { to: '/companies', label: 'Companies', icon: Building2 },
      { to: '/jobs', label: 'Jobs', icon: Briefcase },
      { to: '/applications', label: 'Applications', icon: Map },
      { to: '/interviews', label: 'Interviews', icon: CalendarDays },
    ],
  },
  {
    title: 'AI Tools',
    items: [
      { to: '/ai', label: 'AI Hub', icon: Sparkles },
      { to: '/ai/career-advisor', label: 'Career Advisor', icon: Brain },
      { to: '/ai/resume', label: 'Resume Analyzer', icon: FileText },
      { to: '/ai/interview-coach', label: 'Interview Coach', icon: MessageSquare },
      { to: '/ai/skill-gap', label: 'Skill Gap', icon: Target },
    ],
  },
  {
    title: 'Admin',
    items: [
      { to: '/admin', label: 'Analytics', icon: TrendingUp, roles: ['officer'] },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const notifIcons = {
  interview: CalendarDays, deadline: Clock, approval: CheckCircle2,
  announcement: Megaphone, application: Briefcase,
};

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const allItems = navGroups.flatMap((g) => g.items);
  const filtered = allItems.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (open) { setQuery(''); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  const go = (to: string) => { onClose(); navigate(to); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 px-4 pt-[15vh] backdrop-blur-sm"
          onClick={onClose}>
          <motion.div initial={{ opacity: 0, y: -20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ duration: 0.2 }} onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-2xl glass-strong shadow-soft-lg">
            <div className="flex items-center gap-3 border-b border-base px-5 py-4">
              <Search size={20} className="text-soft" />
              <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages, actions..." className="flex-1 bg-transparent text-sm outline-none"
                onKeyDown={(e) => { if (e.key === 'Enter' && filtered[0]) go(filtered[0].to); }} />
              <kbd className="rounded border border-base px-1.5 py-0.5 text-xs text-soft">ESC</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-2 scrollbar-thin">
              {filtered.length === 0 && <p className="px-4 py-8 text-center text-sm text-soft">No results found</p>}
              {filtered.map((item) => (
                <button key={item.to} onClick={() => go(item.to)}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition-colors hover:bg-soft">
                  <item.icon size={18} className="text-primary" />
                  <span className="flex-1 font-medium">{item.label}</span>
                  <ChevronRight size={16} className="text-soft" />
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function NotificationPanel({ open, onClose, notifs, onMarkRead }: {
  open: boolean; onClose: () => void; notifs: any[]; onMarkRead: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div initial={{ opacity: 0, x: 20, y: -8 }} animate={{ opacity: 1, x: 0, y: 0 }} exit={{ opacity: 0, x: 20, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl glass-strong shadow-soft-lg sm:w-96">
            <div className="flex items-center justify-between border-b border-base px-5 py-4">
              <h3 className="font-display font-semibold">Notifications</h3>
              <button onClick={onMarkRead} className="text-xs font-semibold text-primary hover:underline">Mark all read</button>
            </div>
            <div className="max-h-96 overflow-y-auto scrollbar-thin">
              {notifs.length === 0 ? (
                <div className="p-6 text-center text-xs text-soft">No notifications</div>
              ) : (
                notifs.map((n) => {
                  const Icon = notifIcons[n.type as keyof typeof notifIcons] || Bell;
                  return (
                    <div key={n.id} className={cn('flex gap-3 border-b border-base px-5 py-4 transition-colors hover:bg-soft', !n.isRead && 'bg-primary/5')}>
                      <div className={cn('rounded-xl p-2 h-fit', !n.isRead ? 'bg-primary/15 text-primary' : 'bg-soft text-soft')}><Icon size={18} /></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{n.title}</p>
                        <p className="mt-0.5 text-xs text-soft">{n.body}</p>
                        <p className="mt-1 text-[11px] text-soft/70">{n.time}</p>
                      </div>
                      {!n.isRead && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Sidebar({ open, onClose, role }: { open: boolean; onClose: () => void; role: Role }) {
  const location = useLocation();
  return (
    <>
      <AnimatePresence>
        {open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      </AnimatePresence>
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-base bg-[rgb(var(--card))] transition-transform duration-300 lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="flex h-16 items-center justify-between px-5">
          <Link to="/"><Logo /></Link>
          <button onClick={onClose} className="rounded-lg p-1.5 text-soft lg:hidden"><X size={20} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.title} className="mb-6">
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-soft/70">{group.title}</p>
              <div className="space-y-1">
                {group.items.filter((i) => !i.roles || i.roles.includes(role)).map((item) => {
                  const active = location.pathname === item.to;
                  return (
                    <Link key={item.to} to={item.to} onClick={() => onClose()}
                      className={cn('group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                        active ? 'text-primary' : 'text-soft hover:text-[rgb(var(--text))] hover:bg-soft')}>
                      {active && <motion.div layoutId="sidebar-active" className="absolute inset-0 rounded-xl bg-primary/10" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
                      <item.icon size={18} className="relative z-10" />
                      <span className="relative z-10">{item.label}</span>
                      {active && <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-primary" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-base p-4">
          <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles size={16} className="text-primary" /> AI Credits</div>
            <p className="mt-1 text-xs text-soft">247 / 500 credits used this month</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-soft"><div className="h-full w-[49%] rounded-full bg-gradient-to-r from-primary to-secondary" /></div>
            <button className="mt-3 w-full rounded-lg bg-gradient-to-r from-primary to-secondary py-2 text-xs font-semibold text-white">Upgrade to Pro</button>
          </div>
        </div>
      </aside>
    </>
  );
}

function Topbar({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [notifs, setNotifs] = useState<any[]>(notifData);
  const [unreadCount, setUnreadCount] = useState(3);
  const navigate = useNavigate();

  useEffect(() => {
    import('../utils/api').then(({ apiRequest }) => {
      apiRequest('/notifications').then((res) => {
        if (res.success && res.notifications) {
          setNotifs(res.notifications);
          setUnreadCount(res.unreadCount || 0);
        }
      }).catch(() => {});
    });
  }, [user]);

  const handleMarkAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    import('../utils/api').then(({ apiRequest }) => {
      apiRequest('/notifications/read', { method: 'PATCH', body: JSON.stringify({ id: 'all' }) }).catch(() => {});
    });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-base bg-[rgb(var(--bg))]/80 px-4 backdrop-blur-xl sm:px-6">
      <button onClick={onMenu} className="rounded-lg p-2 text-soft lg:hidden"><Menu size={20} /></button>
      <button onClick={onSearch} className="flex flex-1 items-center gap-2 rounded-xl border border-base bg-soft/40 px-4 py-2.5 text-sm text-soft transition-all hover:bg-soft sm:max-w-md">
        <Search size={16} /> <span>Search anything...</span>
        <kbd className="ml-auto hidden rounded border border-base px-1.5 py-0.5 text-xs sm:block">⌘K</kbd>
      </button>
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <button onClick={toggleTheme} className="rounded-lg p-2 text-soft transition-colors hover:bg-soft hover:text-[rgb(var(--text))]">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="relative">
          <button onClick={() => setNotifOpen(!notifOpen)} className="relative rounded-lg p-2 text-soft transition-colors hover:bg-soft hover:text-[rgb(var(--text))]">
            <Bell size={18} />
            {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-[rgb(var(--bg))]" />}
          </button>
          <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} notifs={notifs} onMarkRead={handleMarkAllRead} />
        </div>
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-soft">
            <img src={user?.avatar} alt={user?.name} className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/20" />
            <span className="hidden text-sm font-semibold sm:block">{user?.name}</span>
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl glass-strong shadow-soft-lg">
                  <div className="border-b border-base px-4 py-3">
                    <p className="text-sm font-semibold">{user?.name}</p>
                    <p className="text-xs text-soft">{user?.email}</p>
                    <span className="mt-1.5 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold capitalize text-primary">{user?.role}</span>
                  </div>
                  <div className="p-1.5">
                    <button onClick={() => { setMenuOpen(false); navigate('/profile'); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-soft">
                      <UserIcon size={16} /> My Profile
                    </button>
                    <button onClick={() => { setMenuOpen(false); navigate('/settings'); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-soft">
                      <Settings size={16} /> Settings
                    </button>
                    <button onClick={() => { logout(); navigate('/'); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-danger transition-colors hover:bg-danger/10">
                      <LogOut size={16} /> Sign out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

export default function DashboardLayout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmdOpen(true); }
      if (e.key === 'Escape') setCmdOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="min-h-screen bg-base">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} role={user?.role ?? 'student'} />
      <div className="lg:pl-72">
        <Topbar onMenu={() => setSidebarOpen(true)} onSearch={() => setCmdOpen(true)} />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <PageTransition><Outlet /></PageTransition>
        </main>
      </div>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}
