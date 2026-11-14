'use client';
import { Suspense, useEffect, useId, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Shield, Zap, ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Lock } from 'lucide-react';

const HIGHLIGHTS = [
  {
    icon: Sparkles,
    title: 'Curated Prompt Studio',
    description: 'Create, feature, organize, and publish prompts across every supported AI model.',
  },
  {
    icon: Shield,
    title: 'Hardened Access Control',
    description: 'HMAC-signed HTTP-only sessions with rate-limited authentication.',
  },
  {
    icon: Zap,
    title: 'Fast Bulk Workflows',
    description: 'Server-side filtering, bulk status controls, and JSON/CSV backup tools.',
  },
];

function getSafeNextPath(raw: string | null): string {
  if (!raw) return '/admin';
  if (raw.startsWith('/admin') && !raw.startsWith('//') && !raw.includes('://')) {
    return raw;
  }
  return '/admin';
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get('next'));

  const usernameId = useId();
  const passwordId = useId();
  const errorId = useId();

  const [brand, setBrand] = useState({
    logoText: 'P',
    loginBrandName: 'PromptVault',
    loginTagline: 'Admin Studio',
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/promo')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active || !d) return;
        setBrand({
          logoText: d.logoText || 'P',
          loginBrandName: d.loginBrandName || 'PromptVault',
          loginTagline: d.loginTagline || 'Admin Studio',
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Invalid username or password.');
        setLoading(false);
        return;
      }
      router.push(nextPath);
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1.05fr_430px] gap-10 lg:gap-16 items-center">
      {/* Left: Product Overview (Desktop) */}
      <div className="hidden lg:flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              boxShadow: '0 8px 24px -4px rgba(124, 58, 237, 0.45)',
            }}
          >
            <span className="text-white font-bold text-base">
              {brand.logoText.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-[17px] font-bold leading-tight" style={{ color: 'var(--adm-text)' }}>
              {brand.loginBrandName}
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
              {brand.loginTagline}
            </p>
          </div>
        </div>

        <p
          className="text-[40px] font-bold leading-[1.12] tracking-tight mb-4"
          style={{ color: 'var(--adm-text)', fontFamily: 'var(--font-poppins)' }}
        >
          Manage your AI prompt gallery with clarity.
        </p>

        <p className="text-[15px] leading-relaxed mb-10 max-w-md" style={{ color: 'var(--adm-text-muted)' }}>
          Review submissions, organize categories, customize branding, and keep your public catalog up to date.
        </p>

        <div className="flex flex-col gap-5 mb-10">
          {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-start gap-3.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  backgroundColor: 'var(--adm-accent-soft)',
                  border: '1px solid var(--adm-accent-border)',
                  color: 'var(--adm-accent-text)',
                }}
              >
                <Icon size={16} />
              </div>
              <div>
                <p className="text-[13.5px] font-semibold" style={{ color: 'var(--adm-text)' }}>
                  {title}
                </p>
                <p className="text-[12.5px] mt-0.5 leading-snug" style={{ color: 'var(--adm-text-muted)' }}>
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[13px] font-medium w-fit transition-colors hover:underline"
          style={{ color: 'var(--adm-text-muted)' }}
        >
          <ArrowLeft size={14} />
          Back to public gallery
        </Link>
      </div>

      {/* Right: Sign-in Card */}
      <div
        className="rounded-3xl p-6 sm:p-8"
        style={{
          backgroundColor: 'var(--adm-surface)',
          border: '1px solid var(--adm-border-strong)',
          boxShadow: 'var(--adm-shadow-lg)',
        }}
      >
        {/* Mobile Brand Header */}
        <div className="flex items-center justify-between gap-3 mb-7 lg:hidden">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              <span className="text-white font-bold text-xs">
                {brand.logoText.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-[14px] font-bold leading-tight" style={{ color: 'var(--adm-text)' }}>
                {brand.loginBrandName}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--adm-text-muted)' }}>
                {brand.loginTagline}
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="text-[12px] font-medium inline-flex items-center gap-1"
            style={{ color: 'var(--adm-text-muted)' }}
          >
            <ArrowLeft size={12} />
            Gallery
          </Link>
        </div>

        <div className="mb-6">
          <h1
            className="text-[22px] sm:text-[24px] font-bold tracking-tight"
            style={{ color: 'var(--adm-text)', fontFamily: 'var(--font-poppins)' }}
          >
            Sign in to Admin
          </h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--adm-text-muted)' }}>
            Enter your administrator credentials to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div>
            <label
              htmlFor={usernameId}
              className="block text-[11.5px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--adm-text-muted)' }}
            >
              Username
            </label>
            <input
              id={usernameId}
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter admin username"
              required
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              className="admin-control w-full px-3.5 py-2.5 text-[14px]"
            />
          </div>

          <div>
            <label
              htmlFor={passwordId}
              className="block text-[11.5px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--adm-text-muted)' }}
            >
              Password
            </label>
            <div className="relative">
              <input
                id={passwordId}
                type={showPwd ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                className="admin-control w-full px-3.5 py-2.5 pr-11 text-[14px]"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md cursor-pointer transition-colors"
                style={{ color: 'var(--adm-text-muted)' }}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div
              id={errorId}
              role="alert"
              className="px-3.5 py-2.5 rounded-xl text-[12.5px] font-medium"
              style={{
                backgroundColor: 'var(--adm-danger-bg)',
                border: '1px solid var(--adm-danger-border)',
                color: 'var(--adm-danger-text)',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl font-semibold text-[14px] text-white inline-flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer mt-1"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              boxShadow: '0 6px 20px -4px rgba(124, 58, 237, 0.45)',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <div
          className="mt-6 pt-5 flex items-center justify-center gap-2 text-[12px]"
          style={{ borderTop: '1px solid var(--adm-border)', color: 'var(--adm-text-subtle)' }}
        >
          <Lock size={12} style={{ color: 'var(--adm-accent-text)' }} />
          <span>Protected by HMAC session cookies</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto h-96 rounded-3xl admin-skeleton" />
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
