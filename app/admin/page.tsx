'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Images, Tag, Plus, ArrowRight, Eye, EyeOff, Heart, RefreshCw,
  BarChart3, Sparkles, ArrowLeftRight, Settings, CheckCircle2, Flame, Clock,
} from 'lucide-react';
import type { AdminDashboardStats, DbPrompt } from '@/lib/db';
import {
  AdminBadge, AdminButton, AdminCard, AdminEmptyState, AdminErrorState,
  AdminPageHeader, AdminSectionHeader,
} from '@/components/admin/ui/Primitives';
import { useToast } from '@/components/admin/ui/ToastProvider';
import { LottieIcon } from '@/components/ui/LottieIcon';

const MODEL_COLORS: Record<string, string> = {
  ChatGPT: '#10b981',
  'GPT Image': '#10b981',
  Midjourney: '#3b82f6',
  'Nanobanana Pro': '#f59e0b',
  'Nanobanana 2': '#f59e0b',
  Nanobanana: '#f59e0b',
  'Seedance 2.0': '#ec4899',
  Seedance: '#ec4899',
  'DALL-E': '#a855f7',
  Flux: '#06b6d4',
  'Adobe Firefly': '#ef4444',
  Gemini: '#6366f1',
  'Leonardo AI': '#f97316',
  'Stable Diffusion': '#8b5cf6',
};

function getModelColor(model: string): string {
  return MODEL_COLORS[model] || '#7c3aed';
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/admin/stats', { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to load dashboard statistics');
        }
        return res.json() as Promise<AdminDashboardStats>;
      })
      .then((data) => {
        setStats(data);
        setError('');
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          setError(err instanceof Error ? err.message : 'Unable to load dashboard statistics');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => controller.abort();
  }, [reloadTick]);

  function handleRefresh() {
    setRefreshing(true);
    setReloadTick((n) => n + 1);
    toast({ title: 'Refreshing dashboard metrics…', variant: 'info', durationMs: 2000 });
  }

  const featuredPct =
    stats && stats.totalPrompts > 0
      ? ((stats.featuredCount / stats.totalPrompts) * 100).toFixed(1)
      : '0';

  const publishedPct =
    stats && stats.totalPrompts > 0
      ? Math.round((stats.publishedCount / stats.totalPrompts) * 100)
      : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <AdminPageHeader
        title="Dashboard"
        description="Live catalog metrics, model distribution, and recent prompt activity."
        badge={
          stats ? (
            <AdminBadge variant="success">
              <CheckCircle2 size={11} />
              {publishedPct}% Published
            </AdminBadge>
          ) : null
        }
        actions={
          <>
            <AdminButton
              variant="outline"
              size="md"
              onClick={handleRefresh}
              loading={refreshing}
              icon={<RefreshCw size={14} />}
            >
              Refresh
            </AdminButton>
            <Link href="/admin/prompts/new">
              <AdminButton variant="primary" size="md" icon={<Plus size={14} />}>
                Add Prompt
              </AdminButton>
            </Link>
          </>
        }
      />

      {error && !stats && (
        <div className="mb-6">
          <AdminErrorState
            message={error}
            onRetry={() => {
              setLoading(true);
              setError('');
              setReloadTick((n) => n + 1);
            }}
          />
        </div>
      )}

      {/* KPI Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard
          href="/admin/prompts"
          icon={<LottieIcon name="layers" size={18} />}
          label="Total Prompts"
          value={stats ? stats.totalPrompts.toLocaleString() : null}
          sub={
            stats
              ? `${stats.publishedCount.toLocaleString()} published · ${stats.categoriesCount} categories`
              : 'Loading catalog…'
          }
          accentColor="#7c3aed"
        />
        <KpiCard
          href="/admin/prompts?status=featured"
          icon={<LottieIcon name="sparkles" size={18} />}
          label="Featured"
          value={stats ? stats.featuredCount.toLocaleString() : null}
          sub={stats ? `${featuredPct}% pinned to gallery top` : 'Loading…'}
          accentColor="#f59e0b"
        />
        <KpiCard
          href="/admin/prompts?status=draft"
          icon={<EyeOff size={17} />}
          label="Hidden Drafts"
          value={stats ? stats.draftCount.toLocaleString() : null}
          sub="Excluded from public gallery"
          accentColor="#64748b"
        />
        <KpiCard
          href="/admin/prompts?sort=likes"
          icon={<LottieIcon name="heart" size={18} />}
          label="Total Engagement"
          value={stats ? stats.totalLikes.toLocaleString() : null}
          sub={stats ? `${stats.totalViews.toLocaleString()} total views` : 'Loading…'}
          accentColor="#10b981"
        />
      </div>

      {/* Quick Workflows Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          {
            href: '/admin/prompts',
            icon: Images,
            title: 'Manage Prompts',
            sub: 'Search, filter & bulk edit',
          },
          {
            href: '/admin/categories',
            icon: Tag,
            title: 'Categories',
            sub: stats ? `${stats.categoriesCount} active categories` : 'Organize tags',
          },
          {
            href: '/admin/import-export',
            icon: ArrowLeftRight,
            title: 'Import / Export',
            sub: 'Backup JSON or CSV',
          },
          {
            href: '/admin/settings',
            icon: Settings,
            title: 'Site Settings',
            sub: 'Branding, SEO & promo card',
          },
        ].map(({ href, icon: Icon, title, sub }) => (
          <Link
            key={href}
            href={href}
            className="admin-surface admin-surface-hover rounded-xl p-3.5 flex items-center gap-3 group"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'var(--adm-surface-muted)',
                border: '1px solid var(--adm-border)',
                color: 'var(--adm-accent-text)',
              }}
            >
              <Icon size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--adm-text)' }}>
                {title}
              </p>
              <p className="text-[11.5px] truncate" style={{ color: 'var(--adm-text-muted)' }}>
                {sub}
              </p>
            </div>
            <ArrowRight
              size={14}
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: 'var(--adm-accent-text)' }}
            />
          </Link>
        ))}
      </div>

      {/* Model Distribution + Top Performing */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <AdminCard className="lg:col-span-3" padding="lg">
          <AdminSectionHeader
            icon={BarChart3}
            title="Prompts by AI Model"
            description="Click any model to filter prompts in the catalog."
            action={
              stats && (
                <span className="text-[12px] font-medium tabular-nums" style={{ color: 'var(--adm-text-muted)' }}>
                  {stats.modelBreakdown.length} models
                </span>
              )
            }
          />

          {loading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3.5 w-1/2 rounded admin-skeleton" />
                  <div className="h-2 w-full rounded-full admin-skeleton" />
                </div>
              ))}
            </div>
          ) : !stats || stats.modelBreakdown.length === 0 ? (
            <AdminEmptyState
              title="No model data yet"
              description="Add prompts to see how your catalog is distributed across AI platforms."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {stats.modelBreakdown.map((item) => {
                const color = getModelColor(item.model);
                const pct =
                  stats.totalPrompts > 0
                    ? Math.max(1, Math.round((item.count / stats.totalPrompts) * 100))
                    : 0;
                const exactPct =
                  stats.totalPrompts > 0
                    ? ((item.count / stats.totalPrompts) * 100).toFixed(1)
                    : '0';

                return (
                  <Link
                    key={item.model}
                    href={`/admin/prompts?model=${encodeURIComponent(item.model)}`}
                    className="block p-2.5 -mx-2.5 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/[0.03] group"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span
                          className="text-[13px] font-medium truncate group-hover:underline"
                          style={{ color: 'var(--adm-text)' }}
                        >
                          {item.model}
                        </span>
                        {item.featured > 0 && (
                          <AdminBadge variant="warning" className="hidden sm:inline-flex">
                            {item.featured} featured
                          </AdminBadge>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0 tabular-nums">
                        <span className="text-[11.5px]" style={{ color: 'var(--adm-text-subtle)' }}>
                          {exactPct}%
                        </span>
                        <span className="text-[13px] font-semibold" style={{ color: 'var(--adm-text)' }}>
                          {item.count.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'var(--adm-surface-muted)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </AdminCard>

        <AdminCard className="lg:col-span-2" padding="lg">
          <AdminSectionHeader
            icon={Flame}
            title="Top Performing"
            description="Most liked prompts across the gallery."
            action={
              <Link
                href="/admin/prompts?sort=likes"
                className="text-[12px] font-medium hover:underline"
                style={{ color: 'var(--adm-accent-text)' }}
              >
                View all
              </Link>
            }
          />

          {loading ? (
            <PromptMiniSkeleton count={5} />
          ) : !stats || stats.topPrompts.length === 0 ? (
            <AdminEmptyState title="No prompts yet" description="Create your first prompt to track top performers." />
          ) : (
            <div className="flex flex-col gap-1.5">
              {stats.topPrompts.map((p) => (
                <PromptMiniRow key={p.id} prompt={p} />
              ))}
            </div>
          )}
        </AdminCard>
      </div>

      {/* Recent Additions + Sync Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminCard padding="lg">
          <AdminSectionHeader
            icon={Clock}
            title="Recent Prompts"
            description="Latest prompts added or synced to the catalog."
            action={
              <Link
                href="/admin/prompts"
                className="text-[12px] font-medium hover:underline"
                style={{ color: 'var(--adm-accent-text)' }}
              >
                Manage all
              </Link>
            }
          />

          {loading ? (
            <PromptMiniSkeleton count={6} />
          ) : !stats || stats.recentPrompts.length === 0 ? (
            <AdminEmptyState
              title="No prompts yet"
              description="Get started by creating a prompt or importing a JSON backup."
              action={
                <Link href="/admin/prompts/new">
                  <AdminButton variant="primary" size="sm" icon={<Plus size={13} />}>
                    Add Prompt
                  </AdminButton>
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col gap-1.5">
              {stats.recentPrompts.map((p) => (
                <PromptMiniRow key={p.id} prompt={p} showDate />
              ))}
            </div>
          )}
        </AdminCard>

        <AdminCard padding="lg">
          <AdminSectionHeader
            icon={Sparkles}
            title={stats && stats.recentSyncRuns.length > 0 ? 'Recent Sync Runs' : 'Catalog Health'}
            description={
              stats && stats.recentSyncRuns.length > 0
                ? 'Latest automated MeiGen sync executions.'
                : 'Publishing and metadata overview across your gallery.'
            }
          />

          {loading ? (
            <PromptMiniSkeleton count={4} />
          ) : stats && stats.recentSyncRuns.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {stats.recentSyncRuns.map((run) => (
                <div
                  key={run.id}
                  className="p-3 rounded-xl flex items-center justify-between gap-3"
                  style={{
                    backgroundColor: 'var(--adm-surface-muted)',
                    border: '1px solid var(--adm-border)',
                  }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12.5px] font-semibold" style={{ color: 'var(--adm-text)' }}>
                        Sort: {run.sort || 'all'}
                      </span>
                      {run.dryRun && <AdminBadge variant="warning">Dry run</AdminBadge>}
                    </div>
                    <p className="text-[11.5px] mt-0.5 tabular-nums" style={{ color: 'var(--adm-text-muted)' }}>
                      {new Date(run.startedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0 tabular-nums">
                    <p className="text-[12.5px] font-semibold" style={{ color: 'var(--adm-success-text)' }}>
                      +{run.inserted} added
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--adm-text-subtle)' }}>
                      {run.scanned} scanned · {run.skipped} skipped
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : stats ? (
            <div className="flex flex-col gap-3">
              <div
                className="p-4 rounded-xl flex items-center justify-between gap-3"
                style={{
                  backgroundColor: 'var(--adm-surface-muted)',
                  border: '1px solid var(--adm-border)',
                }}
              >
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--adm-text)' }}>
                    Published Visibility
                  </p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
                    {stats.publishedCount.toLocaleString()} live · {stats.draftCount.toLocaleString()} hidden drafts
                  </p>
                </div>
                <AdminBadge variant="success">{publishedPct}% live</AdminBadge>
              </div>

              <div
                className="p-4 rounded-xl flex items-center justify-between gap-3"
                style={{
                  backgroundColor: 'var(--adm-surface-muted)',
                  border: '1px solid var(--adm-border)',
                }}
              >
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--adm-text)' }}>
                    Categories Configured
                  </p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
                    Used across sidebar and prompt classification
                  </p>
                </div>
                <Link href="/admin/categories">
                  <AdminButton variant="secondary" size="sm">
                    {stats.categoriesCount} categories
                  </AdminButton>
                </Link>
              </div>

              <div
                className="p-4 rounded-xl flex items-center justify-between gap-3"
                style={{
                  backgroundColor: 'var(--adm-surface-muted)',
                  border: '1px solid var(--adm-border)',
                }}
              >
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--adm-text)' }}>
                    Backups &amp; Bulk Import
                  </p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
                    Export full JSON/CSV snapshots anytime
                  </p>
                </div>
                <Link href="/admin/import-export">
                  <AdminButton variant="secondary" size="sm">
                    Open tool
                  </AdminButton>
                </Link>
              </div>
            </div>
          ) : null}
        </AdminCard>
      </div>
    </div>
  );
}

function KpiCard({
  href,
  icon,
  label,
  value,
  sub,
  accentColor,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string | null;
  sub: string;
  accentColor: string;
}) {
  return (
    <Link
      href={href}
      className="admin-surface admin-surface-hover rounded-2xl p-5 flex flex-col justify-between gap-4 group"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12.5px] font-semibold" style={{ color: 'var(--adm-text-muted)' }}>
          {label}
        </span>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            backgroundColor: `${accentColor}1a`,
            border: `1px solid ${accentColor}33`,
            color: accentColor,
          }}
        >
          {icon}
        </div>
      </div>

      <div>
        {value !== null ? (
          <p
            className="text-[28px] font-bold leading-none tracking-tight tabular-nums"
            style={{ color: 'var(--adm-text)' }}
          >
            {value}
          </p>
        ) : (
          <div className="h-7 w-24 rounded-md admin-skeleton" />
        )}
        <p className="text-[12px] mt-2 truncate" style={{ color: 'var(--adm-text-subtle)' }}>
          {sub}
        </p>
      </div>
    </Link>
  );
}

function PromptMiniRow({ prompt, showDate }: { prompt: DbPrompt; showDate?: boolean }) {
  const thumb = prompt.localImg || prompt.imageUrl;
  const isPublished = prompt.published !== false;
  return (
    <Link
      href={`/admin/prompts/${prompt.id}/edit`}
      className="flex items-center gap-3 p-2.5 -mx-2 rounded-xl transition-colors admin-surface-hover border border-transparent group"
    >
      <div
        className="w-11 h-11 rounded-lg overflow-hidden shrink-0"
        style={{
          background: `linear-gradient(135deg, ${prompt.gradientFrom}, ${prompt.gradientTo})`,
          border: '1px solid var(--adm-border)',
        }}
      >
        {thumb && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-medium truncate" style={{ color: 'var(--adm-text)' }}>
          {prompt.promptText}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <AdminBadge variant="accent">{prompt.model}</AdminBadge>
          {!isPublished && <AdminBadge variant="danger">Draft</AdminBadge>}
          {prompt.featured && <AdminBadge variant="warning">Featured</AdminBadge>}
          <span
            className="inline-flex items-center gap-1 text-[11px] tabular-nums"
            style={{ color: 'var(--adm-text-muted)' }}
          >
            <Heart size={10} /> {prompt.likes.toLocaleString()}
          </span>
          <span
            className="inline-flex items-center gap-1 text-[11px] tabular-nums"
            style={{ color: 'var(--adm-text-subtle)' }}
          >
            <Eye size={10} /> {prompt.views.toLocaleString()}
          </span>
          {showDate && prompt.createdAt && (
            <span className="text-[11px] tabular-nums ml-auto" style={{ color: 'var(--adm-text-subtle)' }}>
              {prompt.createdAt.slice(0, 10)}
            </span>
          )}
        </div>
      </div>

      <ArrowRight
        size={14}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: 'var(--adm-accent-text)' }}
      />
    </Link>
  );
}

function PromptMiniSkeleton({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <div className="w-11 h-11 rounded-lg shrink-0 admin-skeleton" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-4/5 rounded admin-skeleton" />
            <div className="h-2.5 w-2/5 rounded admin-skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}
