'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Images, Tag, TrendingUp, Plus, ArrowRight, Zap, Star, Eye, EyeOff } from 'lucide-react';
import { useAdminTheme, tk } from '@/context/AdminThemeContext';

interface Stats { total: number; featured: number; drafts: number; models: Record<string, number>; recent: any[] }

const MODEL_COLORS: Record<string, [string, string]> = {
  'ChatGPT':       ['#7c3aed', '#4f46e5'],
  'GPT Image':     ['#7c3aed', '#4f46e5'],
  'Midjourney':    ['#0ea5e9', '#0284c7'],
  'Nanobanana Pro':['#f59e0b', '#d97706'],
  'Nanobanana 2':  ['#f59e0b', '#d97706'],
  'Seedance 2.0':  ['#10b981', '#059669'],
  'DALL-E':        ['#ec4899', '#db2777'],
  'Flux':          ['#f97316', '#ea580c'],
  'Adobe Firefly': ['#ef4444', '#dc2626'],
  'Gemini':        ['#3b82f6', '#2563eb'],
};
function getColors(model: string): [string, string] {
  return MODEL_COLORS[model] || ['#8b5cf6', '#7c3aed'];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [hour]  = useState(() => new Date().getHours());
  const { resolved } = useAdminTheme();
  const t    = tk(resolved);
  const dark = resolved === 'dark';

  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    fetch('/api/admin/prompts?limit=200')
      .then((r) => r.json())
      .then((data) => {
        const models: Record<string, number> = {};
        data.items.forEach((p: any) => { models[p.model] = (models[p.model] || 0) + 1; });
        const featured = data.items.filter((p: any) => p.featured === true).length;
        const drafts   = data.items.filter((p: any) => p.published === false).length;
        setStats({ total: data.total, featured, drafts, models, recent: data.items.slice(0, 6) });
      });
  }, []);

  const modelEntries = Object.entries(stats?.models || {}).sort((a, b) => b[1] - a[1]);
  const topModel     = modelEntries[0];

  const headingGrad = dark
    ? 'linear-gradient(135deg, #ffffff, #a5b4fc)'
    : 'linear-gradient(135deg, #1a1a2e, #4f46e5)';

  return (
    <div className="p-8 max-w-6xl">

      {/* ── Header ──────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[12px] font-semibold px-3 py-1 rounded-full"
            style={{ background: t.accentMuted, color: t.accentText, border: `1px solid ${t.accentBorder}` }}>
            Admin Studio
          </span>
        </div>
        <h1 className="text-[32px] font-bold mb-1 bg-clip-text text-transparent"
          style={{ backgroundImage: headingGrad }}>
          {greeting} 👋
        </h1>
        <p className="text-[14px]" style={{ color: t.textMuted }}>
          Here&apos;s what&apos;s happening with your gallery today.
        </p>
      </div>

      {/* ── Stat cards ──────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Images size={18} />} label="Total Prompts"
          value={stats?.total ?? null} sub="Across all AI models"
          colors={['#7c3aed','#4f46e5']} dark={dark} />
        <StatCard icon={<Star size={18} />} label="Featured"
          value={stats?.featured ?? null} sub="Pinned to gallery top"
          colors={['#f59e0b','#d97706']} dark={dark} />
        <StatCard icon={<EyeOff size={18} />} label="Drafts"
          value={stats?.drafts ?? null} sub="Hidden from gallery"
          colors={['#6b7280','#4b5563']} dark={dark} />
        <StatCard icon={<TrendingUp size={18} />} label="Top Model"
          value={null} label2={topModel?.[0]}
          sub={topModel ? `${topModel[1].toLocaleString()} prompts` : 'Loading…'}
          colors={['#10b981','#059669']} dark={dark} />
      </div>

      {/* ── Quick actions ──────────────────────────── */}
      <div className="flex flex-wrap gap-3 mb-8">
        {[
          { href: '/admin/prompts/new',      icon: Plus,        label: '+ Add Prompt',    primary: true },
          { href: '/admin/prompts',          icon: Images,      label: 'Manage Prompts',  primary: false },
          { href: '/admin/categories',       icon: Tag,         label: 'Categories',      primary: false },
          { href: '/admin/import-export',    icon: ArrowRight,  label: 'Import/Export',   primary: false },
        ].map(({ href, icon: Icon, label, primary }) => (
          <Link key={href} href={href}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
            style={primary ? {
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
            } : {
              background: t.card,
              border: `1px solid ${t.cardBorder}`,
              color: t.textMuted,
            }}>
            <Icon size={14} /> {label}
          </Link>
        ))}
      </div>

      {/* ── Bottom grid ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Model breakdown */}
        <div className="rounded-2xl p-6" style={{ background: t.card, border: `1px solid ${t.cardBorder}` }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-[15px]" style={{ color: t.text }}>Prompts by Model</h2>
              <p className="text-[11px] mt-0.5" style={{ color: t.textMuted }}>Distribution across AI platforms</p>
            </div>
            <Zap size={16} style={{ color: t.accent }} />
          </div>
          <div className="flex flex-col gap-4">
            {modelEntries.map(([model, count]) => {
              const [c1, c2] = getColors(model);
              const pct = stats ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={model}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] font-medium" style={{ color: t.text }}>{model}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px]" style={{ color: t.textMuted }}>{pct}%</span>
                      <span className="text-[12px] font-semibold" style={{ color: t.text }}>{count.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: dark ? 'rgba(255,255,255,0.06)' : '#e5e7eb' }}>
                    <div className="h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${c1}, ${c2})`, boxShadow: `0 0 8px ${c1}55` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent prompts */}
        <div className="rounded-2xl p-6" style={{ background: t.card, border: `1px solid ${t.cardBorder}` }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-[15px]" style={{ color: t.text }}>Recent Prompts</h2>
              <p className="text-[11px] mt-0.5" style={{ color: t.textMuted }}>Latest additions to your gallery</p>
            </div>
            <Link href="/admin/prompts/new"
              className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{ background: t.accentMuted, color: t.accentText, border: `1px solid ${t.accentBorder}` }}>
              <Plus size={12} /> Add
            </Link>
          </div>

          <div className="flex flex-col gap-1">
            {!stats && Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: t.badge }}>
                <div className="w-10 h-10 rounded-lg shrink-0" style={{ background: t.cardBorder }} />
                <div className="flex-1">
                  <div className="h-3 rounded mb-1.5 w-3/4" style={{ background: t.cardBorder }} />
                  <div className="h-2.5 rounded w-1/3" style={{ background: t.cardBorder }} />
                </div>
              </div>
            ))}
            {stats?.recent.map((p) => {
              const [c1] = getColors(p.model);
              return (
                <Link key={p.id} href={`/admin/prompts/${p.id}/edit`}
                  className="flex items-center gap-3 p-2.5 rounded-xl transition-all group"
                  style={{ background: 'transparent' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = t.accentMuted)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 relative"
                    style={{ background: `linear-gradient(135deg, ${p.gradientFrom}, ${p.gradientTo})` }}>
                    {p.localImg && <img src={p.localImg} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium truncate" style={{ color: t.text }}>
                      {p.promptText.slice(0, 52)}{p.promptText.length > 52 ? '…' : ''}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                        style={{ background: `${c1}20`, color: c1 }}>{p.model}</span>
                      <span className="flex items-center gap-0.5 text-[10px]" style={{ color: t.textMuted }}>
                        <Star size={9} /> {p.likes}
                      </span>
                      <span className="flex items-center gap-0.5 text-[10px]" style={{ color: t.textMuted }}>
                        <Eye size={9} /> {p.views}
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={13} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: t.accent }} />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, label2, value, sub, colors, dark }: {
  icon: React.ReactNode; label: string; label2?: string;
  value: number | null; sub: string; colors: [string, string]; dark: boolean;
}) {
  const [c1, c2] = colors;
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden" style={{
      background: dark
        ? `linear-gradient(135deg, ${c1}1a, ${c2}0d)`
        : `linear-gradient(135deg, ${c1}12, ${c2}08)`,
      border: `1px solid ${c1}${dark ? '30' : '25'}`,
    }}>
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${c1}${dark ? '20' : '15'}, transparent 70%)`, transform: 'translate(30%,-30%)' }} />
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
        style={{ background: `${c1}25`, color: c1, border: `1px solid ${c1}35` }}>
        {icon}
      </div>
      {label2 ? (
        <p className="text-[20px] font-bold mb-0.5 truncate"
          style={{ color: dark ? '#ffffff' : '#111827' }}>{label2 || '—'}</p>
      ) : (
        <p className="text-[28px] font-bold mb-0.5 leading-none"
          style={{ color: dark ? '#ffffff' : '#111827' }}>
          {value !== null ? value.toLocaleString() : <span className="inline-block w-12 h-7 rounded" style={{ background: `${c1}20` }} />}
        </p>
      )}
      <p className="text-[11px] font-medium" style={{ color: dark ? 'rgba(255,255,255,0.5)' : '#374151' }}>{label}</p>
      <p className="text-[11px] mt-0.5" style={{ color: dark ? 'rgba(255,255,255,0.28)' : '#6b7280' }}>{sub}</p>
    </div>
  );
}
