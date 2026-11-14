'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Save,
  Upload,
  Check,
  Lock,
  Sparkles,
  Globe,
  ShieldCheck,
  Search,
  Megaphone,
  LayoutDashboard,
  KeyRound,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  RotateCcw,
  ImageIcon,
  Share2,
  AlertCircle,
} from 'lucide-react';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminErrorState,
  AdminFormField,
  AdminInput,
  AdminPageHeader,
  AdminSectionHeader,
  AdminSwitch,
  AdminTextarea,
} from '@/components/admin/ui/Primitives';
import { ConfirmDialog } from '@/components/admin/ui/Dialog';
import { useToast } from '@/components/admin/ui/ToastProvider';

interface FooterLink {
  label: string;
  href: string;
}

interface SocialLinks {
  twitter: string;
  github: string;
  instagram: string;
}

interface Settings {
  siteName: string;
  siteTagline: string;
  siteDescription: string;
  logoText: string;
  logoImageUrl: string;
  faviconUrl: string;
  primaryColor: string;
  metaTitle: string;
  metaDescription: string;
  footerCopyright: string;
  footerLinks: FooterLink[];
  socialLinks: SocialLinks;
  announcementBar: string;
  adminName: string;
  adminTagline: string;
  loginBrandName: string;
  loginTagline: string;
  promoEnabled: boolean;
  promoTitle: string;
  promoDescription: string;
  promoEmoji1: string;
  promoEmoji2: string;
  promoGradientFrom: string;
  promoGradientTo: string;
  promoCtaText: string;
  promoCtaUrl: string;
  updatedAt: string;
}

type SettingsTab = 'general' | 'branding' | 'seo' | 'promo' | 'security';

const TABS: {
  id: SettingsTab;
  label: string;
  icon: typeof Globe;
}[] = [
  { id: 'general', label: 'General', icon: Globe },
  { id: 'branding', label: 'Branding & Logos', icon: ShieldCheck },
  { id: 'seo', label: 'SEO & Footer', icon: Search },
  { id: 'promo', label: 'Promo Card', icon: Sparkles },
  { id: 'security', label: 'Security', icon: Lock },
];

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function normalizeHexColor(val: string, fallback: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(val.trim()) ? val.trim() : fallback;
}

function normalizeSettings(raw: Settings): Settings {
  return {
    ...raw,
    footerLinks: Array.isArray(raw.footerLinks) ? raw.footerLinks : [],
    socialLinks: {
      twitter: raw.socialLinks?.twitter ?? '',
      github: raw.socialLinks?.github ?? '',
      instagram: raw.socialLinks?.instagram ?? '',
    },
  };
}

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: 'Enter a password', color: 'var(--adm-border-strong)' };
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw) && /[^a-zA-Z0-9]/.test(pw)) score += 1;

  if (score <= 1) return { score: 1, label: 'Weak', color: '#dc2626' };
  if (score === 2) return { score: 2, label: 'Fair', color: '#d97706' };
  if (score === 3) return { score: 3, label: 'Good', color: '#2563eb' };
  return { score: 4, label: 'Strong', color: '#16a34a' };
}

export default function SettingsPage() {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [initialSettings, setInitialSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // Security password form state
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurPw, setShowCurPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/admin/settings', { cache: 'no-store', signal: controller.signal })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok || !data || data.error) {
          throw new Error(data?.error || `Failed to load settings (HTTP ${res.status})`);
        }
        return normalizeSettings(data as Settings);
      })
      .then((normalized) => {
        setSettings(normalized);
        setInitialSettings(normalized);
        setLoadError(null);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          setLoadError(
            err instanceof Error ? err.message : 'Network error while loading site settings.'
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [reloadTick]);

  const isDirty = useMemo(() => {
    if (!settings || !initialSettings) return false;
    return JSON.stringify(settings) !== JSON.stringify(initialSettings);
  }, [settings, initialSettings]);

  useEffect(() => {
    if (!isDirty) return;
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const setField = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaveError(null);
  }, []);

  const setSocialField = useCallback((key: keyof SocialLinks, value: string) => {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            socialLinks: {
              ...prev.socialLinks,
              [key]: value,
            },
          }
        : prev
    );
    setSaveError(null);
  }, []);

  function addFooterLink() {
    if (!settings) return;
    setField('footerLinks', [...settings.footerLinks, { label: '', href: '/' }]);
  }

  function updateFooterLink(idx: number, key: keyof FooterLink, val: string) {
    if (!settings) return;
    const next = settings.footerLinks.map((link, i) =>
      i === idx ? { ...link, [key]: val } : link
    );
    setField('footerLinks', next);
  }

  function removeFooterLink(idx: number) {
    if (!settings) return;
    setField(
      'footerLinks',
      settings.footerLinks.filter((_, i) => i !== idx)
    );
  }

  function handleRetryLoad() {
    setLoading(true);
    setLoadError(null);
    setReloadTick((t) => t + 1);
  }

  async function uploadImage(
    file: File,
    field: 'logoImageUrl' | 'faviconUrl',
    setUploading: (val: boolean) => void
  ) {
    if (file.size > MAX_UPLOAD_BYTES) {
      toast({
        variant: 'error',
        title: 'File too large',
        description: 'Maximum upload size is 10 MB.',
      });
      return;
    }

    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.localImg) {
        toast({
          variant: 'error',
          title: 'Upload failed',
          description: data?.error || 'Could not upload image. Please check format and size.',
        });
        return;
      }
      setField(field, data.localImg as string);
      toast({
        variant: 'success',
        title: field === 'logoImageUrl' ? 'Logo uploaded' : 'Favicon uploaded',
        description: 'Remember to save settings to publish the updated image.',
      });
    } catch {
      toast({
        variant: 'error',
        title: 'Upload failed',
        description: 'Network error during file upload.',
      });
    } finally {
      setUploading(false);
    }
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!settings || saving) return;

    setSaving(true);
    setSaveError(null);

    try {
      const cleanedLinks = settings.footerLinks.filter(
        (item) => item.label.trim() !== '' || item.href.trim() !== ''
      );
      const payload = { ...settings, footerLinks: cleanedLinks };

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data || data.error) {
        const msg = data?.error || `Failed to save settings (HTTP ${res.status})`;
        setSaveError(msg);
        toast({
          variant: 'error',
          title: 'Could not save settings',
          description: msg,
        });
        return;
      }

      const normalized = normalizeSettings(data as Settings);
      setSettings(normalized);
      setInitialSettings(normalized);
      window.dispatchEvent(new Event('admin-settings-updated'));
      toast({
        variant: 'success',
        title: 'Settings saved',
        description: 'Site configuration and public cache updated.',
      });
    } catch {
      const msg = 'Network error while saving settings.';
      setSaveError(msg);
      toast({
        variant: 'error',
        title: 'Save failed',
        description: msg,
      });
    } finally {
      setSaving(false);
    }
  }

  function handleConfirmDiscard() {
    if (initialSettings) {
      setSettings(normalizeSettings(initialSettings));
      setSaveError(null);
      toast({
        variant: 'info',
        title: 'Changes discarded',
        description: 'Reverted to last saved settings.',
      });
    }
    setDiscardOpen(false);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwLoading) return;

    if (!curPw) {
      setPwError('Enter your current password.');
      return;
    }
    if (newPw.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('New password and confirmation do not match.');
      return;
    }

    setPwLoading(true);
    setPwError(null);

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: curPw, newPassword: newPw }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || data?.error) {
        const msg = data?.error || 'Could not update password.';
        setPwError(msg);
        toast({ variant: 'error', title: 'Password update failed', description: msg });
        return;
      }

      setCurPw('');
      setNewPw('');
      setConfirmPw('');
      toast({
        variant: 'success',
        title: 'Password updated',
        description: 'Your admin password has been changed.',
      });
    } catch {
      setPwError('Network error while updating password.');
    } finally {
      setPwLoading(false);
    }
  }

  const pwStrength = useMemo(() => getPasswordStrength(newPw), [newPw]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <AdminPageHeader
          title="Settings"
          description="Manage global identity, branding, SEO, promotions, and security."
          breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Settings' }]}
        />
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="admin-skeleton h-9 w-28 rounded-xl shrink-0" />
          ))}
        </div>
        <div className="admin-skeleton h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (loadError || !settings) {
    return (
      <div className="max-w-5xl mx-auto">
        <AdminPageHeader
          title="Settings"
          description="Manage global identity, branding, SEO, promotions, and security."
          breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Settings' }]}
        />
        <AdminErrorState
          message={loadError || 'Unable to load settings.'}
          onRetry={handleRetryLoad}
        />
      </div>
    );
  }

  const updatedLabel = settings.updatedAt
    ? new Date(settings.updatedAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  return (
    <div className="max-w-5xl mx-auto pb-16">
      <AdminPageHeader
        title="Settings"
        description="Configure your public gallery, sidebar branding, SEO defaults, promo card, and password."
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Settings' }]}
        badge={
          isDirty ? (
            <AdminBadge variant="warning">Unsaved changes</AdminBadge>
          ) : updatedLabel ? (
            <AdminBadge variant="neutral">Saved {updatedLabel}</AdminBadge>
          ) : undefined
        }
        actions={
          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[10px] text-[13px] font-medium transition-colors"
              style={{
                backgroundColor: 'var(--adm-surface)',
                border: '1px solid var(--adm-border)',
                color: 'var(--adm-text-secondary)',
              }}
            >
              <ExternalLink size={13} />
              View Site
            </a>
            {activeTab !== 'security' && (
              <>
                {isDirty && (
                  <AdminButton
                    variant="outline"
                    size="md"
                    onClick={() => setDiscardOpen(true)}
                    icon={<RotateCcw size={13} />}
                  >
                    Discard
                  </AdminButton>
                )}
                <AdminButton
                  type="submit"
                  form="site-settings-form"
                  variant="primary"
                  size="md"
                  loading={saving}
                  disabled={!isDirty && !saving}
                  icon={<Save size={14} />}
                >
                  Save Settings
                </AdminButton>
              </>
            )}
          </div>
        }
      />

      {/* Tab Bar */}
      <div
        role="tablist"
        aria-label="Settings sections"
        className="flex items-center gap-1.5 p-1.5 rounded-2xl mb-6 overflow-x-auto"
        style={{
          backgroundColor: 'var(--adm-surface)',
          border: '1px solid var(--adm-border)',
        }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={active}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0"
              style={{
                backgroundColor: active ? 'var(--adm-accent-soft)' : 'transparent',
                color: active ? 'var(--adm-accent-text)' : 'var(--adm-text-muted)',
                border: active
                  ? '1px solid var(--adm-accent-border)'
                  : '1px solid transparent',
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Inline save error banner */}
      {saveError && activeTab !== 'security' && (
        <div
          role="alert"
          className="mb-5 p-4 rounded-xl flex items-start gap-2.5 text-[13px]"
          style={{
            backgroundColor: 'var(--adm-danger-bg)',
            border: '1px solid var(--adm-danger-border)',
            color: 'var(--adm-danger-text)',
          }}
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to save settings</p>
            <p className="text-[12.5px] opacity-90 mt-0.5">{saveError}</p>
          </div>
        </div>
      )}

      {/* Site Settings Form (Tabs 1–4) */}
      <form
        id="site-settings-form"
        onSubmit={saveSettings}
        className={activeTab === 'security' ? 'hidden' : 'space-y-5'}
      >
        {/* TAB 1: GENERAL */}
        {activeTab === 'general' && (
          <div
            role="tabpanel"
            id="panel-general"
            aria-labelledby="tab-general"
            className="space-y-5"
          >
            <AdminCard padding="lg">
              <AdminSectionHeader
                icon={Globe}
                title="Site Identity"
                description="Core branding displayed across the public gallery header and navigation."
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AdminFormField label="Site Name" htmlFor="set-siteName" required>
                  <AdminInput
                    id="set-siteName"
                    value={settings.siteName}
                    onChange={(e) => setField('siteName', e.target.value)}
                    placeholder="Meigen"
                  />
                </AdminFormField>

                <AdminFormField label="Logo Text (Fallback)" htmlFor="set-logoText">
                  <AdminInput
                    id="set-logoText"
                    value={settings.logoText}
                    onChange={(e) => setField('logoText', e.target.value)}
                    placeholder="Meigen"
                  />
                </AdminFormField>

                <AdminFormField label="Site Tagline" htmlFor="set-siteTagline">
                  <AdminInput
                    id="set-siteTagline"
                    value={settings.siteTagline}
                    onChange={(e) => setField('siteTagline', e.target.value)}
                    placeholder="AI Prompt Library"
                  />
                </AdminFormField>

                <AdminFormField
                  label="Accent Color"
                  htmlFor="set-primaryColor-hex"
                  hint="Applied to primary public UI accents."
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      aria-label="Pick primary accent color"
                      value={normalizeHexColor(settings.primaryColor, '#7c3aed')}
                      onChange={(e) => setField('primaryColor', e.target.value)}
                      className="w-11 h-10 rounded-xl cursor-pointer shrink-0 p-1"
                      style={{
                        backgroundColor: 'var(--adm-input-bg)',
                        border: '1px solid var(--adm-input-border)',
                      }}
                    />
                    <AdminInput
                      id="set-primaryColor-hex"
                      value={settings.primaryColor}
                      onChange={(e) => setField('primaryColor', e.target.value)}
                      placeholder="#7c3aed"
                      className="font-mono text-[13px]"
                    />
                  </div>
                </AdminFormField>

                <AdminFormField
                  label="Site Description"
                  htmlFor="set-siteDescription"
                  className="md:col-span-2"
                >
                  <AdminTextarea
                    id="set-siteDescription"
                    rows={2}
                    value={settings.siteDescription}
                    onChange={(e) => setField('siteDescription', e.target.value)}
                    placeholder="Browse curated AI prompts, styles, and generation recipes..."
                  />
                </AdminFormField>
              </div>
            </AdminCard>

            <AdminCard padding="lg">
              <AdminSectionHeader
                icon={Megaphone}
                title="Announcement Bar"
                description="Optional banner shown across the top of your public site. Leave blank to hide."
              />
              <AdminFormField label="Banner Message" htmlFor="set-announcementBar">
                <AdminInput
                  id="set-announcementBar"
                  value={settings.announcementBar}
                  onChange={(e) => setField('announcementBar', e.target.value)}
                  placeholder="e.g. 500+ new GPT-4o and Midjourney v7 prompts just added!"
                />
              </AdminFormField>
              {settings.announcementBar.trim() && (
                <div
                  className="mt-4 px-4 py-2 rounded-xl text-center text-[12px] font-medium text-white"
                  style={{
                    backgroundColor: normalizeHexColor(settings.primaryColor, '#7c3aed'),
                  }}
                >
                  Preview: {settings.announcementBar}
                </div>
              )}
            </AdminCard>
          </div>
        )}

        {/* TAB 2: BRANDING & LOGOS */}
        {activeTab === 'branding' && (
          <div
            role="tabpanel"
            id="panel-branding"
            aria-labelledby="tab-branding"
            className="space-y-5"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Admin Sidebar Branding */}
              <AdminCard padding="lg">
                <AdminSectionHeader
                  icon={LayoutDashboard}
                  title="Admin Panel Branding"
                  description="Displayed in the top-left of the admin sidebar."
                />
                <div className="space-y-4">
                  <AdminFormField label="Admin Panel Title" htmlFor="set-adminName">
                    <AdminInput
                      id="set-adminName"
                      value={settings.adminName}
                      onChange={(e) => setField('adminName', e.target.value)}
                      placeholder="Meigen"
                    />
                  </AdminFormField>
                  <AdminFormField label="Admin Subtitle" htmlFor="set-adminTagline">
                    <AdminInput
                      id="set-adminTagline"
                      value={settings.adminTagline}
                      onChange={(e) => setField('adminTagline', e.target.value)}
                      placeholder="Admin Studio"
                    />
                  </AdminFormField>
                  <div
                    className="p-3.5 rounded-xl flex items-center gap-3"
                    style={{
                      backgroundColor: 'var(--adm-surface-muted)',
                      border: '1px solid var(--adm-border)',
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[13px] font-bold shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                      }}
                    >
                      {(settings.adminName || 'M').slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold truncate" style={{ color: 'var(--adm-text)' }}>
                        {settings.adminName || 'Meigen'}
                      </p>
                      <p
                        className="text-[10px] font-semibold uppercase tracking-widest truncate"
                        style={{ color: 'var(--adm-accent-text)' }}
                      >
                        {settings.adminTagline || 'Admin Studio'}
                      </p>
                    </div>
                  </div>
                </div>
              </AdminCard>

              {/* Login Page Branding */}
              <AdminCard padding="lg">
                <AdminSectionHeader
                  icon={KeyRound}
                  title="Login Page Branding"
                  description="Shown on the /login sign-in screen."
                />
                <div className="space-y-4">
                  <AdminFormField label="Login Brand Name" htmlFor="set-loginBrandName">
                    <AdminInput
                      id="set-loginBrandName"
                      value={settings.loginBrandName}
                      onChange={(e) => setField('loginBrandName', e.target.value)}
                      placeholder="PromptVault"
                    />
                  </AdminFormField>
                  <AdminFormField label="Login Subtitle" htmlFor="set-loginTagline">
                    <AdminInput
                      id="set-loginTagline"
                      value={settings.loginTagline}
                      onChange={(e) => setField('loginTagline', e.target.value)}
                      placeholder="Editorial prompt governance & sync"
                    />
                  </AdminFormField>
                  <div
                    className="p-3.5 rounded-xl"
                    style={{
                      backgroundColor: 'var(--adm-surface-muted)',
                      border: '1px solid var(--adm-border)',
                    }}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--adm-text-subtle)' }}>
                      Sign-In Preview
                    </p>
                    <p className="text-[14px] font-bold" style={{ color: 'var(--adm-text)' }}>
                      {settings.loginBrandName || settings.siteName || 'PromptVault'}
                    </p>
                    <p className="text-[12px] mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
                      {settings.loginTagline || 'Admin sign in'}
                    </p>
                  </div>
                </div>
              </AdminCard>
            </div>

            {/* Logos & Icons */}
            <AdminCard padding="lg">
              <AdminSectionHeader
                icon={ImageIcon}
                title="Logo & Favicon Assets"
                description="Upload transparent PNG, SVG, WebP, or ICO assets, or paste a hosted https:// or / path."
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo */}
                <div className="space-y-3">
                  <AdminFormField label="Site Logo Image" htmlFor="set-logoImageUrl">
                    <div className="flex items-start gap-3.5">
                      <div
                        className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                        style={{
                          backgroundColor: 'var(--adm-surface-muted)',
                          border: '1px solid var(--adm-border)',
                        }}
                      >
                        {settings.logoImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={settings.logoImageUrl}
                            alt="Logo preview"
                            className="w-full h-full object-contain p-1.5"
                          />
                        ) : (
                          <span className="text-[12px] font-bold" style={{ color: 'var(--adm-text-subtle)' }}>
                            {settings.logoText || 'Logo'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.target.value = '';
                              if (file) void uploadImage(file, 'logoImageUrl', setUploadingLogo);
                            }}
                          />
                          <AdminButton
                            variant="secondary"
                            size="sm"
                            loading={uploadingLogo}
                            onClick={() => logoInputRef.current?.click()}
                            icon={<Upload size={13} />}
                          >
                            Upload Logo
                          </AdminButton>
                          {settings.logoImageUrl && (
                            <AdminButton
                              variant="ghost"
                              size="sm"
                              onClick={() => setField('logoImageUrl', '')}
                              icon={<Trash2 size={13} />}
                            >
                              Remove
                            </AdminButton>
                          )}
                        </div>
                        <AdminInput
                          id="set-logoImageUrl"
                          value={settings.logoImageUrl}
                          onChange={(e) => setField('logoImageUrl', e.target.value)}
                          placeholder="https://... or /uploads/logo.png"
                          className="text-[12.5px]"
                        />
                      </div>
                    </div>
                  </AdminFormField>
                </div>

                {/* Favicon */}
                <div className="space-y-3">
                  <AdminFormField label="Browser Favicon" htmlFor="set-faviconUrl">
                    <div className="flex items-start gap-3.5">
                      <div
                        className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                        style={{
                          backgroundColor: 'var(--adm-surface-muted)',
                          border: '1px solid var(--adm-border)',
                        }}
                      >
                        {settings.faviconUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={settings.faviconUrl}
                            alt="Favicon preview"
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          <Globe size={20} style={{ color: 'var(--adm-text-subtle)' }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            ref={faviconInputRef}
                            type="file"
                            accept="image/*,.ico"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.target.value = '';
                              if (file) void uploadImage(file, 'faviconUrl', setUploadingFavicon);
                            }}
                          />
                          <AdminButton
                            variant="secondary"
                            size="sm"
                            loading={uploadingFavicon}
                            onClick={() => faviconInputRef.current?.click()}
                            icon={<Upload size={13} />}
                          >
                            Upload Favicon
                          </AdminButton>
                          {settings.faviconUrl && (
                            <AdminButton
                              variant="ghost"
                              size="sm"
                              onClick={() => setField('faviconUrl', '')}
                              icon={<Trash2 size={13} />}
                            >
                              Remove
                            </AdminButton>
                          )}
                        </div>
                        <AdminInput
                          id="set-faviconUrl"
                          value={settings.faviconUrl}
                          onChange={(e) => setField('faviconUrl', e.target.value)}
                          placeholder="https://... or /favicon.ico"
                          className="text-[12.5px]"
                        />
                      </div>
                    </div>
                  </AdminFormField>
                </div>
              </div>
            </AdminCard>
          </div>
        )}

        {/* TAB 3: SEO & FOOTER */}
        {activeTab === 'seo' && (
          <div
            role="tabpanel"
            id="panel-seo"
            aria-labelledby="tab-seo"
            className="space-y-5"
          >
            <AdminCard padding="lg">
              <AdminSectionHeader
                icon={Search}
                title="SEO & Open Graph Metadata"
                description="Controls the document title and description indexed by search engines and social shares."
              />
              <div className="space-y-4">
                <AdminFormField
                  label="Meta Title"
                  htmlFor="set-metaTitle"
                  rightLabel={
                    <span
                      className="text-[11px] font-mono tabular-nums"
                      style={{
                        color:
                          settings.metaTitle.length > 60
                            ? 'var(--adm-warning-text)'
                            : 'var(--adm-text-subtle)',
                      }}
                    >
                      {settings.metaTitle.length}/60
                    </span>
                  }
                >
                  <AdminInput
                    id="set-metaTitle"
                    value={settings.metaTitle}
                    onChange={(e) => setField('metaTitle', e.target.value)}
                    placeholder="Meigen AI Prompt Gallery"
                  />
                </AdminFormField>

                <AdminFormField
                  label="Meta Description"
                  htmlFor="set-metaDescription"
                  rightLabel={
                    <span
                      className="text-[11px] font-mono tabular-nums"
                      style={{
                        color:
                          settings.metaDescription.length > 160
                            ? 'var(--adm-warning-text)'
                            : 'var(--adm-text-subtle)',
                      }}
                    >
                      {settings.metaDescription.length}/160
                    </span>
                  }
                >
                  <AdminTextarea
                    id="set-metaDescription"
                    rows={3}
                    value={settings.metaDescription}
                    onChange={(e) => setField('metaDescription', e.target.value)}
                    placeholder="Explore curated prompts for Midjourney, GPT-4o, Gemini, and Flux."
                  />
                </AdminFormField>

                {/* Google SERP Preview */}
                <div
                  className="p-4 rounded-xl"
                  style={{
                    backgroundColor: 'var(--adm-surface-muted)',
                    border: '1px solid var(--adm-border)',
                  }}
                >
                  <p
                    className="text-[10.5px] font-semibold uppercase tracking-wider mb-2"
                    style={{ color: 'var(--adm-text-subtle)' }}
                  >
                    Search Engine Preview
                  </p>
                  <p className="text-[16px] font-medium text-[#60a5fa] truncate">
                    {settings.metaTitle || settings.siteName || 'Prompt Library'}
                  </p>
                  <p className="text-[12px] text-[#34d399] truncate mt-0.5">
                    https://yoursite.com/
                  </p>
                  <p
                    className="text-[12.5px] mt-1 line-clamp-2 leading-relaxed"
                    style={{ color: 'var(--adm-text-muted)' }}
                  >
                    {settings.metaDescription ||
                      settings.siteDescription ||
                      'Add a meta description to improve search snippets.'}
                  </p>
                </div>
              </div>
            </AdminCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Footer & Legal */}
              <AdminCard padding="lg">
                <AdminSectionHeader
                  icon={Globe}
                  title="Footer & Navigation Links"
                  description="Legal copyright line and sidebar/footer links."
                  action={
                    <AdminButton
                      variant="secondary"
                      size="sm"
                      onClick={addFooterLink}
                      icon={<Plus size={13} />}
                    >
                      Add Link
                    </AdminButton>
                  }
                />
                <div className="space-y-4">
                  <AdminFormField label="Copyright Text" htmlFor="set-footerCopyright">
                    <AdminInput
                      id="set-footerCopyright"
                      value={settings.footerCopyright}
                      onChange={(e) => setField('footerCopyright', e.target.value)}
                      placeholder="© 2026 Meigen. All rights reserved."
                    />
                  </AdminFormField>

                  <div className="space-y-2">
                    <span
                      className="text-[11.5px] font-semibold uppercase tracking-wider block"
                      style={{ color: 'var(--adm-text-muted)' }}
                    >
                      Footer Links
                    </span>
                    {settings.footerLinks.length === 0 ? (
                      <p
                        className="text-[12px] py-3 px-3 rounded-xl"
                        style={{
                          backgroundColor: 'var(--adm-surface-muted)',
                          color: 'var(--adm-text-subtle)',
                        }}
                      >
                        No footer links configured. Click &ldquo;Add Link&rdquo; to include links.
                      </p>
                    ) : (
                      settings.footerLinks.map((link, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <AdminInput
                            aria-label={`Footer link ${idx + 1} label`}
                            value={link.label}
                            onChange={(e) => updateFooterLink(idx, 'label', e.target.value)}
                            placeholder="Label (e.g. Privacy)"
                            className="flex-1 text-[13px]"
                          />
                          <AdminInput
                            aria-label={`Footer link ${idx + 1} URL`}
                            value={link.href}
                            onChange={(e) => updateFooterLink(idx, 'href', e.target.value)}
                            placeholder="/privacy or https://..."
                            className="flex-1 text-[13px]"
                          />
                          <button
                            type="button"
                            aria-label={`Remove footer link ${idx + 1}`}
                            onClick={() => removeFooterLink(idx)}
                            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0"
                            style={{
                              backgroundColor: 'var(--adm-danger-bg)',
                              color: 'var(--adm-danger-text)',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                    <p className="text-[11px]" style={{ color: 'var(--adm-text-subtle)' }}>
                      Links must begin with <code>/</code>, <code>http://</code>, or{' '}
                      <code>https://</code>.
                    </p>
                  </div>
                </div>
              </AdminCard>

              {/* Social Links */}
              <AdminCard padding="lg">
                <AdminSectionHeader
                  icon={Share2}
                  title="Social Profiles"
                  description="Optional social URLs displayed in the footer."
                />
                <div className="space-y-4">
                  <AdminFormField label="X / Twitter URL" htmlFor="set-social-twitter">
                    <AdminInput
                      id="set-social-twitter"
                      value={settings.socialLinks.twitter}
                      onChange={(e) => setSocialField('twitter', e.target.value)}
                      placeholder="https://x.com/yourhandle"
                    />
                  </AdminFormField>
                  <AdminFormField label="GitHub URL" htmlFor="set-social-github">
                    <AdminInput
                      id="set-social-github"
                      value={settings.socialLinks.github}
                      onChange={(e) => setSocialField('github', e.target.value)}
                      placeholder="https://github.com/yourorg"
                    />
                  </AdminFormField>
                  <AdminFormField label="Instagram URL" htmlFor="set-social-instagram">
                    <AdminInput
                      id="set-social-instagram"
                      value={settings.socialLinks.instagram}
                      onChange={(e) => setSocialField('instagram', e.target.value)}
                      placeholder="https://instagram.com/yourhandle"
                    />
                  </AdminFormField>
                </div>
              </AdminCard>
            </div>
          </div>
        )}

        {/* TAB 4: PROMO CARD */}
        {activeTab === 'promo' && (
          <div
            role="tabpanel"
            id="panel-promo"
            aria-labelledby="tab-promo"
            className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start"
          >
            <div className="lg:col-span-7">
              <AdminCard padding="lg">
                <AdminSectionHeader
                  icon={Sparkles}
                  title="Sidebar Promo Pop-up Card"
                  description="Configure the promotional card pinned to the gallery sidebar."
                />
                <div className="space-y-4">
                  <AdminSwitch
                    id="set-promoEnabled"
                    checked={settings.promoEnabled}
                    onChange={(next) => setField('promoEnabled', next)}
                    label="Show Promo Card in Public Sidebar"
                    description="Enable or pause the promotional banner without clearing your copy."
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <AdminFormField label="Primary Emoji" htmlFor="set-promoEmoji1">
                      <AdminInput
                        id="set-promoEmoji1"
                        value={settings.promoEmoji1}
                        onChange={(e) => setField('promoEmoji1', e.target.value)}
                        placeholder="⚽"
                      />
                    </AdminFormField>
                    <AdminFormField label="Secondary Emoji" htmlFor="set-promoEmoji2">
                      <AdminInput
                        id="set-promoEmoji2"
                        value={settings.promoEmoji2}
                        onChange={(e) => setField('promoEmoji2', e.target.value)}
                        placeholder="🏆"
                      />
                    </AdminFormField>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <AdminFormField label="Gradient Start" htmlFor="set-promoFrom">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          aria-label="Promo gradient start color"
                          value={normalizeHexColor(settings.promoGradientFrom, '#78350f')}
                          onChange={(e) => setField('promoGradientFrom', e.target.value)}
                          className="w-10 h-10 rounded-xl cursor-pointer shrink-0 p-1"
                          style={{
                            backgroundColor: 'var(--adm-input-bg)',
                            border: '1px solid var(--adm-input-border)',
                          }}
                        />
                        <AdminInput
                          id="set-promoFrom"
                          value={settings.promoGradientFrom}
                          onChange={(e) => setField('promoGradientFrom', e.target.value)}
                          className="font-mono text-[13px]"
                        />
                      </div>
                    </AdminFormField>

                    <AdminFormField label="Gradient End" htmlFor="set-promoTo">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          aria-label="Promo gradient end color"
                          value={normalizeHexColor(settings.promoGradientTo, '#7c3aed')}
                          onChange={(e) => setField('promoGradientTo', e.target.value)}
                          className="w-10 h-10 rounded-xl cursor-pointer shrink-0 p-1"
                          style={{
                            backgroundColor: 'var(--adm-input-bg)',
                            border: '1px solid var(--adm-input-border)',
                          }}
                        />
                        <AdminInput
                          id="set-promoTo"
                          value={settings.promoGradientTo}
                          onChange={(e) => setField('promoGradientTo', e.target.value)}
                          className="font-mono text-[13px]"
                        />
                      </div>
                    </AdminFormField>
                  </div>

                  <AdminFormField label="Promo Headline" htmlFor="set-promoTitle">
                    <AdminInput
                      id="set-promoTitle"
                      value={settings.promoTitle}
                      onChange={(e) => setField('promoTitle', e.target.value)}
                      placeholder="World Cup Prompts Pack"
                    />
                  </AdminFormField>

                  <AdminFormField label="Promo Description" htmlFor="set-promoDescription">
                    <AdminTextarea
                      id="set-promoDescription"
                      rows={2}
                      value={settings.promoDescription}
                      onChange={(e) => setField('promoDescription', e.target.value)}
                      placeholder="Get curated templates built for viral sports visuals."
                    />
                  </AdminFormField>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AdminFormField label="CTA Button Label" htmlFor="set-promoCtaText">
                      <AdminInput
                        id="set-promoCtaText"
                        value={settings.promoCtaText}
                        onChange={(e) => setField('promoCtaText', e.target.value)}
                        placeholder="Try Meigen →"
                      />
                    </AdminFormField>
                    <AdminFormField label="CTA Destination URL" htmlFor="set-promoCtaUrl">
                      <AdminInput
                        id="set-promoCtaUrl"
                        value={settings.promoCtaUrl}
                        onChange={(e) => setField('promoCtaUrl', e.target.value)}
                        placeholder="https://... or /"
                      />
                    </AdminFormField>
                  </div>
                </div>
              </AdminCard>
            </div>

            <div className="lg:col-span-5 lg:sticky lg:top-20">
              <AdminCard padding="lg">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--adm-text-muted)' }}>
                    Live Sidebar Card Preview
                  </p>
                  <AdminBadge variant={settings.promoEnabled ? 'success' : 'neutral'}>
                    {settings.promoEnabled ? 'Active' : 'Hidden'}
                  </AdminBadge>
                </div>
                <div
                  className="p-4 rounded-2xl text-white transition-opacity"
                  style={{
                    opacity: settings.promoEnabled ? 1 : 0.45,
                    background: `linear-gradient(135deg, ${normalizeHexColor(
                      settings.promoGradientFrom,
                      '#78350f'
                    )}, ${normalizeHexColor(settings.promoGradientTo, '#7c3aed')})`,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl leading-none">{settings.promoEmoji1 || '✨'}</span>
                      <span className="text-xl leading-none">{settings.promoEmoji2 || '🚀'}</span>
                    </div>
                  </div>
                  <p className="text-[14px] font-bold leading-snug">
                    {settings.promoTitle || 'Promo Headline'}
                  </p>
                  <p className="text-[12px] text-white/80 mt-1 leading-relaxed">
                    {settings.promoDescription || 'Add a concise callout for your visitors.'}
                  </p>
                  <div className="mt-3.5 inline-flex items-center gap-1.5 bg-white text-black px-3 py-1.5 rounded-lg text-[12px] font-bold">
                    {settings.promoCtaText || 'Learn more'}
                  </div>
                </div>
              </AdminCard>
            </div>
          </div>
        )}
      </form>

      {/* TAB 5: SECURITY (Standalone form — never nested inside site settings form!) */}
      {activeTab === 'security' && (
        <div
          role="tabpanel"
          id="panel-security"
          aria-labelledby="tab-security"
          className="max-w-xl"
        >
          <AdminCard padding="lg">
            <AdminSectionHeader
              icon={Lock}
              title="Change Admin Password"
              description="Update the password used to sign in to this admin dashboard. Takes effect immediately."
            />

            <form onSubmit={changePassword} className="space-y-4">
              {pwError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl flex items-start gap-2.5 text-[12.5px]"
                  style={{
                    backgroundColor: 'var(--adm-danger-bg)',
                    border: '1px solid var(--adm-danger-border)',
                    color: 'var(--adm-danger-text)',
                  }}
                >
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{pwError}</span>
                </div>
              )}

              <AdminFormField label="Current Password" htmlFor="sec-curPw" required>
                <div className="relative">
                  <AdminInput
                    id="sec-curPw"
                    type={showCurPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={curPw}
                    onChange={(e) => {
                      setCurPw(e.target.value);
                      setPwError(null);
                    }}
                    placeholder="Enter your current password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    aria-label={showCurPw ? 'Hide current password' : 'Show current password'}
                    onClick={() => setShowCurPw((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded cursor-pointer"
                    style={{ color: 'var(--adm-text-muted)' }}
                  >
                    {showCurPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </AdminFormField>

              <AdminFormField label="New Password" htmlFor="sec-newPw" required>
                <div className="relative">
                  <AdminInput
                    id="sec-newPw"
                    type={showNewPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPw}
                    onChange={(e) => {
                      setNewPw(e.target.value);
                      setPwError(null);
                    }}
                    placeholder="Minimum 8 characters"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    aria-label={showNewPw ? 'Hide new password' : 'Show new password'}
                    onClick={() => setShowNewPw((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded cursor-pointer"
                    style={{ color: 'var(--adm-text-muted)' }}
                  >
                    {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {newPw && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className="h-1.5 flex-1 rounded-full transition-colors"
                          style={{
                            backgroundColor:
                              pwStrength.score >= step
                                ? pwStrength.color
                                : 'var(--adm-border)',
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span style={{ color: pwStrength.color }} className="font-semibold">
                        Strength: {pwStrength.label}
                      </span>
                      <span style={{ color: 'var(--adm-text-subtle)' }}>
                        {newPw.length >= 8 ? '8+ characters ok' : `${newPw.length}/8 minimum`}
                      </span>
                    </div>
                  </div>
                )}
              </AdminFormField>

              <AdminFormField label="Confirm New Password" htmlFor="sec-confirmPw" required>
                <AdminInput
                  id="sec-confirmPw"
                  type={showNewPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPw}
                  onChange={(e) => {
                    setConfirmPw(e.target.value);
                    setPwError(null);
                  }}
                  placeholder="Re-enter new password"
                />
                {confirmPw && (
                  <p
                    className="text-[11.5px] mt-1 font-medium"
                    style={{
                      color:
                        newPw === confirmPw ? 'var(--adm-success-text)' : 'var(--adm-danger-text)',
                    }}
                  >
                    {newPw === confirmPw ? 'Passwords match' : 'Passwords do not match'}
                  </p>
                )}
              </AdminFormField>

              <div className="pt-2">
                <AdminButton
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={pwLoading}
                  icon={<Check size={14} />}
                >
                  Update Password
                </AdminButton>
              </div>
            </form>
          </AdminCard>
        </div>
      )}

      {/* Sticky Save Bar for Site Settings */}
      {isDirty && activeTab !== 'security' && (
        <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:left-auto z-40">
          <div
            className="flex items-center justify-between gap-4 px-4 py-3 rounded-2xl shadow-xl"
            style={{
              backgroundColor: 'var(--adm-surface-elevated)',
              border: '1px solid var(--adm-accent-border)',
              boxShadow: 'var(--adm-shadow-lg)',
            }}
          >
            <span className="text-[13px] font-medium" style={{ color: 'var(--adm-text)' }}>
              You have unsaved site settings
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <AdminButton
                variant="ghost"
                size="sm"
                onClick={() => setDiscardOpen(true)}
              >
                Discard
              </AdminButton>
              <AdminButton
                type="submit"
                form="site-settings-form"
                variant="primary"
                size="sm"
                loading={saving}
                icon={<Save size={13} />}
              >
                Save Changes
              </AdminButton>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        onConfirm={handleConfirmDiscard}
        title="Discard unsaved settings?"
        description="Your modified site settings across General, Branding, SEO, and Promo tabs will revert to the last saved values."
        confirmLabel="Discard Changes"
        variant="warning"
      />
    </div>
  );
}
