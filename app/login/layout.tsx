'use client';
import { AdminThemeProvider, useAdminTheme, type ThemeMode } from '@/context/AdminThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

const THEME_OPTS: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
  { mode: 'light', icon: Sun, label: 'Light' },
  { mode: 'dark', icon: Moon, label: 'Dark' },
  { mode: 'system', icon: Monitor, label: 'System' },
];

function LoginLayoutInner({ children }: { children: React.ReactNode }) {
  const { mode, resolved, setMode } = useAdminTheme();
  const dark = resolved === 'dark';

  return (
    <div
      className="min-h-screen relative flex flex-col justify-center overflow-x-hidden transition-colors duration-300"
      style={{ backgroundColor: 'var(--adm-bg)' }}
    >
      {/* Subtle enterprise grid + soft radial aura (no excessive motion) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div
          className="absolute -top-48 left-1/2 -translate-x-1/2 w-[780px] h-[420px] rounded-full blur-3xl opacity-50"
          style={{
            background: dark
              ? 'radial-gradient(ellipse at center, rgba(124, 58, 237, 0.22), transparent 70%)'
              : 'radial-gradient(ellipse at center, rgba(109, 40, 217, 0.12), transparent 70%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `radial-gradient(${dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'} 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(ellipse at center, black 35%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 35%, transparent 80%)',
          }}
        />
      </div>

      {/* Theme toggle */}
      <div
        role="group"
        aria-label="Theme preference"
        className="fixed top-4 right-4 z-40 flex items-center gap-0.5 p-1 rounded-xl"
        style={{
          backgroundColor: 'var(--adm-surface)',
          border: '1px solid var(--adm-border)',
          boxShadow: 'var(--adm-shadow-sm)',
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
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
              style={{
                backgroundColor: active ? 'var(--adm-accent-soft)' : 'transparent',
                color: active ? 'var(--adm-accent-text)' : 'var(--adm-text-muted)',
              }}
            >
              <Icon size={14} />
            </button>
          );
        })}
      </div>

      <main className="relative z-10 w-full px-4 py-12">{children}</main>
    </div>
  );
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminThemeProvider>
      <LoginLayoutInner>{children}</LoginLayoutInner>
    </AdminThemeProvider>
  );
}
