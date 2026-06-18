'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Pencil, Trash2, Heart, Eye as EyeIcon, ChevronLeft, ChevronRight,
  Star, EyeOff, Loader2, CheckSquare, Square, Minus,
} from 'lucide-react';
import { useAdminTheme, tk } from '@/context/AdminThemeContext';

const MODELS = ['ChatGPT','GPT Image','Nanobanana Pro','Nanobanana 2','Seedance 2.0','Midjourney','DALL-E','Flux','Stable Diffusion','Adobe Firefly','Gemini','Leonardo AI'];

export default function PromptsPage() {
  const { resolved } = useAdminTheme();
  const t = tk(resolved);
  const dark = resolved === 'dark';

  const [items, setItems]       = useState<any[]>([]);
  const [total, setTotal]       = useState(0);
  const [q, setQ]               = useState('');
  const [model, setModel]       = useState('');
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDel, setBulkDel]   = useState(false);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    const p = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q) p.set('q', q);
    if (model) p.set('model', model);
    const res = await fetch(`/api/admin/prompts?${p}`);
    const data = await res.json();
    setItems(data.items);
    setTotal(data.total);
    setLoading(false);
  }, [q, model, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [q, model]);

  async function del(id: string) {
    if (!confirm('Delete this prompt? This cannot be undone.')) return;
    setDeleting(id);
    await fetch(`/api/admin/prompts/${id}`, { method: 'DELETE' });
    await load();
    setDeleting(null);
  }

  async function toggle(id: string, field: 'featured' | 'published', val: boolean) {
    setToggling(id + field);
    await fetch(`/api/admin/prompts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: val }),
    });
    setItems((prev) => prev.map((p) => p.id === id ? { ...p, [field]: val } : p));
    setToggling(null);
  }

  async function bulkDelete() {
    const ids = [...selected];
    if (!confirm(`Delete ${ids.length} prompt${ids.length > 1 ? 's' : ''}? This cannot be undone.`)) return;
    setBulkDel(true);
    await fetch('/api/admin/prompts/bulk', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    await load();
    setBulkDel(false);
  }

  const pages = Math.ceil(total / limit);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleAll() {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((p) => p.id)));
  }
  const allSelected = items.length > 0 && selected.size === items.length;
  const someSelected = selected.size > 0 && selected.size < items.length;

  const inp = {
    background: t.input, border: `1px solid ${t.inputBorder}`, color: t.text,
    borderRadius: '10px', fontSize: '13px', outline: 'none',
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: t.text }}>Prompts</h1>
          <p className="text-[13px] mt-0.5" style={{ color: t.textMuted }}>{total.toLocaleString()} total prompts</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button onClick={bulkDelete} disabled={bulkDel}
              className="flex items-center gap-2 px-3 py-2 rounded-[10px] text-[13px] font-semibold transition-all cursor-pointer disabled:opacity-50"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
              {bulkDel ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              Delete {selected.size}
            </button>
          )}
          <Link href="/admin/prompts/new"
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}>
            <Plus size={14} /> Add Prompt
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
          <input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search prompts…"
            className="w-full pl-9 pr-3 py-2"
            style={inp}
            onFocus={(e) => (e.target.style.borderColor = t.inputFocus)}
            onBlur={(e) => (e.target.style.borderColor = t.inputBorder)} />
        </div>
        <select value={model} onChange={(e) => setModel(e.target.value)}
          className="px-3 py-2"
          style={{ ...inp, paddingLeft: '12px' }}>
          <option value="">All Models</option>
          {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${t.cardBorder}`, background: t.card }}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.divider}`, background: dark ? 'rgba(255,255,255,0.02)' : '#f9fafb' }}>
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleAll} className="flex items-center justify-center cursor-pointer" style={{ color: t.textMuted }}>
                    {allSelected ? <CheckSquare size={15} style={{ color: t.accent }} />
                      : someSelected ? <Minus size={15} style={{ color: t.accent }} />
                      : <Square size={15} />}
                  </button>
                </th>
                {['Image','Prompt','Model','Author','Stats','Date','Actions'].map((h) => (
                  <th key={h} className="text-left px-3 py-3 font-semibold text-[11px] uppercase tracking-wider"
                    style={{ color: t.textSub }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${t.divider}` }}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-3 py-3">
                        <div className="h-4 rounded animate-pulse" style={{ background: t.cardBorder }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16" style={{ color: t.textMuted }}>
                    No prompts found.
                  </td>
                </tr>
              ) : items.map((p) => {
                const isSel = selected.has(p.id);
                const isPublished = p.published !== false;
                const isFeatured = p.featured === true;
                return (
                  <tr key={p.id}
                    style={{
                      borderBottom: `1px solid ${t.divider}`,
                      background: isSel ? (dark ? 'rgba(124,58,237,0.08)' : 'rgba(124,58,237,0.04)') : 'transparent',
                      opacity: isPublished ? 1 : 0.6,
                    }}>
                    {/* Checkbox */}
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelect(p.id)} className="flex items-center justify-center cursor-pointer"
                        style={{ color: isSel ? t.accent : t.textMuted }}>
                        {isSel ? <CheckSquare size={15} /> : <Square size={15} />}
                      </button>
                    </td>

                    {/* Image */}
                    <td className="px-3 py-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0"
                        style={{ background: `linear-gradient(135deg,${p.gradientFrom},${p.gradientTo})` }}>
                        {p.localImg && <img src={p.localImg} alt="" className="w-full h-full object-cover" />}
                      </div>
                    </td>

                    {/* Prompt text */}
                    <td className="px-3 py-3 max-w-[260px]">
                      <p className="font-medium line-clamp-2 leading-snug text-[12px]" style={{ color: t.text }}>
                        {p.promptText.slice(0, 100)}{p.promptText.length > 100 ? '…' : ''}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: t.textSub }}>{p.category}</p>
                    </td>

                    {/* Model */}
                    <td className="px-3 py-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium"
                        style={{ background: t.accentMuted, color: t.accentText, border: `1px solid ${t.accentBorder}` }}>
                        {p.model}
                      </span>
                    </td>

                    {/* Author */}
                    <td className="px-3 py-3">
                      <p className="text-[12px] truncate max-w-[90px]" style={{ color: t.text }}>{p.authorName}</p>
                      <p className="text-[10px]" style={{ color: t.textSub }}>{p.handle}</p>
                    </td>

                    {/* Stats */}
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-0.5 text-[11px]" style={{ color: t.textMuted }}>
                        <span className="flex items-center gap-1"><Heart size={10} />{p.likes}</span>
                        <span className="flex items-center gap-1"><EyeIcon size={10} />{p.views}</span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-3 py-3 text-[11px]" style={{ color: t.textSub }}>{p.createdAt?.slice(0, 10)}</td>

                    {/* Actions */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-0.5">
                        {/* Featured star */}
                        <button
                          onClick={() => toggle(p.id, 'featured', !isFeatured)}
                          disabled={toggling === p.id + 'featured'}
                          title={isFeatured ? 'Unfeature' : 'Feature'}
                          className="p-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-40"
                          style={{ color: isFeatured ? '#f59e0b' : t.textMuted, background: isFeatured ? 'rgba(245,158,11,0.1)' : 'transparent' }}>
                          <Star size={13} fill={isFeatured ? 'currentColor' : 'none'} />
                        </button>

                        {/* Published eye */}
                        <button
                          onClick={() => toggle(p.id, 'published', !isPublished)}
                          disabled={toggling === p.id + 'published'}
                          title={isPublished ? 'Unpublish (hide from gallery)' : 'Publish'}
                          className="p-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-40"
                          style={{ color: isPublished ? t.textMuted : '#ef4444', background: isPublished ? 'transparent' : 'rgba(239,68,68,0.08)' }}>
                          {isPublished ? <EyeIcon size={13} /> : <EyeOff size={13} />}
                        </button>

                        {/* Edit */}
                        <Link href={`/admin/prompts/${p.id}/edit`}
                          className="p-1.5 rounded-lg transition-all"
                          style={{ color: t.textMuted }}>
                          <Pencil size={13} />
                        </Link>

                        {/* Delete */}
                        <button
                          onClick={() => del(p.id)}
                          disabled={deleting === p.id}
                          className="p-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-40"
                          style={{ color: t.textMuted }}>
                          {deleting === p.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: `1px solid ${t.divider}`, background: dark ? 'rgba(255,255,255,0.015)' : '#f9fafb' }}>
            <span className="text-[12px]" style={{ color: t.textMuted }}>
              {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total.toLocaleString()}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-40"
                style={{ color: t.textMuted, background: t.input }}>
                <ChevronLeft size={14} />
              </button>
              <span className="text-[12px] font-medium px-3" style={{ color: t.text }}>{page} / {pages}</span>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
                className="p-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-40"
                style={{ color: t.textMuted, background: t.input }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3">
        {[
          { icon: <Star size={11} fill="#f59e0b" style={{ color: '#f59e0b' }} />, label: 'Featured — appears first in gallery' },
          { icon: <EyeOff size={11} style={{ color: '#ef4444' }} />, label: 'Hidden — not shown in gallery' },
        ].map(({ icon, label }) => (
          <span key={label} className="flex items-center gap-1.5 text-[11px]" style={{ color: t.textSub }}>
            {icon} {label}
          </span>
        ))}
      </div>
    </div>
  );
}
