'use client';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus, Search, Pencil, Trash2, Heart, Eye, ChevronLeft, ChevronRight,
  Star, EyeOff, CheckSquare, Square, Minus, X, SlidersHorizontal,
  ArrowUpDown, CheckCircle2, Code2, Images,
} from 'lucide-react';
import type { AdminPromptSort, AdminPromptStatus, DbCategory, DbPrompt } from '@/lib/db';
import { ALL_MODELS } from '@/lib/vibe-coding';
import {
  AdminBadge, AdminButton, AdminCard, AdminEmptyState, AdminErrorState, AdminPageHeader,
} from '@/components/admin/ui/Primitives';
import { ConfirmDialog } from '@/components/admin/ui/Dialog';
import { useToast } from '@/components/admin/ui/ToastProvider';
import { PromptDetailDrawer } from '@/components/admin/PromptDetailDrawer';

const MODELS = [...ALL_MODELS];

const STATUS_TABS: { value: AdminPromptStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
  { value: 'featured', label: 'Featured' },
];

function PromptsManagerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Read filters from URL params so navigation & Back links preserve exact state
  const urlQ = searchParams.get('q') || '';
  const urlModel = searchParams.get('model') || '';
  const urlCategory = searchParams.get('category') || '';
  const urlHasCode = searchParams.get('hasCode') === '1';
  const urlStatus = (searchParams.get('status') as AdminPromptStatus) || 'all';
  const urlSort = (searchParams.get('sort') as AdminPromptSort) || 'newest';
  const urlPage = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
  const urlLimit = [20, 50, 100].includes(Number(searchParams.get('limit')))
    ? Number(searchParams.get('limit'))
    : 20;

  const [searchInput, setSearchInput] = useState(urlQ);
  const [items, setItems] = useState<DbPrompt[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [completedKey, setCompletedKey] = useState('');
  const [error, setError] = useState('');
  const [reloadTick, setReloadTick] = useState(0);

  const queryParams = new URLSearchParams({
    page: String(urlPage),
    limit: String(urlLimit),
    status: urlStatus,
    sort: urlSort,
  });
  if (urlQ) queryParams.set('q', urlQ);
  if (urlModel) queryParams.set('model', urlModel);
  if (urlCategory) queryParams.set('category', urlCategory);
  if (urlHasCode) queryParams.set('hasCode', '1');
  const queryString = queryParams.toString();
  const requestKey = `${queryString}#${reloadTick}`;
  const loading = completedKey !== requestKey;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const [inspectPrompt, setInspectPrompt] = useState<DbPrompt | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<
    | { mode: 'single'; prompt: DbPrompt }
    | { mode: 'bulk'; ids: string[] }
    | null
  >(null);
  const [deleting, setDeleting] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateParams = useCallback(
    (patch: Record<string, string | number | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === '' || (k === 'status' && v === 'all') || (k === 'sort' && v === 'newest') || (k === 'page' && v === 1) || (k === 'limit' && v === 20)) {
          next.delete(k);
        } else {
          next.set(k, String(v));
        }
      }
      const qs = next.toString();
      router.replace(qs ? `/admin/prompts?${qs}` : '/admin/prompts', { scroll: false });
    },
    [router, searchParams]
  );

  // Sync searchInput when URL q changes externally (e.g. Clear filters or Command Palette)
  const prevUrlQ = useRef(urlQ);
  useEffect(() => {
    if (prevUrlQ.current !== urlQ) {
      prevUrlQ.current = urlQ;
      setSearchInput(urlQ);
    }
  }, [urlQ]);

  function handleSearchChange(val: string) {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ q: val.trim(), page: 1 });
    }, 280);
  }

  useEffect(() => {
    fetch('/api/admin/categories')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/admin/prompts?${queryString}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || 'Failed to load prompts');
        }
        return res.json() as Promise<{ items: DbPrompt[]; total: number }>;
      })
      .then((data) => {
        setItems(data.items);
        setTotal(data.total);
        setSelected(new Set());
        setError('');
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          setError(err instanceof Error ? err.message : 'Unable to load prompts');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCompletedKey(requestKey);
      });

    return () => controller.abort();
  }, [queryString, requestKey]);

  async function handleToggle(id: string, field: 'featured' | 'published', value: boolean) {
    const key = `${id}:${field}`;
    setTogglingKey(key);
    try {
      const res = await fetch(`/api/admin/prompts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Update failed');
      }
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
      setInspectPrompt((prev) => (prev && prev.id === id ? { ...prev, [field]: value } : prev));
      toast({
        title:
          field === 'featured'
            ? value ? 'Prompt featured' : 'Removed from featured'
            : value ? 'Prompt published' : 'Moved to drafts',
        variant: 'success',
        durationMs: 2500,
      });
    } catch (err) {
      toast({
        title: 'Failed to update prompt',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    } finally {
      setTogglingKey(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.mode === 'single') {
        const res = await fetch(`/api/admin/prompts/${deleteTarget.prompt.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete prompt');
        toast({ title: 'Prompt deleted', variant: 'success' });
        if (inspectPrompt?.id === deleteTarget.prompt.id) setInspectPrompt(null);
      } else {
        const res = await fetch('/api/admin/prompts/bulk', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: deleteTarget.ids }),
        });
        if (!res.ok) throw new Error('Failed to delete selected prompts');
        const data = await res.json();
        toast({
          title: `Deleted ${data.removed ?? deleteTarget.ids.length} prompt(s)`,
          variant: 'success',
        });
      }
      setDeleteTarget(null);
      setReloadTick((n) => n + 1);
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    } finally {
      setDeleting(false);
    }
  }

  async function runBulkAction(action: 'publish' | 'unpublish' | 'feature' | 'unfeature') {
    const ids = [...selected];
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      const res = await fetch('/api/admin/prompts/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action }),
      });
      if (!res.ok) throw new Error('Bulk action failed');
      const labels: Record<typeof action, string> = {
        publish: 'Published selected prompts',
        unpublish: 'Moved selected prompts to drafts',
        feature: 'Featured selected prompts',
        unfeature: 'Unfeatured selected prompts',
      };
      toast({ title: labels[action], variant: 'success' });
      setReloadTick((n) => n + 1);
    } catch (err) {
      toast({
        title: 'Bulk action failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    } finally {
      setBulkBusy(false);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((p) => p.id)));
  }

  const hasFilters = Boolean(urlQ || urlModel || urlCategory || urlHasCode || urlStatus !== 'all' || urlSort !== 'newest');
  const pages = Math.max(1, Math.ceil(total / urlLimit));
  const allSelected = items.length > 0 && selected.size === items.length;
  const someSelected = selected.size > 0 && selected.size < items.length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto pb-24">
      <AdminPageHeader
        title="Prompts"
        description="Search, inspect, feature, publish, and manage your entire AI prompt library."
        badge={<AdminBadge variant="neutral">{total.toLocaleString()} results</AdminBadge>}
        actions={
          <Link href="/admin/prompts/new">
            <AdminButton variant="primary" size="md" icon={<Plus size={14} />}>
              Add Prompt
            </AdminButton>
          </Link>
        }
      />

      {/* Filter Toolbar */}
      <AdminCard padding="sm" className="mb-5">
        <div className="flex flex-col gap-3">
          {/* Status Pills + Sort + Page Size */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div
              role="tablist"
              aria-label="Filter by publication status"
              className="inline-flex items-center gap-1 p-1 rounded-xl"
              style={{
                backgroundColor: 'var(--adm-surface-muted)',
                border: '1px solid var(--adm-border)',
              }}
            >
              {STATUS_TABS.map((tab) => {
                const active = urlStatus === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => updateParams({ status: tab.value, page: 1 })}
                    className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer"
                    style={{
                      backgroundColor: active ? 'var(--adm-surface)' : 'transparent',
                      color: active ? 'var(--adm-accent-text)' : 'var(--adm-text-muted)',
                      boxShadow: active ? 'var(--adm-shadow-sm)' : 'none',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                aria-pressed={urlHasCode}
                onClick={() => updateParams({ hasCode: urlHasCode ? undefined : '1', page: 1 })}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[12px] font-semibold transition-all cursor-pointer border"
                style={{
                  backgroundColor: urlHasCode ? 'var(--adm-accent-soft)' : 'var(--adm-surface-muted)',
                  borderColor: urlHasCode ? 'var(--adm-accent)' : 'var(--adm-border)',
                  color: urlHasCode ? 'var(--adm-accent-text)' : 'var(--adm-text-muted)',
                }}
                title="Show only prompts that include Vibe Coding source code"
              >
                <Code2 size={13} />
                With Code
              </button>

              <div className="flex items-center gap-1.5">
                <ArrowUpDown size={13} style={{ color: 'var(--adm-text-subtle)' }} />
                <select
                  aria-label="Sort prompts"
                  value={urlSort}
                  onChange={(e) => updateParams({ sort: e.target.value, page: 1 })}
                  className="admin-control px-2.5 py-1.5 text-[12px]"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="likes">Most liked</option>
                  <option value="views">Most viewed</option>
                </select>
              </div>

              <select
                aria-label="Rows per page"
                value={urlLimit}
                onChange={(e) => updateParams({ limit: Number(e.target.value), page: 1 })}
                className="admin-control px-2.5 py-1.5 text-[12px]"
              >
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>
          </div>

          {/* Search + Model + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_190px_190px_auto] gap-2.5">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--adm-text-subtle)' }}
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search prompt text, author, handle, model…"
                aria-label="Search prompts"
                className="admin-control w-full pl-9 pr-9 py-2"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    updateParams({ q: '', page: 1 });
                  }}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded cursor-pointer"
                  style={{ color: 'var(--adm-text-muted)' }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <select
              aria-label="Filter by AI model"
              value={urlModel}
              onChange={(e) => updateParams({ model: e.target.value, page: 1 })}
              className="admin-control px-3 py-2"
            >
              <option value="">All Models</option>
              {MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by category"
              value={urlCategory}
              onChange={(e) => updateParams({ category: e.target.value, page: 1 })}
              className="admin-control px-3 py-2"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            {hasFilters && (
              <AdminButton
                variant="outline"
                size="md"
                onClick={() => {
                  setSearchInput('');
                  router.replace('/admin/prompts', { scroll: false });
                }}
                icon={<SlidersHorizontal size={13} />}
              >
                Reset
              </AdminButton>
            )}
          </div>
        </div>
      </AdminCard>

      {/* Error State */}
      {error && (
        <div className="mb-5">
          <AdminErrorState message={error} onRetry={() => setReloadTick((n) => n + 1)} />
        </div>
      )}

      {/* Desktop Data Table */}
      <AdminCard padding="none" className="overflow-hidden hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--adm-border)',
                  backgroundColor: 'var(--adm-surface-muted)',
                }}
              >
                <th className="px-4 py-3 w-11 text-left">
                  <button
                    type="button"
                    onClick={toggleAll}
                    aria-label={allSelected ? 'Deselect all prompts on page' : 'Select all prompts on page'}
                    className="flex items-center justify-center cursor-pointer"
                    style={{ color: allSelected || someSelected ? 'var(--adm-accent-text)' : 'var(--adm-text-muted)' }}
                  >
                    {allSelected ? <CheckSquare size={16} /> : someSelected ? <Minus size={16} /> : <Square size={16} />}
                  </button>
                </th>
                {['Prompt', 'Model', 'Author', 'Status', 'Engagement', 'Date', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 py-3 font-semibold text-[11px] uppercase tracking-wider"
                    style={{ color: 'var(--adm-text-subtle)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--adm-border-subtle)' }}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-3 py-3.5">
                        <div className="h-4 rounded admin-skeleton" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <AdminEmptyState
                      title="No prompts match your filters"
                      description={
                        hasFilters
                          ? 'Try adjusting your search query, status, or model filter.'
                          : 'Your prompt catalog is currently empty.'
                      }
                      action={
                        <>
                          {hasFilters && (
                            <AdminButton
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSearchInput('');
                                router.replace('/admin/prompts');
                              }}
                            >
                              Clear filters
                            </AdminButton>
                          )}
                          <Link href="/admin/prompts/new">
                            <AdminButton variant="primary" size="sm" icon={<Plus size={13} />}>
                              Add Prompt
                            </AdminButton>
                          </Link>
                        </>
                      }
                    />
                  </td>
                </tr>
              ) : (
                items.map((p) => {
                  const isSel = selected.has(p.id);
                  const isPublished = p.published !== false;
                  const isFeatured = p.featured === true;
                  const thumb = p.localImg || p.imageUrl;

                  return (
                    <tr
                      key={p.id}
                      className="transition-colors"
                      style={{
                        borderBottom: '1px solid var(--adm-border-subtle)',
                        backgroundColor: isSel ? 'var(--adm-accent-soft)' : 'transparent',
                      }}
                    >
                      <td className="px-4 py-3 align-middle">
                        <button
                          type="button"
                          onClick={() => toggleSelect(p.id)}
                          aria-label={`Select prompt ${p.id}`}
                          aria-pressed={isSel}
                          className="flex items-center justify-center cursor-pointer"
                          style={{ color: isSel ? 'var(--adm-accent-text)' : 'var(--adm-text-muted)' }}
                        >
                          {isSel ? <CheckSquare size={16} /> : <Square size={16} />}
                        </button>
                      </td>

                      {/* Image + Prompt */}
                      <td className="px-3 py-3 max-w-[340px]">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setInspectPrompt(p)}
                            aria-label={`Quick view prompt ${p.id}`}
                            className="w-12 h-12 rounded-lg overflow-hidden shrink-0 cursor-pointer"
                            style={{
                              background: `linear-gradient(135deg, ${p.gradientFrom}, ${p.gradientTo})`,
                              border: '1px solid var(--adm-border)',
                            }}
                          >
                            {thumb && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setInspectPrompt(p)}
                              className="text-left font-medium line-clamp-2 text-[12.5px] leading-snug hover:underline cursor-pointer"
                              style={{ color: 'var(--adm-text)' }}
                            >
                              {p.title ? (
                                <>
                                  <span className="font-semibold">{p.title}</span>
                                  <span className="font-normal opacity-75"> — {p.promptText}</span>
                                </>
                              ) : (
                                p.promptText
                              )}
                            </button>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="text-[11px] truncate" style={{ color: 'var(--adm-text-subtle)' }}>
                                {p.category} · {p.aspectRatio}
                              </span>
                              {(p.hasCode || p.codeSnippet?.trim()) && (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.2 rounded"
                                  style={{
                                    backgroundColor: 'var(--adm-info-bg)',
                                    color: 'var(--adm-info-text)',
                                  }}
                                >
                                  <Code2 size={10} />
                                  {(p.codeLanguage || 'code').toUpperCase()}
                                </span>
                              )}
                              {(p.galleryImages?.length ?? 0) > 0 && (
                                <span
                                  className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.2 rounded"
                                  style={{
                                    backgroundColor: 'var(--adm-surface-muted)',
                                    color: 'var(--adm-text-muted)',
                                  }}
                                >
                                  <Images size={10} />+{p.galleryImages?.length}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Model */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <AdminBadge variant="accent">{p.model}</AdminBadge>
                      </td>

                      {/* Author */}
                      <td className="px-3 py-3 max-w-[130px]">
                        <p className="text-[12.5px] font-medium truncate" style={{ color: 'var(--adm-text)' }}>
                          {p.authorName}
                        </p>
                        <p className="text-[11px] truncate" style={{ color: 'var(--adm-text-subtle)' }}>
                          {p.handle || '—'}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <AdminBadge variant={isPublished ? 'success' : 'danger'}>
                            {isPublished ? 'Published' : 'Draft'}
                          </AdminBadge>
                          {isFeatured && <AdminBadge variant="warning">Featured</AdminBadge>}
                        </div>
                      </td>

                      {/* Engagement */}
                      <td className="px-3 py-3 whitespace-nowrap tabular-nums">
                        <div className="flex flex-col gap-0.5 text-[11.5px]" style={{ color: 'var(--adm-text-muted)' }}>
                          <span className="inline-flex items-center gap-1">
                            <Heart size={11} /> {p.likes.toLocaleString()}
                          </span>
                          <span className="inline-flex items-center gap-1" style={{ color: 'var(--adm-text-subtle)' }}>
                            <Eye size={11} /> {p.views.toLocaleString()}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-3 py-3 whitespace-nowrap text-[11.5px] tabular-nums" style={{ color: 'var(--adm-text-subtle)' }}>
                        {p.createdAt?.slice(0, 10) || '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggle(p.id, 'featured', !isFeatured)}
                            disabled={togglingKey === `${p.id}:featured`}
                            title={isFeatured ? 'Unfeature' : 'Feature'}
                            aria-label={isFeatured ? 'Remove featured status' : 'Mark as featured'}
                            className="p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                            style={{
                              color: isFeatured ? '#f59e0b' : 'var(--adm-text-muted)',
                              backgroundColor: isFeatured ? 'var(--adm-warning-bg)' : 'transparent',
                            }}
                          >
                            <Star size={14} fill={isFeatured ? 'currentColor' : 'none'} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggle(p.id, 'published', !isPublished)}
                            disabled={togglingKey === `${p.id}:published`}
                            title={isPublished ? 'Hide (move to draft)' : 'Publish to gallery'}
                            aria-label={isPublished ? 'Unpublish prompt' : 'Publish prompt'}
                            className="p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                            style={{
                              color: isPublished ? 'var(--adm-text-muted)' : 'var(--adm-danger-text)',
                              backgroundColor: isPublished ? 'transparent' : 'var(--adm-danger-bg)',
                            }}
                          >
                            {isPublished ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>

                          <Link
                            href={`/admin/prompts/${p.id}/edit`}
                            title="Edit prompt"
                            aria-label={`Edit prompt ${p.id}`}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: 'var(--adm-text-muted)' }}
                          >
                            <Pencil size={14} />
                          </Link>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ mode: 'single', prompt: p })}
                            title="Delete prompt"
                            aria-label={`Delete prompt ${p.id}`}
                            className="p-1.5 rounded-lg transition-colors cursor-pointer"
                            style={{ color: 'var(--adm-danger-text)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Desktop Pagination */}
        <PaginationBar
          page={urlPage}
          pages={pages}
          limit={urlLimit}
          total={total}
          onPageChange={(nextPage) => updateParams({ page: nextPage })}
        />
      </AdminCard>

      {/* Mobile / Tablet Card List */}
      <div className="lg:hidden flex flex-col gap-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl admin-skeleton" />
          ))
        ) : items.length === 0 ? (
          <AdminCard>
            <AdminEmptyState
              title="No prompts match your filters"
              description="Adjust your search or add a new prompt."
              action={
                hasFilters ? (
                  <AdminButton variant="outline" size="sm" onClick={() => router.replace('/admin/prompts')}>
                    Clear filters
                  </AdminButton>
                ) : null
              }
            />
          </AdminCard>
        ) : (
          <>
            {items.map((p) => {
              const isSel = selected.has(p.id);
              const isPublished = p.published !== false;
              const isFeatured = p.featured === true;
              const thumb = p.localImg || p.imageUrl;

              return (
                <AdminCard key={p.id} padding="sm">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleSelect(p.id)}
                      aria-label={`Select prompt ${p.id}`}
                      className="mt-1 shrink-0 cursor-pointer"
                      style={{ color: isSel ? 'var(--adm-accent-text)' : 'var(--adm-text-muted)' }}
                    >
                      {isSel ? <CheckSquare size={17} /> : <Square size={17} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setInspectPrompt(p)}
                      className="w-16 h-16 rounded-xl overflow-hidden shrink-0 cursor-pointer"
                      style={{
                        background: `linear-gradient(135deg, ${p.gradientFrom}, ${p.gradientTo})`,
                        border: '1px solid var(--adm-border)',
                      }}
                    >
                      {thumb && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => setInspectPrompt(p)}
                        className="text-left text-[13px] font-medium line-clamp-2 leading-snug cursor-pointer"
                        style={{ color: 'var(--adm-text)' }}
                      >
                        {p.title ? (
                          <>
                            <span className="font-semibold">{p.title}</span>
                            <span className="font-normal opacity-75"> — {p.promptText}</span>
                          </>
                        ) : (
                          p.promptText
                        )}
                      </button>

                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <AdminBadge variant="accent">{p.model}</AdminBadge>
                        {(p.hasCode || p.codeSnippet?.trim()) && (
                          <AdminBadge variant="info">
                            {(p.codeLanguage || 'code').toUpperCase()}
                          </AdminBadge>
                        )}
                        {(p.galleryImages?.length ?? 0) > 0 && (
                          <AdminBadge variant="neutral">+{p.galleryImages?.length} photos</AdminBadge>
                        )}
                        <AdminBadge variant={isPublished ? 'success' : 'danger'}>
                          {isPublished ? 'Published' : 'Draft'}
                        </AdminBadge>
                        {isFeatured && <AdminBadge variant="warning">Featured</AdminBadge>}
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5" style={{ borderTop: '1px solid var(--adm-border-subtle)' }}>
                        <div className="flex items-center gap-3 text-[11.5px] tabular-nums" style={{ color: 'var(--adm-text-muted)' }}>
                          <span className="inline-flex items-center gap-1"><Heart size={11} /> {p.likes}</span>
                          <span className="inline-flex items-center gap-1"><Eye size={11} /> {p.views}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Link href={`/admin/prompts/${p.id}/edit`}>
                            <AdminButton variant="secondary" size="sm" icon={<Pencil size={12} />}>
                              Edit
                            </AdminButton>
                          </Link>
                          <AdminButton
                            variant="danger"
                            size="sm"
                            aria-label={`Delete prompt ${p.id}`}
                            onClick={() => setDeleteTarget({ mode: 'single', prompt: p })}
                            icon={<Trash2 size={12} />}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </AdminCard>
              );
            })}

            <AdminCard padding="none" className="overflow-hidden">
              <PaginationBar
                page={urlPage}
                pages={pages}
                limit={urlLimit}
                total={total}
                onPageChange={(nextPage) => updateParams({ page: nextPage })}
              />
            </AdminCard>
          </>
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      {selected.size > 0 && (
        <div
          role="region"
          aria-label="Bulk actions"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100vw-2rem)] max-w-2xl rounded-2xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
          style={{
            backgroundColor: 'var(--adm-surface-elevated)',
            border: '1px solid var(--adm-accent-border)',
            boxShadow: 'var(--adm-shadow-lg)',
          }}
        >
          <div className="flex items-center gap-2">
            <AdminBadge variant="accent">{selected.size} selected</AdminBadge>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-[12px] font-medium hover:underline cursor-pointer"
              style={{ color: 'var(--adm-text-muted)' }}
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <AdminButton
              variant="secondary"
              size="sm"
              loading={bulkBusy}
              onClick={() => runBulkAction('publish')}
              icon={<CheckCircle2 size={13} />}
            >
              Publish
            </AdminButton>
            <AdminButton
              variant="secondary"
              size="sm"
              loading={bulkBusy}
              onClick={() => runBulkAction('unpublish')}
              icon={<EyeOff size={13} />}
            >
              Draft
            </AdminButton>
            <AdminButton
              variant="secondary"
              size="sm"
              loading={bulkBusy}
              onClick={() => runBulkAction('feature')}
              icon={<Star size={13} />}
            >
              Feature
            </AdminButton>
            <AdminButton
              variant="danger"
              size="sm"
              disabled={bulkBusy}
              onClick={() => setDeleteTarget({ mode: 'bulk', ids: [...selected] })}
              icon={<Trash2 size={13} />}
            >
              Delete
            </AdminButton>
          </div>
        </div>
      )}

      {/* Quick View Drawer */}
      <PromptDetailDrawer
        prompt={inspectPrompt}
        open={Boolean(inspectPrompt)}
        onClose={() => setInspectPrompt(null)}
        onToggle={handleToggle}
        onDeleteRequest={(p) => setDeleteTarget({ mode: 'single', prompt: p })}
        togglingKey={togglingKey}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        variant="danger"
        confirmLabel={
          deleteTarget?.mode === 'bulk'
            ? `Delete ${deleteTarget.ids.length} prompts`
            : 'Delete prompt'
        }
        title={
          deleteTarget?.mode === 'bulk'
            ? `Delete ${deleteTarget.ids.length} selected prompts?`
            : 'Delete this prompt?'
        }
        description={
          deleteTarget?.mode === 'bulk'
            ? 'All selected prompts will be permanently removed from the database and public gallery. This action cannot be undone.'
            : 'This prompt will be permanently removed from the database and public gallery. This action cannot be undone.'
        }
      />
    </div>
  );
}

function PaginationBar({
  page,
  pages,
  limit,
  total,
  onPageChange,
}: {
  page: number;
  pages: number;
  limit: number;
  total: number;
  onPageChange: (nextPage: number) => void;
}) {
  if (total === 0) return null;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div
      className="flex items-center justify-between px-4 py-3 flex-wrap gap-3"
      style={{
        borderTop: '1px solid var(--adm-border)',
        backgroundColor: 'var(--adm-surface-muted)',
      }}
    >
      <span className="text-[12px] tabular-nums" style={{ color: 'var(--adm-text-muted)' }}>
        Showing <strong style={{ color: 'var(--adm-text)' }}>{start.toLocaleString()}</strong>–
        <strong style={{ color: 'var(--adm-text)' }}>{end.toLocaleString()}</strong> of{' '}
        <strong style={{ color: 'var(--adm-text)' }}>{total.toLocaleString()}</strong>
      </span>
      <div className="flex items-center gap-1.5">
        <AdminButton
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          aria-label="Previous page"
          icon={<ChevronLeft size={14} />}
        >
          Prev
        </AdminButton>
        <span className="text-[12px] font-medium px-2.5 tabular-nums" style={{ color: 'var(--adm-text)' }}>
          {page} / {pages}
        </span>
        <AdminButton
          variant="outline"
          size="sm"
          disabled={page >= pages}
          onClick={() => onPageChange(Math.min(pages, page + 1))}
          aria-label="Next page"
        >
          Next
          <ChevronRight size={14} />
        </AdminButton>
      </div>
    </div>
  );
}

export default function PromptsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-4">
          <div className="h-10 w-48 rounded-xl admin-skeleton" />
          <div className="h-28 rounded-2xl admin-skeleton" />
          <div className="h-96 rounded-2xl admin-skeleton" />
        </div>
      }
    >
      <PromptsManagerContent />
    </Suspense>
  );
}
