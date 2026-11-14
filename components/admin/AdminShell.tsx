'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Images, Tag, LogOut, ExternalLink, Sun, Moon, Monitor,
  Settings, ArrowLeftRight, Menu, X, Search, Plus, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { useAdminTheme, type ThemeMode } from '@/context/AdminThemeContext';
import { AdminCommandPalette } from './AdminCommandPalette';
import { useToast } from './ui/ToastProvider';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  exact?: boolean;
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true }],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/prompts', label: 'Prompts', icon: Images },
      { href: '/admin/categories', label: 'Categories', icon: Tag },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { href: '/admin/import-export', label: 'Import / Export', icon: ArrowLeftRight },
      { href: '/admin/settings', label: 'Site Settings', icon: Settings },
    ],
  },
];

const THEME_OPTS: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
  { mode: 'light', icon: Sun, label: 'Light' },
  { mode: 'dark', icon: Moon, label: 'Dark' },
  { mode: 'system', icon: Monitor, label: 'System' },
];

function getRouteMeta(pathname: string): { title: string; section: string } {
  if (pathname === '/admin') return { title: 'Dashboard', section: 'Overview' };
  if (pathname === '/admin/prompts/new') return { title: 'Create Prompt', section: 'Prompts' };
  if (pathname.startsWith('/admin/prompts/') && pathname.endsWith('/edit')) {
    return { title: 'Edit Prompt', section: 'Prompts' };
  }
  if (pathname.startsWith('/admin/prompts')) return { title: 'Prompts', section: 'Content' };
  if (pathname.startsWith('/admin/categories')) return { title: 'Categories', section: 'Content' };
  if (pathname.startsWith('/admin/import-export')) return { title: 'Import & Export', section: 'Workspace' };
  if (pathname.startsWith('/admin/settings')) return { title: 'Site Settings', section: 'Workspace' };
  return { title: 'Admin Studio', section: 'Overview' };
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { mode, setMode } = useAdminTheme();
  const { toast } = useToast();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [brand, setBrand] = useState({
    adminName: 'PromptVault',
    adminTagline: 'Admin Studio',
    logoText: 'P',
  });

  useEffect(() => {
    let active = true;
    function loadBrand() {
      fetch('/api/admin/settings')
        .then((r) => (r.ok ? r.json() : null))
        .then((s) => {
          if (!active || !s) return;
          setBrand({
            adminName: s.adminName || 'PromptVault',
            adminTagline: s.adminTagline || 'Admin Studio',
            logoText: s.logoText || 'P',
          });
        })
        .catch(() => {});
    }
    loadBrand();
    window.addEventListener('admin-settings-updated', loadBrand);
    return () => {
      active = false;
      window.removeEventListener('admin-settings-updated', loadBrand);
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((v) => !v);
      } else if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  async function logout() {
    setSigningOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      toast({ title: 'Sign out failed', description: 'Please try again.', variant: 'error' });
      setSigningOut(false);
    }
  }

  const routeMeta = getRouteMeta(pathname);

  const renderNavContent = (isCompact: boolean, onNavClick?: () => void) => (
    <>
      {/* Brand header */}
      <div
        className={cn(
          'h-16 flex items-center shrink-0',
          isCompact ? 'justify-center px-2' : 'justify-between px-4'
        )}
        style={{ borderBottom: '1px solid var(--adm-border)' }}
      >
        <Link
          href="/admin"
          onClick={onNavClick}
          className="flex items-center gap-3 min-w-0 group"
          title={brand.adminName}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              boxShadow: '0 4px 16px -2px rgba(124,58,237,0.45)',
            }}
          >
            <span className="text-white font-bold text-xs tracking-wide">
              {brand.logoText.slice(0, 2).toUpperCase()}
            </span>
          </div>
          {!isCompact && (
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold leading-tight truncate" style={{ color: 'var(--adm-text)' }}>
                {brand.adminName}
              </p>
              <p className="text-[11px] leading-tight truncate" style={{ color: 'var(--adm-accent-text)' }}>
                {brand.adminTagline}
              </p>
            </div>
          )}
        </Link>

        {onNavClick && (
          <button
            type="button"
            onClick={onNavClick}
            aria-label="Close navigation menu"
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer md:hidden"
            style={{ color: 'var(--adm-text-muted)', backgroundColor: 'var(--adm-surface-muted)' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Grouped Navigation */}
      <nav aria-label="Admin navigation" className="flex-1 px-2.5 py-4 flex flex-col gap-5 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!isCompact && (
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.12em] px-3 mb-1.5"
                style={{ color: 'var(--adm-text-subtle)' }}
              >
                {group.label}
              </p>
            )}
            <ul className="flex flex-col gap-0.5">
              {group.items.map(({ href, label, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavClick}
                      title={isCompact ? label : undefined}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-xl text-[13px] font-medium transition-colors',
                        isCompact ? 'justify-center h-10 px-0' : 'px-3 py-2'
                      )}
                      style={
                        active
                          ? {
                              backgroundColor: 'var(--adm-accent-soft)',
                              color: 'var(--adm-accent-text)',
                              boxShadow: 'inset 0 0 0 1px var(--adm-accent-border)',
                            }
                          : { color: 'var(--adm-text-muted)' }
                      }
                    >
                      <Icon
                        size={16}
                        style={{ color: active ? 'var(--adm-accent-text)' : 'var(--adm-text-muted)' }}
                      />
                      {!isCompact && <span className="truncate flex-1">{label}</span>}
                      {!isCompact && active && (
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: 'var(--adm-accent)' }}
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Theme switcher */}
      <div className={cn('pb-3', isCompact ? 'px-2' : 'px-3')}>
        {!isCompact && (
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.12em] px-2 mb-2"
            style={{ color: 'var(--adm-text-subtle)' }}
          >
            Appearance
          </p>
        )}
        <div
          role="group"
          aria-label="Theme preference"
          className={cn(
            'flex rounded-xl p-1 gap-0.5',
            isCompact ? 'flex-col' : 'flex-row'
          )}
          style={{
            backgroundColor: 'var(--adm-surface-muted)',
            border: '1px solid var(--adm-border)',
          }}
        >
          {THEME_OPTS.map(({ mode: m, icon: Icon, label }) => {
            const active = mode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={active}
                aria-label={`${label} theme`}
                title={`${label} theme`}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-all cursor-pointer"
                style={{
                  backgroundColor: active ? 'var(--adm-surface)' : 'transparent',
                  color: active ? 'var(--adm-accent-text)' : 'var(--adm-text-muted)',
                  boxShadow: active ? 'var(--adm-shadow-sm)' : 'none',
                }}
              >
                <Icon size={13} />
                {!isCompact && <span>{label}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer actions */}
      <div
        className={cn('p-2.5 flex flex-col gap-1', isCompact && 'items-center')}
        style={{ borderTop: '1px solid var(--adm-border)' }}
      >
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          title="View Public Gallery"
          className={cn(
            'flex items-center gap-2.5 rounded-xl text-[12.5px] font-medium transition-colors admin-surface-hover border border-transparent',
            isCompact ? 'justify-center w-10 h-10' : 'px-3 py-2'
          )}
          style={{ color: 'var(--adm-text-muted)' }}
        >
          <ExternalLink size={14} />
          {!isCompact && <span>View Gallery</span>}
        </Link>

        <button
          type="button"
          onClick={logout}
          disabled={signingOut}
          title="Sign out"
          className={cn(
            'flex items-center gap-2.5 rounded-xl text-[12.5px] font-medium transition-colors cursor-pointer disabled:opacity-50',
            isCompact ? 'justify-center w-10 h-10' : 'w-full px-3 py-2'
          )}
          style={{ color: 'var(--adm-danger-text)' }}
        >
          <LogOut size={14} />
          {!isCompact && <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--adm-bg)' }}>
      <a
        href="#admin-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold focus:text-white"
        style={{ backgroundColor: 'var(--adm-accent)' }}
      >
        Skip to main content
      </a>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col fixed inset-y-0 left-0 z-30 transition-[width] duration-200',
          collapsed ? 'w-[72px]' : 'w-64'
        )}
        style={{
          backgroundColor: 'var(--adm-sidebar)',
          borderRight: '1px solid var(--adm-border)',
        }}
      >
        {renderNavContent(collapsed)}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            className="relative z-10 w-72 max-w-[85vw] h-full flex flex-col"
            style={{
              backgroundColor: 'var(--adm-sidebar)',
              borderRight: '1px solid var(--adm-border-strong)',
              boxShadow: 'var(--adm-shadow-lg)',
            }}
          >
            {renderNavContent(false, () => setMobileOpen(false))}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={cn(
          'flex-1 min-w-0 flex flex-col transition-[padding-left] duration-200',
          collapsed ? 'md:pl-[72px]' : 'md:pl-64'
        )}
      >
        {/* Sticky Top Utility Bar */}
        <header
          className="sticky top-0 z-20 h-14 sm:h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 backdrop-blur-md"
          style={{
            backgroundColor: 'var(--adm-topbar)',
            borderBottom: '1px solid var(--adm-border)',
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer"
              style={{
                backgroundColor: 'var(--adm-surface-muted)',
                border: '1px solid var(--adm-border)',
                color: 'var(--adm-text)',
              }}
            >
              <Menu size={17} />
            </button>

            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden md:flex w-8 h-8 rounded-lg items-center justify-center cursor-pointer transition-colors"
              style={{
                backgroundColor: 'var(--adm-surface-muted)',
                color: 'var(--adm-text-muted)',
              }}
            >
              {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
            </button>

            <div className="min-w-0 flex items-center gap-2">
              <span className="hidden sm:inline text-[12px]" style={{ color: 'var(--adm-text-subtle)' }}>
                {routeMeta.section}
              </span>
              <span className="hidden sm:inline text-[12px]" style={{ color: 'var(--adm-text-subtle)' }}>
                /
              </span>
              <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--adm-text)' }}>
                {routeMeta.title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Command search trigger */}
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="h-9 px-3 rounded-xl flex items-center gap-2.5 text-[12.5px] cursor-pointer transition-colors"
              style={{
                backgroundColor: 'var(--adm-surface)',
                border: '1px solid var(--adm-border)',
                color: 'var(--adm-text-muted)',
              }}
            >
              <Search size={14} />
              <span className="hidden sm:inline">Search prompts or jump…</span>
              <kbd
                className="hidden lg:inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: 'var(--adm-surface-muted)',
                  border: '1px solid var(--adm-border)',
                  color: 'var(--adm-text-subtle)',
                }}
              >
                ⌘K
              </kbd>
            </button>

            {pathname !== '/admin/prompts/new' && (
              <Link
                href="/admin/prompts/new"
                className="h-9 px-3 sm:px-3.5 rounded-xl inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90 shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                  boxShadow: '0 4px 14px -4px rgba(124, 58, 237, 0.5)',
                }}
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Add Prompt</span>
              </Link>
            )}
          </div>
        </header>

        <main id="admin-main-content" className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      <AdminCommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}
