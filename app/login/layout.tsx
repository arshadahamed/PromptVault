'use client';
import { AdminThemeProvider, useAdminTheme } from '@/context/AdminThemeContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

function LoginLayoutInner({ children }: { children: React.ReactNode }) {
  const { resolved } = useAdminTheme();
  const dark = resolved === 'dark';

  return (
    <div
      className="min-h-screen relative flex flex-col justify-center overflow-x-hidden transition-colors duration-300"
      style={{ backgroundColor: 'var(--adm-bg)' }}
    >
      {/* Subtle enterprise grid + soft radial aura */}
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

      {/* Top-right Lottie Theme Switcher */}
      <div className="fixed top-4 right-4 z-40 w-56">
        <ThemeToggle variant="segmented" />
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
