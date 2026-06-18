'use client';
import { AdminThemeProvider, useAdminTheme, tk, type ThemeMode } from '@/context/AdminThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

const THEME_OPTS: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
  { mode: 'light',  icon: Sun,     label: 'Light'  },
  { mode: 'dark',   icon: Moon,    label: 'Dark'   },
  { mode: 'system', icon: Monitor, label: 'System' },
];

function LoginLayoutInner({ children }: { children: React.ReactNode }) {
  const { mode, resolved, setMode } = useAdminTheme();
  const t = tk(resolved);
  const dark = resolved === 'dark';

  const bg         = dark ? '#04060f' : '#f4f6fb';
  const orbColor1  = dark ? 'rgba(109,40,217,0.25)' : 'rgba(109,40,217,0.12)';
  const orbColor2  = dark ? 'rgba(79,70,229,0.2)'   : 'rgba(79,70,229,0.1)';
  const gridColor  = dark ? 'rgba(99,102,241,0.08)'  : 'rgba(99,102,241,0.06)';
  const shapeColor1= dark ? 'rgba(124,58,237,0.25)'  : 'rgba(124,58,237,0.2)';

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center transition-colors duration-500"
      style={{ background: bg }}>

      {/* Theme toggle — top right */}
      <div className="absolute top-4 right-4 z-50 flex rounded-xl overflow-hidden"
        style={{ background: dark ? 'rgba(255,255,255,0.06)' : '#e5e7eb' }}>
        {THEME_OPTS.map(({ mode: m, icon: Icon, label }) => {
          const active = mode === m;
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              title={label}
              className="flex items-center justify-center w-9 h-9 transition-all cursor-pointer"
              style={{
                background: active ? (dark ? 'rgba(124,58,237,0.3)' : '#ffffff') : 'transparent',
                color: active ? t.accent : t.textMuted,
                borderRadius: '10px',
                margin: '2px',
                boxShadow: active && !dark ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
              }}
            >
              <Icon size={14} />
            </button>
          );
        })}
      </div>

      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="anim-orb-pulse absolute" style={{
          width: 600, height: 600, borderRadius: '50%',
          background: `radial-gradient(circle, ${orbColor1} 0%, transparent 70%)`,
          top: '-200px', left: '-150px',
        }} />
        <div className="anim-orb-pulse absolute" style={{
          width: 500, height: 500, borderRadius: '50%',
          background: `radial-gradient(circle, ${orbColor2} 0%, transparent 70%)`,
          bottom: '-150px', right: '-100px',
          animationDelay: '2s',
        }} />
        <div className="anim-orb-pulse absolute" style={{
          width: 300, height: 300, borderRadius: '50%',
          background: `radial-gradient(circle, rgba(16,185,129,${dark ? '0.1' : '0.06'}) 0%, transparent 70%)`,
          top: '40%', right: '20%',
          animationDelay: '4s',
        }} />

        {/* Perspective grid */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
          backgroundImage: `
            linear-gradient(${gridColor} 1px, transparent 1px),
            linear-gradient(90deg, ${gridColor} 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          transform: 'perspective(600px) rotateX(55deg)',
          transformOrigin: 'bottom center',
          maskImage: 'linear-gradient(to top, black 0%, transparent 80%)',
          WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 80%)',
        }} />

        {/* Floating geometric shapes */}
        <div className="anim-float-slow absolute" style={{
          width: 80, height: 80,
          border: `1px solid ${shapeColor1}`,
          borderRadius: '18px', top: '15%', right: '8%',
          transform: 'rotate(20deg)',
          backdropFilter: 'blur(2px)',
          background: 'rgba(124,58,237,0.05)',
          animationDelay: '1s',
        }} />
        <div className="anim-float-medium absolute" style={{
          width: 50, height: 50,
          border: `1px solid rgba(79,70,229,${dark ? '0.3' : '0.2'})`,
          borderRadius: '12px', top: '65%', left: '6%',
          transform: 'rotate(-15deg)',
          background: 'rgba(79,70,229,0.04)',
          animationDelay: '2.5s',
        }} />
        <div className="anim-float-slow absolute" style={{
          width: 120, height: 120,
          border: `1px solid rgba(16,185,129,${dark ? '0.15' : '0.1'})`,
          borderRadius: '50%', bottom: '20%', right: '12%',
          background: 'rgba(16,185,129,0.03)',
          animationDelay: '0.5s',
        }} />

        {/* Rotating rings */}
        <div className="anim-spin-slow absolute" style={{
          width: 900, height: 900, borderRadius: '50%',
          border: `1px solid rgba(99,102,241,${dark ? '0.06' : '0.05'})`,
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        }} />
        <div className="anim-spin-reverse absolute" style={{
          width: 700, height: 700, borderRadius: '50%',
          border: `1px solid rgba(124,58,237,${dark ? '0.08' : '0.06'})`,
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        }} />
      </div>

      <div className="relative z-10 w-full px-4 py-12">{children}</div>
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
