'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Globe, Image as ImageIcon, Type, Link as LinkIcon, Copyright,
  Share2, Check, Loader2, Palette, Bell, RefreshCw, Upload, LayoutDashboard, Megaphone, LogIn,
} from 'lucide-react';
import { useAdminTheme, tk } from '@/context/AdminThemeContext';

interface Settings {
  siteName: string; siteTagline: string; siteDescription: string;
  logoText: string; logoImageUrl: string; faviconUrl: string;
  primaryColor: string; metaTitle: string; metaDescription: string;
  footerCopyright: string;
  footerLinks: { label: string; href: string }[];
  socialLinks: { twitter: string; github: string; instagram: string };
  announcementBar: string;
  adminName: string; adminTagline: string;
  loginBrandName: string; loginTagline: string;
  promoEnabled: boolean;
  promoTitle: string; promoDescription: string;
  promoEmoji1: string; promoEmoji2: string;
  promoGradientFrom: string; promoGradientTo: string;
  promoCtaText: string; promoCtaUrl: string;
  updatedAt: string;
}

export default function SettingsPage() {
  const { resolved } = useAdminTheme();
  const t = tk(resolved);
  const dark = resolved === 'dark';
  const faviconRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'favicon' | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(setForm);
  }, []);

  function set(key: keyof Settings, value: any) {
    setForm(f => f ? { ...f, [key]: value } : f);
  }
  function setSocial(key: keyof Settings['socialLinks'], value: string) {
    setForm(f => f ? { ...f, socialLinks: { ...f.socialLinks, [key]: value } } : f);
  }
  function setFooterLink(i: number, field: 'label' | 'href', value: string) {
    setForm(f => {
      if (!f) return f;
      const links = [...f.footerLinks];
      links[i] = { ...links[i], [field]: value };
      return { ...f, footerLinks: links };
    });
  }
  function addFooterLink() {
    setForm(f => f ? { ...f, footerLinks: [...f.footerLinks, { label: '', href: '' }] } : f);
  }
  function removeFooterLink(i: number) {
    setForm(f => f ? { ...f, footerLinks: f.footerLinks.filter((_, idx) => idx !== i) } : f);
  }

  async function uploadImage(file: File, target: 'logo' | 'favicon') {
    setUploading(target);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.localImg) set(target === 'logo' ? 'logoImageUrl' : 'faviconUrl', data.localImg);
    setUploading(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true); setError(''); setSaved(false);
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) { setError('Failed to save settings.'); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const card = { background: dark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: `1px solid ${t.cardBorder}`, borderRadius: '16px' };
  const inp = {
    background: t.input, border: `1px solid ${t.inputBorder}`, color: t.text,
    borderRadius: '10px', fontSize: '13px', outline: 'none', width: '100%', padding: '10px 14px',
  };
  const lbl = { fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: t.textSub, marginBottom: '6px', display: 'block' };

  if (!form) return (
    <div className="p-8 flex items-center justify-center min-h-64">
      <Loader2 size={24} className="animate-spin" style={{ color: t.accent }} />
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}>
            <Globe size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold" style={{ color: t.text }}>Site Settings</h1>
            <p className="text-[13px]" style={{ color: t.textMuted }}>
              Manage your website identity, branding, and metadata
            </p>
          </div>
        </div>
        {form.updatedAt && (
          <p className="text-[11px] mt-3 flex items-center gap-1.5" style={{ color: t.textSub }}>
            <RefreshCw size={11} />
            Last saved: {new Date(form.updatedAt).toLocaleString()}
          </p>
        )}
      </div>

      <form onSubmit={save} className="flex flex-col gap-6">

        {/* ── Identity ──────────────────────────────── */}
        <Section icon={Type} label="Identity" t={t} dark={dark}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Site Name" style={lbl}>
              <input value={form.siteName} onChange={e => set('siteName', e.target.value)}
                placeholder="PromptVault" style={inp}
                onFocus={e => (e.target.style.borderColor = t.inputFocus)}
                onBlur={e => (e.target.style.borderColor = t.inputBorder)} />
            </Field>
            <Field label="Tagline" style={lbl}>
              <input value={form.siteTagline} onChange={e => set('siteTagline', e.target.value)}
                placeholder="Free AI Prompt Gallery" style={inp}
                onFocus={e => (e.target.style.borderColor = t.inputFocus)}
                onBlur={e => (e.target.style.borderColor = t.inputBorder)} />
            </Field>
            <Field label="Logo Letter" style={lbl}>
              <input value={form.logoText} onChange={e => set('logoText', e.target.value)}
                placeholder="M" maxLength={3} style={{ ...inp, textTransform: 'uppercase' }}
                onFocus={e => (e.target.style.borderColor = t.inputFocus)}
                onBlur={e => (e.target.style.borderColor = t.inputBorder)} />
            </Field>
            <Field label="Primary Color" style={lbl}>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-[10px]"
                style={{ background: t.input, border: `1px solid ${t.inputBorder}` }}>
                <input type="color" value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent" />
                <span className="text-[13px] font-mono" style={{ color: t.text }}>{form.primaryColor}</span>
              </div>
            </Field>
            <Field label="Site Description" style={lbl} className="md:col-span-2">
              <textarea value={form.siteDescription} onChange={e => set('siteDescription', e.target.value)}
                rows={2} placeholder="A brief description of your gallery…"
                className="resize-none" style={{ ...inp, padding: '10px 14px' }}
                onFocus={e => (e.target.style.borderColor = t.inputFocus)}
                onBlur={e => (e.target.style.borderColor = t.inputBorder)} />
            </Field>
          </div>
        </Section>

        {/* ── Admin Sidebar Branding ────────────────── */}
        <Section icon={LayoutDashboard} label="Admin Sidebar" t={t} dark={dark}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

            {/* Live preview */}
            <div>
              <span style={lbl}>Live Preview</span>
              <div className="rounded-xl p-4 flex flex-col gap-3"
                style={{ background: dark ? 'rgba(10,11,22,0.97)' : '#ffffff', border: `1px solid ${t.cardBorder}` }}>
                {/* Sidebar logo row — mirrors AdminShell exactly */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 4px 20px rgba(124,58,237,0.45)' }}>
                    <span className="text-white font-bold text-sm">
                      {(form.logoText || 'M').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-[14px] font-bold leading-tight" style={{ color: dark ? '#f1f5f9' : '#111827' }}>
                      {form.adminName || 'MeiGen'}
                    </p>
                    <p className="text-[10px] leading-tight" style={{ color: '#c4b5fd' }}>
                      {form.adminTagline || 'Admin Studio'}
                    </p>
                  </div>
                </div>
                <p className="text-[10px]" style={{ color: dark ? 'rgba(255,255,255,0.25)' : '#9ca3af' }}>
                  This is how the sidebar header looks in the admin panel.
                </p>
              </div>
            </div>

            {/* Edit fields */}
            <div className="flex flex-col gap-4">
              <Field label="Logo Letter" style={lbl}>
                <input value={form.logoText} onChange={e => set('logoText', e.target.value)}
                  placeholder="M" maxLength={2} style={{ ...inp, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  onFocus={e => (e.target.style.borderColor = t.inputFocus)}
                  onBlur={e => (e.target.style.borderColor = t.inputBorder)} />
                <span className="text-[11px] mt-1" style={{ color: t.textSub }}>1–2 characters shown in the purple badge</span>
              </Field>
              <Field label="Admin Panel Name" style={lbl}>
                <input value={form.adminName} onChange={e => set('adminName', e.target.value)}
                  placeholder="PromptVault" style={inp}
                  onFocus={e => (e.target.style.borderColor = t.inputFocus)}
                  onBlur={e => (e.target.style.borderColor = t.inputBorder)} />
              </Field>
              <Field label="Subtitle / Tagline" style={lbl}>
                <input value={form.adminTagline} onChange={e => set('adminTagline', e.target.value)}
                  placeholder="Admin Studio" style={inp}
                  onFocus={e => (e.target.style.borderColor = t.inputFocus)}
                  onBlur={e => (e.target.style.borderColor = t.inputBorder)} />
              </Field>
            </div>
          </div>
        </Section>

        {/* ── Login Page Branding ───────────────────── */}
        <Section icon={LogIn} label="Login Page Branding" t={t} dark={dark}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

            {/* Live preview */}
            <div>
              <span style={lbl}>Live Preview</span>
              <div className="rounded-xl overflow-hidden"
                style={{ background: dark ? 'rgba(10,11,22,0.97)' : '#f5f3ff', border: `1px solid ${t.cardBorder}` }}>
                {/* Mini login left-panel header */}
                <div className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 6px 20px rgba(124,58,237,0.45)' }}>
                    <span className="text-white font-bold text-base">{(form.logoText || 'M').slice(0,2).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-[15px] font-bold leading-tight"
                      style={{ background: dark ? 'linear-gradient(135deg,#e2d9f3,#a5b4fc)' : 'linear-gradient(135deg,#5b21b6,#7c3aed)',
                               WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                      {form.loginBrandName || 'MeiGen AI'}
                    </p>
                    <p className="text-[10px] leading-tight mt-0.5" style={{ color: dark ? 'rgba(255,255,255,0.45)' : '#6b7280' }}>
                      {form.loginTagline || 'Prompt Studio'}
                    </p>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <p className="text-[10px]" style={{ color: dark ? 'rgba(255,255,255,0.25)' : '#9ca3af' }}>
                    Shown on the login page left-panel and mobile header.
                  </p>
                </div>
              </div>
            </div>

            {/* Fields */}
            <div className="flex flex-col gap-4">
              <Field label="Logo Letter" style={lbl}>
                <input value={form.logoText} onChange={e => set('logoText', e.target.value)}
                  placeholder="M" maxLength={2}
                  style={{ ...inp, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  onFocus={e => (e.target.style.borderColor = t.inputFocus)}
                  onBlur={e => (e.target.style.borderColor = t.inputBorder)} />
                <span className="text-[11px] mt-1" style={{ color: t.textSub }}>Same letter used in sidebar & login badge</span>
              </Field>
              <Field label="Brand Name" style={lbl}>
                <input value={form.loginBrandName} onChange={e => set('loginBrandName', e.target.value)}
                  placeholder="PromptVault" style={inp}
                  onFocus={e => (e.target.style.borderColor = t.inputFocus)}
                  onBlur={e => (e.target.style.borderColor = t.inputBorder)} />
              </Field>
              <Field label="Tagline" style={lbl}>
                <input value={form.loginTagline} onChange={e => set('loginTagline', e.target.value)}
                  placeholder="Prompt Studio" style={inp}
                  onFocus={e => (e.target.style.borderColor = t.inputFocus)}
                  onBlur={e => (e.target.style.borderColor = t.inputBorder)} />
              </Field>
            </div>
          </div>
        </Section>

        {/* ── Logo & Favicon ────────────────────────── */}
        <Section icon={ImageIcon} label="Logo & Favicon" t={t} dark={dark}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Logo */}
            <div>
              <span style={lbl}>Logo Image (optional)</span>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                  style={{ background: form.logoImageUrl ? 'transparent' : 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                  {form.logoImageUrl
                    ? <img src={form.logoImageUrl} alt="Logo" className="w-full h-full object-contain" />
                    : <span className="text-white text-xl font-bold">{form.logoText || 'M'}</span>}
                </div>
                <div className="flex-1">
                  <input ref={logoRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'logo'); }} />
                  <button type="button" onClick={() => logoRef.current?.click()} disabled={uploading === 'logo'}
                    className="w-full py-2 rounded-[10px] border-2 border-dashed text-[12px] flex items-center justify-center gap-2 cursor-pointer transition-all"
                    style={{ borderColor: t.cardBorder, color: t.textMuted }}>
                    {uploading === 'logo' ? <><Loader2 size={12} className="animate-spin" />Uploading…</> : <><Upload size={12} />Upload logo</>}
                  </button>
                  {form.logoImageUrl && (
                    <button type="button" onClick={() => set('logoImageUrl', '')}
                      className="mt-1 text-[11px] cursor-pointer" style={{ color: t.textSub }}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <Field label="Or paste URL" style={lbl}>
                <input value={form.logoImageUrl} onChange={e => set('logoImageUrl', e.target.value)}
                  placeholder="https://…" style={inp}
                  onFocus={e => (e.target.style.borderColor = t.inputFocus)}
                  onBlur={e => (e.target.style.borderColor = t.inputBorder)} />
              </Field>
            </div>

            {/* Favicon */}
            <div>
              <span style={lbl}>Favicon</span>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                  style={{ background: dark ? 'rgba(255,255,255,0.06)' : '#f3f4f6', border: `1px solid ${t.cardBorder}` }}>
                  {form.faviconUrl
                    ? <img src={form.faviconUrl} alt="Favicon" className="w-8 h-8 object-contain" />
                    : <span className="text-[11px]" style={{ color: t.textSub }}>None</span>}
                </div>
                <div className="flex-1">
                  <input ref={faviconRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'favicon'); }} />
                  <button type="button" onClick={() => faviconRef.current?.click()} disabled={uploading === 'favicon'}
                    className="w-full py-2 rounded-[10px] border-2 border-dashed text-[12px] flex items-center justify-center gap-2 cursor-pointer transition-all"
                    style={{ borderColor: t.cardBorder, color: t.textMuted }}>
                    {uploading === 'favicon' ? <><Loader2 size={12} className="animate-spin" />Uploading…</> : <><Upload size={12} />Upload favicon</>}
                  </button>
                  {form.faviconUrl && (
                    <button type="button" onClick={() => set('faviconUrl', '')}
                      className="mt-1 text-[11px] cursor-pointer" style={{ color: t.textSub }}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <Field label="Or paste URL" style={lbl}>
                <input value={form.faviconUrl} onChange={e => set('faviconUrl', e.target.value)}
                  placeholder="https://…/favicon.ico" style={inp}
                  onFocus={e => (e.target.style.borderColor = t.inputFocus)}
                  onBlur={e => (e.target.style.borderColor = t.inputBorder)} />
              </Field>
            </div>
          </div>
        </Section>

        {/* ── SEO / Meta ────────────────────────────── */}
        <Section icon={Globe} label="SEO & Meta" t={t} dark={dark}>
          <div className="flex flex-col gap-4">
            <Field label="Meta Title" style={lbl}>
              <input value={form.metaTitle} onChange={e => set('metaTitle', e.target.value)}
                placeholder="PromptVault — Free AI Prompt Gallery" style={inp}
                onFocus={e => (e.target.style.borderColor = t.inputFocus)}
                onBlur={e => (e.target.style.borderColor = t.inputBorder)} />
              <span className="text-[11px] mt-1" style={{ color: form.metaTitle.length > 60 ? '#ef4444' : t.textSub }}>
                {form.metaTitle.length}/60 chars
              </span>
            </Field>
            <Field label="Meta Description" style={lbl}>
              <textarea value={form.metaDescription} onChange={e => set('metaDescription', e.target.value)}
                rows={2} placeholder="A short description for search engines…"
                className="resize-none" style={{ ...inp, padding: '10px 14px' }}
                onFocus={e => (e.target.style.borderColor = t.inputFocus)}
                onBlur={e => (e.target.style.borderColor = t.inputBorder)} />
              <span className="text-[11px] mt-1" style={{ color: form.metaDescription.length > 160 ? '#ef4444' : t.textSub }}>
                {form.metaDescription.length}/160 chars
              </span>
            </Field>
          </div>
        </Section>

        {/* ── Footer ────────────────────────────────── */}
        <Section icon={Copyright} label="Footer" t={t} dark={dark}>
          <div className="flex flex-col gap-4">
            <Field label="Copyright Text" style={lbl}>
              <input value={form.footerCopyright} onChange={e => set('footerCopyright', e.target.value)}
                placeholder="© 2025 MeiGen Gallery. All rights reserved." style={inp}
                onFocus={e => (e.target.style.borderColor = t.inputFocus)}
                onBlur={e => (e.target.style.borderColor = t.inputBorder)} />
            </Field>

            <div>
              <span style={lbl}>Footer Links</span>
              <div className="flex flex-col gap-2 mb-2">
                {form.footerLinks.map((link, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={link.label} onChange={e => setFooterLink(i, 'label', e.target.value)}
                      placeholder="Label" style={{ ...inp, width: '35%' }}
                      onFocus={e => (e.target.style.borderColor = t.inputFocus)}
                      onBlur={e => (e.target.style.borderColor = t.inputBorder)} />
                    <input value={link.href} onChange={e => setFooterLink(i, 'href', e.target.value)}
                      placeholder="URL or #anchor" style={{ ...inp, flex: 1 }}
                      onFocus={e => (e.target.style.borderColor = t.inputFocus)}
                      onBlur={e => (e.target.style.borderColor = t.inputBorder)} />
                    <button type="button" onClick={() => removeFooterLink(i)}
                      className="px-2.5 py-2 rounded-[8px] text-[12px] cursor-pointer shrink-0 transition-all"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addFooterLink}
                className="text-[12px] font-medium px-3 py-2 rounded-[8px] cursor-pointer transition-all"
                style={{ background: t.accentMuted, color: t.accentText, border: `1px solid ${t.accentBorder}` }}>
                + Add Link
              </button>
            </div>
          </div>
        </Section>

        {/* ── Social Links ──────────────────────────── */}
        <Section icon={Share2} label="Social Links" t={t} dark={dark}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['twitter', 'github', 'instagram'] as const).map(key => (
              <Field key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} style={lbl}>
                <input value={form.socialLinks[key]} onChange={e => setSocial(key, e.target.value)}
                  placeholder={`https://${key}.com/…`} style={inp}
                  onFocus={e => (e.target.style.borderColor = t.inputFocus)}
                  onBlur={e => (e.target.style.borderColor = t.inputBorder)} />
              </Field>
            ))}
          </div>
        </Section>

        {/* ── Announcement Bar ──────────────────────── */}
        <Section icon={Bell} label="Announcement Bar" t={t} dark={dark}>
          <Field label="Message (leave empty to hide)" style={lbl}>
            <input value={form.announcementBar} onChange={e => set('announcementBar', e.target.value)}
              placeholder="🎉 New: 2000+ AI prompts now available!" style={inp}
              onFocus={e => (e.target.style.borderColor = t.inputFocus)}
              onBlur={e => (e.target.style.borderColor = t.inputBorder)} />
          </Field>
        </Section>

        {/* ── Promo Pop-up Card ─────────────────────── */}
        <Section icon={Megaphone} label="Promo Pop-up Card" t={t} dark={dark}>
          <div className="flex flex-col gap-5">

            {/* Enable toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: dark ? 'rgba(255,255,255,0.04)' : '#f9fafb', border: `1px solid ${t.cardBorder}` }}>
              <div>
                <p className="text-[13px] font-semibold" style={{ color: t.text }}>Show promo card</p>
                <p className="text-[11px] mt-0.5" style={{ color: t.textSub }}>Displays a dismissable popup in the bottom-right of the gallery</p>
              </div>
              <button type="button" onClick={() => set('promoEnabled', !form.promoEnabled)}
                className="relative w-11 h-6 rounded-full transition-all cursor-pointer shrink-0"
                style={{ background: form.promoEnabled ? '#7c3aed' : (dark ? 'rgba(255,255,255,0.12)' : '#d1d5db') }}>
                <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                  style={{ transform: form.promoEnabled ? 'translateX(20px)' : 'translateX(0)' }} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

              {/* Live mini-preview */}
              <div>
                <span style={lbl}>Live Preview</span>
                <div className="w-[220px] rounded-[14px] overflow-hidden shadow-xl"
                  style={{ background: '#0f0f11', opacity: form.promoEnabled ? 1 : 0.4 }}>
                  {/* gradient strip */}
                  <div className="w-full h-[72px] relative"
                    style={{ background: `linear-gradient(135deg, ${form.promoGradientFrom}, ${form.promoGradientTo})` }}>
                    <div className="absolute inset-0 flex items-center justify-center gap-2">
                      <span className="text-3xl drop-shadow-lg">{form.promoEmoji1 || '⚽'}</span>
                      <span className="text-3xl drop-shadow-lg">{form.promoEmoji2 || '🏆'}</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f11]/40 to-transparent" />
                  </div>
                  <div className="p-3">
                    <p className="text-[11px] font-semibold text-white leading-tight mb-0.5">{form.promoTitle || 'Promo Title'}</p>
                    <p className="text-[9px] text-white/55 leading-snug mb-2">{form.promoDescription || 'Description goes here'}</p>
                    <div className="w-full bg-white text-[#0f0f11] text-[10px] font-semibold py-1.5 rounded-[6px] text-center">
                      {form.promoCtaText || 'Explore now'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div className="flex flex-col gap-4">
                {/* Emojis + gradient */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Emoji 1" style={lbl}>
                    <input value={form.promoEmoji1} onChange={e => set('promoEmoji1', e.target.value)}
                      placeholder="⚽" style={{ ...inp, fontSize: '20px', textAlign: 'center', padding: '8px 10px' }}
                      onFocus={e => (e.target.style.borderColor = t.inputFocus)}
                      onBlur={e => (e.target.style.borderColor = t.inputBorder)} />
                  </Field>
                  <Field label="Emoji 2" style={lbl}>
                    <input value={form.promoEmoji2} onChange={e => set('promoEmoji2', e.target.value)}
                      placeholder="🏆" style={{ ...inp, fontSize: '20px', textAlign: 'center', padding: '8px 10px' }}
                      onFocus={e => (e.target.style.borderColor = t.inputFocus)}
                      onBlur={e => (e.target.style.borderColor = t.inputBorder)} />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Gradient Start" style={lbl}>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-[10px]"
                      style={{ background: t.input, border: `1px solid ${t.inputBorder}` }}>
                      <input type="color" value={form.promoGradientFrom} onChange={e => set('promoGradientFrom', e.target.value)}
                        className="w-7 h-7 rounded-md cursor-pointer border-0 bg-transparent" />
                      <span className="text-[11px] font-mono" style={{ color: t.text }}>{form.promoGradientFrom}</span>
                    </div>
                  </Field>
                  <Field label="Gradient End" style={lbl}>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-[10px]"
                      style={{ background: t.input, border: `1px solid ${t.inputBorder}` }}>
                      <input type="color" value={form.promoGradientTo} onChange={e => set('promoGradientTo', e.target.value)}
                        className="w-7 h-7 rounded-md cursor-pointer border-0 bg-transparent" />
                      <span className="text-[11px] font-mono" style={{ color: t.text }}>{form.promoGradientTo}</span>
                    </div>
                  </Field>
                </div>

                <Field label="Title" style={lbl}>
                  <input value={form.promoTitle} onChange={e => set('promoTitle', e.target.value)}
                    placeholder="FIFA World Cup 2026 ⚽" style={inp}
                    onFocus={e => (e.target.style.borderColor = t.inputFocus)}
                    onBlur={e => (e.target.style.borderColor = t.inputBorder)} />
                </Field>

                <Field label="Description" style={lbl}>
                  <textarea value={form.promoDescription} onChange={e => set('promoDescription', e.target.value)}
                    rows={2} placeholder="Short description…"
                    className="resize-none" style={{ ...inp, padding: '10px 14px' }}
                    onFocus={e => (e.target.style.borderColor = t.inputFocus)}
                    onBlur={e => (e.target.style.borderColor = t.inputBorder)} />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Button Text" style={lbl}>
                    <input value={form.promoCtaText} onChange={e => set('promoCtaText', e.target.value)}
                      placeholder="Explore now" style={inp}
                      onFocus={e => (e.target.style.borderColor = t.inputFocus)}
                      onBlur={e => (e.target.style.borderColor = t.inputBorder)} />
                  </Field>
                  <Field label="Button URL" style={lbl}>
                    <input value={form.promoCtaUrl} onChange={e => set('promoCtaUrl', e.target.value)}
                      placeholder="https://… or #" style={inp}
                      onFocus={e => (e.target.style.borderColor = t.inputFocus)}
                      onBlur={e => (e.target.style.borderColor = t.inputBorder)} />
                  </Field>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 rounded-xl text-[13px]"
            style={{ background: t.danger, border: `1px solid ${t.dangerBorder}`, color: t.dangerText }}>
            {error}
          </div>
        )}

        {/* Save */}
        <div className="flex items-center gap-3 pb-8">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-semibold text-white transition-all cursor-pointer disabled:opacity-60"
            style={{
              background: saved ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
              boxShadow: saved ? '0 4px 20px rgba(16,185,129,0.35)' : '0 4px 20px rgba(124,58,237,0.35)',
            }}>
            {saved   ? <><Check size={14} />Saved!</>
             : saving ? <><Loader2 size={14} className="animate-spin" />Saving…</>
             : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ icon: Icon, label, children, t, dark }: { icon: any; label: string; children: React.ReactNode; t: any; dark: boolean }) {
  return (
    <div className="p-6 rounded-2xl" style={{ background: dark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: `1px solid ${t.cardBorder}` }}>
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>
          <Icon size={13} style={{ color: '#7c3aed' }} />
        </div>
        <span className="text-[14px] font-semibold" style={{ color: t.text }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children, style, className = '' }: { label: string; children: React.ReactNode; style: any; className?: string }) {
  return (
    <label className={`flex flex-col ${className}`}>
      <span style={style}>{label}</span>
      {children}
    </label>
  );
}
