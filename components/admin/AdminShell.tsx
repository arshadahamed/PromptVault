'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Images, Tag, LogOut, ExternalLink, Sun, Moon, Monitor, Settings, ArrowLeftRight } from 'lucide-react';
import { useAdminTheme, tk, type ThemeMode } from '@/context/AdminThemeContext';
import { useEffect, useState } from 'react';

const NAV = [
  { href: '/admin',               label: 'Dashboard',     icon: LayoutDashboard, exact: true },
  { href: '/admin/prompts',       label: 'Prompts',       icon: Images },
  { href: '/admin/categories',    label: 'Categories',    icon: Tag },
  { href: '/admin/import-export', label: 'Import/Export', icon: ArrowLeftRight },
  { href: '/admin/settings',      label: 'Settings',      icon: Settings },
];

const THEME_OPTS: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
  { mode: 'light',  icon: Sun,     label: 'Light'  },
  { mode: 'dark',   icon: Moon,    label: 'Dark'   },
  { mode: 'system', icon: Monitor, label: 'System' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { mode, resolved, setMode } = useAdminTheme();
  const t = tk(resolved);
  const dark = resolved === 'dark';

  const [adminName, setAdminName]       = useState('PromptVault');
  const [adminTagline, setAdminTagline] = useState('Admin Studio');
  const [logoText, setLogoText]         = useState('P');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.ok ? r.json() : null)
      .then(s => {
        if (!s) return;
        if (s.adminName)    setAdminName(s.adminName);
        if (s.adminTagline) setAdminTagline(s.adminTagline);
        if (s.logoText)     setLogoText(s.logoText);
      })
      .catch(() => {});
  }, [pathname]); // re-fetch when navigating (picks up saved changes)

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen transition-colors duration-300" style={{ background: t.bg }}>

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside
        className="w-60 shrink-0 flex flex-col fixed inset-y-0 left-0 z-20 transition-colors duration-300"
        style={{ background: t.sidebar, borderRight: `1px solid ${t.sidebarBorder}` }}
      >
        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: `1px solid ${t.divider}` }}>
          <Link href="/admin" className="flex items-center gap-3 group">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                boxShadow: '0 4px 20px rgba(124,58,237,0.45)',
              }}
            >
              <span className="text-white font-bold text-sm">{logoText.slice(0, 2).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-[14px] font-bold leading-tight" style={{ color: t.text }}>{adminName}</p>
              <p className="text-[10px] leading-tight" style={{ color: t.accentText }}>{adminTagline}</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 flex flex-col gap-1 mt-1 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2" style={{ color: t.textSub }}>
            Navigation
          </p>
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all"
                style={active ? {
                  background: t.accentMuted,
                  color: t.accentText,
                  boxShadow: `inset 0 0 0 1px ${t.accentBorder}`,
                } : { color: t.textMuted }}
              >
                <Icon size={15} style={{ color: active ? t.accent : t.textMuted }} />
                {label}
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: t.accent, boxShadow: `0 0 6px ${t.accent}` }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Theme toggle */}
        <div className="px-4 pb-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest px-1 mb-2" style={{ color: t.textSub }}>
            Appearance
          </p>
          <div className="flex rounded-xl overflow-hidden" style={{ background: dark ? 'rgba(255,255,255,0.05)' : '#f3f4f6' }}>
            {THEME_OPTS.map(({ mode: m, icon: Icon, label }) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  title={label}
                  className="flex-1 flex items-center justify-center py-2 transition-all cursor-pointer"
                  style={{
                    background: active ? (dark ? 'rgba(124,58,237,0.25)' : '#ffffff') : 'transparent',
                    color: active ? t.accent : t.textMuted,
                    boxShadow: active ? (dark ? 'none' : '0 1px 4px rgba(0,0,0,0.1)') : 'none',
                    borderRadius: '10px',
                    margin: '3px',
                  }}
                >
                  <Icon size={13} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3" style={{ borderTop: `1px solid ${t.divider}` }}>
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] font-medium transition-all mb-1"
            style={{ color: t.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.color = t.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = t.textMuted)}
          >
            <ExternalLink size={13} />
            View Gallery
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] font-medium transition-all cursor-pointer"
            style={{ color: dark ? 'rgba(248,113,113,0.6)' : '#ef4444' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#f87171';
              e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = dark ? 'rgba(248,113,113,0.6)' : '#ef4444';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────── */}
      <main className="ml-60 flex-1 min-w-0 min-h-screen transition-colors duration-300" style={{ background: t.bg }}>
        {children}
      </main>
    </div>
  );
}
