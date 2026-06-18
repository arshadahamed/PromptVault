'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Shield, Zap, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAdminTheme, tk } from '@/context/AdminThemeContext';

const FEATURES = [
  { icon: Sparkles, label: '2000+ AI Prompts', sub: 'ChatGPT, Midjourney, Nanobanana & more' },
  { icon: Shield,   label: 'Secure Panel',     sub: 'HMAC-signed JWT authentication' },
  { icon: Zap,      label: 'Instant CRUD',     sub: 'Create, edit & delete in real-time' },
];

/* Gradient-text: use backgroundImage (NOT background shorthand) + Tailwind bg-clip-text */
const GRAD_CLASS = 'bg-clip-text text-transparent';

export default function LoginPage() {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const { resolved } = useAdminTheme();
  const t = tk(resolved);
  const dark = resolved === 'dark';

  const [logoText,       setLogoText]       = useState('M');
  const [loginBrandName, setLoginBrandName] = useState('PromptVault');
  const [loginTagline,   setLoginTagline]   = useState('Prompt Studio');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/promo')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        if (d.logoText)       setLogoText(d.logoText);
        if (d.loginBrandName) setLoginBrandName(d.loginBrandName);
        if (d.loginTagline)   setLoginTagline(d.loginTagline);
      })
      .catch(() => {});
  }, []);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -10;
    el.style.transform = `perspective(1200px) rotateY(${x}deg) rotateX(${y}deg) translateZ(0)`;
  }
  function onMouseLeave() {
    if (cardRef.current)
      cardRef.current.style.transform = 'perspective(1200px) rotateY(0deg) rotateX(0deg) translateZ(0)';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) setError('Invalid username or password');
      else router.push('/admin');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  /* ── Card styles ── */
  const cardBg = dark ? 'rgba(10,11,20,0.85)' : 'rgba(255,255,255,0.96)';
  const cardBorder = dark ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.18)';
  const cardShadow = dark
    ? '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)'
    : '0 24px 80px rgba(124,58,237,0.14), 0 4px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(124,58,237,0.1)';

  /* ── Icon box: stronger in light mode ── */
  const iconBox: React.CSSProperties = dark
    ? { background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }
    : { background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', boxShadow: '0 2px 8px rgba(124,58,237,0.12)' };

  /* ── Gradient strings ── */
  const brandGrad = dark
    ? 'linear-gradient(135deg, #e2d9f3, #a5b4fc)'
    : 'linear-gradient(135deg, #5b21b6, #7c3aed)';

  const headingGrad = dark
    ? 'linear-gradient(135deg, #ffffff 30%, #a5b4fc 70%, #7c3aed)'
    : 'linear-gradient(135deg, #1e1b4b 15%, #4f46e5 55%, #7c3aed 85%)';

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 lg:gap-16 items-center">

      {/* ── Left: Brand ───────────────────────────── */}
      <div className="hidden lg:flex flex-col">
        {/* Logo + brand */}
        <div className="flex items-center gap-3 mb-12">
          <div className="anim-glow-pulse w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            boxShadow: '0 8px 32px rgba(124,58,237,0.5)',
          }}>
            <span className="text-white font-bold text-lg">{logoText.slice(0,2).toUpperCase()}</span>
          </div>
          <div>
            <span className={`text-xl font-bold inline-block ${GRAD_CLASS}`} style={{ backgroundImage: brandGrad }}>{loginBrandName}</span>
            <p className="text-[11px] -mt-0.5" style={{ color: t.textMuted }}>{loginTagline}</p>
          </div>
        </div>

        {/* Main heading */}
        <h1 className={`font-bold leading-[1.08] mb-5 ${GRAD_CLASS}`} style={{
          fontSize: '56px',
          backgroundImage: headingGrad,
        }}>
          Manage<br />Your AI<br />Gallery
        </h1>

        <p className="text-[16px] leading-relaxed mb-12 max-w-xs" style={{ color: t.textMuted }}>
          A powerful admin studio for your AI prompt collection. Organize, edit, and grow your gallery effortlessly.
        </p>

        {/* Features */}
        <div className="flex flex-col gap-5">
          {FEATURES.map(({ icon: Icon, label, sub }, i) => (
            <div key={label} className="anim-fade-up flex items-start gap-4" style={{ animationDelay: `${i * 0.12}s` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={iconBox}>
                <Icon size={16} style={{ color: t.accent }} />
              </div>
              <div>
                <p className="font-semibold text-[14px]" style={{ color: t.text }}>{label}</p>
                <p className="text-[12px] mt-0.5" style={{ color: t.textMuted }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 3D sphere */}
        <div className="mt-16 relative w-48 h-48">
          <div className="anim-spin-slow absolute inset-0 rounded-full" style={{
            border: `1px solid rgba(124,58,237,${dark ? '0.2' : '0.25'})`,
          }} />
          <div className="anim-spin-reverse absolute inset-4 rounded-full" style={{
            border: `1px solid rgba(99,102,241,${dark ? '0.3' : '0.35'})`,
          }} />
          <div className="anim-float-medium absolute inset-10 rounded-full" style={{
            background: dark
              ? 'radial-gradient(circle at 35% 35%, rgba(167,139,250,0.7), rgba(99,102,241,0.5) 50%, rgba(30,27,75,0.9))'
              : 'radial-gradient(circle at 35% 35%, rgba(167,139,250,0.9), rgba(99,102,241,0.7) 50%, rgba(79,70,229,0.85))',
            boxShadow: dark
              ? '0 0 40px rgba(124,58,237,0.5), inset -10px -10px 30px rgba(0,0,0,0.4)'
              : '0 0 40px rgba(124,58,237,0.4), inset -8px -8px 20px rgba(79,70,229,0.3)',
          }} />
        </div>

        <Link href="/" className="mt-8 inline-flex items-center gap-2 text-[13px] transition-colors"
          style={{ color: t.textMuted }}
          onMouseEnter={(e) => (e.currentTarget.style.color = t.accent)}
          onMouseLeave={(e) => (e.currentTarget.style.color = t.textMuted)}>
          <ArrowRight size={13} className="rotate-180" />
          Back to gallery
        </Link>
      </div>

      {/* ── Right: Login card ─────────────────────── */}
      <div
        ref={cardRef}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{
          background: cardBg,
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: `1px solid ${cardBorder}`,
          boxShadow: cardShadow,
          transition: 'transform 0.15s ease, background 0.3s ease, box-shadow 0.3s ease',
          willChange: 'transform',
        }}
        className="rounded-3xl p-8 lg:p-9"
      >
        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-8 lg:hidden">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
          }}>
            <span className="text-white font-bold text-sm">{logoText.slice(0,2).toUpperCase()}</span>
          </div>
          <span className="font-bold text-[15px]" style={{ color: t.text }}>{loginBrandName}</span>
        </div>

        <h2 className="text-[26px] font-bold mb-1" style={{ color: t.text }}>Welcome back</h2>
        <p className="text-[14px] mb-8" style={{ color: t.textMuted }}>Sign in to your admin panel</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Username */}
          <div>
            <label className="block text-[11px] font-semibold mb-2 uppercase tracking-widest"
              style={{ color: t.accentText }}>Username</label>
            <input
              type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username" required
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none transition-all"
              style={{
                background: t.input, border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
              onFocus={(e) => (e.target.style.borderColor = t.inputFocus)}
              onBlur={(e)  => (e.target.style.borderColor = t.inputBorder)}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-semibold mb-2 uppercase tracking-widest"
              style={{ color: t.accentText }}>Password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'} value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="w-full px-4 py-3 pr-11 rounded-xl text-[14px] outline-none transition-all"
                style={{
                  background: t.input, border: `1px solid ${t.inputBorder}`,
                  color: t.text,
                }}
                onFocus={(e) => (e.target.style.borderColor = t.inputFocus)}
                onBlur={(e)  => (e.target.style.borderColor = t.inputBorder)}
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                style={{ color: t.textMuted }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl px-4 py-3 text-[13px]"
              style={{ background: t.danger, border: `1px solid ${t.dangerBorder}`, color: t.dangerText }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-[15px] text-white transition-all disabled:opacity-50 cursor-pointer anim-gradient-x mt-1"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5, #7c3aed)',
              backgroundSize: '200% 200%',
              boxShadow: loading ? 'none' : '0 8px 32px rgba(124,58,237,0.45)',
            }}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full anim-spin-slow" style={{ animationDuration: '0.8s' }} />
                Signing in…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Sign in <ArrowRight size={16} />
              </span>
            )}
          </button>
        </form>

        <div className="my-7 flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: t.divider }} />
          <span className="text-[11px] font-semibold tracking-widest" style={{ color: t.textSub }}>SECURED</span>
          <div className="flex-1 h-px" style={{ background: t.divider }} />
        </div>

        <div className="flex items-center justify-center gap-2 text-[12px]" style={{ color: t.textMuted }}>
          <Shield size={12} style={{ color: t.accent }} />
          <span>Contact your administrator for access</span>
        </div>
      </div>
    </div>
  );
}
