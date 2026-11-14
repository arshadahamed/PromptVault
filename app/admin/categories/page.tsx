'use client';
import { useEffect, useId, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Plus, Pencil, Trash2, Check, X, Tag, Search, ExternalLink, Loader2,
} from 'lucide-react';
import type { DbCategory } from '@/lib/db';
import {
  AdminBadge, AdminButton, AdminCard, AdminEmptyState, AdminErrorState,
  AdminFormField, AdminInput, AdminPageHeader, AdminSectionHeader,
} from '@/components/admin/ui/Primitives';
import { ConfirmDialog } from '@/components/admin/ui/Dialog';
import { useToast } from '@/components/admin/ui/ToastProvider';

interface CategoryWithCount extends DbCategory {
  promptCount?: number;
}

export default function CategoriesPage() {
  const { toast } = useToast();
  const newCatInputId = useId();

  const [cats, setCats] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadTick, setReloadTick] = useState(0);

  const [filter, setFilter] = useState('');
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<CategoryWithCount | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/admin/categories?withCounts=1', { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load categories');
        return res.json() as Promise<CategoryWithCount[]>;
      })
      .then((data) => {
        setCats(Array.isArray(data) ? data : []);
        setError('');
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          setError(err instanceof Error ? err.message : 'Unable to load categories');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [reloadTick]);

  const filteredCats = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return cats;
    return cats.filter((c) => c.name.toLowerCase().includes(q));
  }, [cats, filter]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setAddError('Category name is required.');
      return;
    }
    if (trimmed.length > 80) {
      setAddError('Category name must be 80 characters or fewer.');
      return;
    }
    if (cats.some((c) => c.name.trim().toLowerCase() === trimmed.toLowerCase())) {
      setAddError(`"${trimmed}" already exists.`);
      return;
    }

    setAddError('');
    setAdding(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to add category');
      setNewName('');
      toast({ title: `Category "${trimmed}" added`, variant: 'success' });
      setReloadTick((n) => n + 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add category';
      setAddError(msg);
      toast({ title: 'Could not add category', description: msg, variant: 'error' });
    } finally {
      setAdding(false);
    }
  }

  async function saveEdit(id: string) {
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditError('Name cannot be empty.');
      return;
    }
    if (cats.some((c) => c.id !== id && c.name.trim().toLowerCase() === trimmed.toLowerCase())) {
      setEditError(`"${trimmed}" already exists.`);
      return;
    }

    setEditError('');
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update category');
      setEditId(null);
      toast({ title: 'Category renamed', variant: 'success' });
      setReloadTick((n) => n + 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update category';
      setEditError(msg);
    } finally {
      setSavingEdit(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/categories/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete category');
      toast({ title: `Deleted "${deleteTarget.name}"`, variant: 'success' });
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <AdminPageHeader
        title="Categories"
        description="Organize prompt categories available in forms and gallery filtering."
        badge={<AdminBadge variant="neutral">{cats.length} total</AdminBadge>}
      />

      {error && (
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* Category List Card */}
        <AdminCard padding="none" className="overflow-hidden">
          <div
            className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap"
            style={{ borderBottom: '1px solid var(--adm-border)' }}
          >
            <h2 className="text-[14px] font-semibold" style={{ color: 'var(--adm-text)' }}>
              All Categories
            </h2>
            <div className="relative w-full sm:w-56">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--adm-text-subtle)' }}
              />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter categories…"
                aria-label="Filter categories"
                className="admin-control w-full pl-8 pr-3 py-1.5 text-[12.5px]"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-5 flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 rounded-xl admin-skeleton" />
              ))}
            </div>
          ) : filteredCats.length === 0 ? (
            <AdminEmptyState
              icon={Tag}
              title={filter ? 'No matching categories' : 'No categories yet'}
              description={
                filter
                  ? 'Try clearing your search filter.'
                  : 'Create your first category using the form on the right.'
              }
              action={
                filter ? (
                  <AdminButton variant="outline" size="sm" onClick={() => setFilter('')}>
                    Clear filter
                  </AdminButton>
                ) : null
              }
            />
          ) : (
            <ul>
              {filteredCats.map((cat, idx) => {
                const isEditing = editId === cat.id;
                const count = cat.promptCount ?? 0;

                return (
                  <li
                    key={cat.id}
                    className="px-5 py-3.5 transition-colors"
                    style={{
                      borderBottom: idx < filteredCats.length - 1 ? '1px solid var(--adm-border-subtle)' : 'none',
                    }}
                  >
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            value={editName}
                            onChange={(e) => {
                              setEditName(e.target.value);
                              setEditError('');
                            }}
                            aria-label="Edit category name"
                            aria-invalid={Boolean(editError)}
                            className="admin-control flex-1 px-3 py-1.5 text-[13px]"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                void saveEdit(cat.id);
                              }
                              if (e.key === 'Escape') {
                                setEditId(null);
                                setEditError('');
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => void saveEdit(cat.id)}
                            disabled={savingEdit}
                            aria-label="Save category name"
                            className="p-2 rounded-lg cursor-pointer disabled:opacity-50"
                            style={{
                              backgroundColor: 'var(--adm-success-bg)',
                              color: 'var(--adm-success-text)',
                            }}
                          >
                            {savingEdit ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditId(null);
                              setEditError('');
                            }}
                            disabled={savingEdit}
                            aria-label="Cancel editing"
                            className="p-2 rounded-lg cursor-pointer"
                            style={{
                              backgroundColor: 'var(--adm-surface-muted)',
                              color: 'var(--adm-text-muted)',
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                        {editError && (
                          <p role="alert" className="text-[12px] font-medium" style={{ color: 'var(--adm-danger-text)' }}>
                            {editError}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: 'var(--adm-accent)' }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13.5px] font-medium truncate" style={{ color: 'var(--adm-text)' }}>
                            {cat.name}
                          </p>
                          <p className="text-[11px] mt-0.5 tabular-nums" style={{ color: 'var(--adm-text-subtle)' }}>
                            Created {cat.createdAt?.slice(0, 10) || '—'}
                          </p>
                        </div>

                        <Link
                          href={`/admin/prompts?category=${encodeURIComponent(cat.name)}`}
                          title="View prompts in this category"
                          className="inline-flex items-center gap-1 group"
                        >
                          <AdminBadge variant={count > 0 ? 'accent' : 'neutral'} className="tabular-nums">
                            {count.toLocaleString()} prompts
                            <ExternalLink size={10} className="opacity-60 group-hover:opacity-100" />
                          </AdminBadge>
                        </Link>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditId(cat.id);
                              setEditName(cat.name);
                              setEditError('');
                            }}
                            aria-label={`Rename ${cat.name}`}
                            title="Rename category"
                            className="p-1.5 rounded-lg cursor-pointer transition-colors"
                            style={{ color: 'var(--adm-text-muted)' }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(cat)}
                            aria-label={`Delete ${cat.name}`}
                            title="Delete category"
                            className="p-1.5 rounded-lg cursor-pointer transition-colors"
                            style={{ color: 'var(--adm-danger-text)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </AdminCard>

        {/* Add Category Card */}
        <AdminCard padding="lg">
          <AdminSectionHeader
            icon={Plus}
            title="Add Category"
            description="Create a new classification tag for prompt forms."
          />

          <form onSubmit={handleAdd} noValidate className="flex flex-col gap-4">
            <AdminFormField
              label="Category Name"
              htmlFor={newCatInputId}
              required
              error={addError}
              hint="Must be unique (up to 80 characters)."
            >
              <AdminInput
                id={newCatInputId}
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (addError) setAddError('');
                }}
                placeholder="e.g. Architecture"
                maxLength={80}
                aria-invalid={Boolean(addError)}
              />
            </AdminFormField>

            <AdminButton
              type="submit"
              variant="primary"
              size="md"
              loading={adding}
              icon={<Plus size={14} />}
              className="w-full"
            >
              Add Category
            </AdminButton>
          </form>

          <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--adm-border)' }}>
            <p className="text-[12px] leading-relaxed" style={{ color: 'var(--adm-text-subtle)' }}>
              Categories help organize prompts in the admin form and category filters. Clicking any prompt count badge above opens matching prompts.
            </p>
          </div>
        </AdminCard>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        variant="danger"
        title={`Delete category "${deleteTarget?.name}"?`}
        description={
          deleteTarget && (deleteTarget.promptCount ?? 0) > 0
            ? `${deleteTarget.promptCount?.toLocaleString()} existing prompt(s) currently reference this category. Removing it from the category list will not delete those prompts, but it will no longer appear in category selectors.`
            : 'This category will be permanently removed from the categories list.'
        }
        confirmLabel="Delete category"
      />
    </div>
  );
}
