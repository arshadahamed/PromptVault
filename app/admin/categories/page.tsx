'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, Tag } from 'lucide-react';
import { useAdminTheme, tk } from '@/context/AdminThemeContext';

export default function CategoriesPage() {
  const { resolved } = useAdminTheme();
  const t = tk(resolved);
  const dark = resolved === 'dark';

  const [cats, setCats]       = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [editId, setEditId]   = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch('/api/admin/categories');
    setCats(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    });
    setNewName('');
    load();
  }

  async function saveEdit(id: string) {
    await fetch(`/api/admin/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName }),
    });
    setEditId(null);
    load();
  }

  async function del(id: string, name: string) {
    if (!confirm(`Delete category "${name}"?`)) return;
    await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
    load();
  }

  const card = {
    background: dark ? 'rgba(255,255,255,0.03)' : '#ffffff',
    border: `1px solid ${t.cardBorder}`,
    borderRadius: '16px',
  };

  const inp = {
    background: t.input,
    border: `1px solid ${t.inputBorder}`,
    color: t.text,
    borderRadius: '10px',
    fontSize: '13px',
    outline: 'none',
    padding: '10px 14px',
    width: '100%',
    transition: 'border-color 0.15s',
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}>
          <Tag size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: t.text }}>Categories</h1>
          <p className="text-[13px]" style={{ color: t.textMuted }}>Manage prompt categories used in the gallery</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Category list ── */}
        <div style={card} className="overflow-hidden">
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${t.divider}` }}>
            <h2 className="font-semibold text-[14px]" style={{ color: t.text }}>
              {cats.length} {cats.length === 1 ? 'Category' : 'Categories'}
            </h2>
          </div>

          {loading ? (
            <div className="p-5 text-[13px]" style={{ color: t.textMuted }}>Loading…</div>
          ) : cats.length === 0 ? (
            <div className="p-8 flex flex-col items-center gap-2 text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-1"
                style={{ background: t.accentMuted, border: `1px solid ${t.accentBorder}` }}>
                <Tag size={16} style={{ color: t.accent }} />
              </div>
              <p className="text-[13px] font-medium" style={{ color: t.textMuted }}>No categories yet</p>
              <p className="text-[12px]" style={{ color: t.textSub }}>Add one using the form.</p>
            </div>
          ) : (
            <ul>
              {cats.map((cat, i) => (
                <li key={cat.id}
                  className="px-5 py-3 flex items-center gap-3 transition-colors"
                  style={{
                    borderBottom: i < cats.length - 1 ? `1px solid ${t.divider}` : 'none',
                  }}>
                  {editId === cat.id ? (
                    <>
                      <input
                        autoFocus value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={{ ...inp, padding: '6px 10px', flex: 1 }}
                        onFocus={(e) => (e.target.style.borderColor = t.inputFocus)}
                        onBlur={(e) => (e.target.style.borderColor = t.inputBorder)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(cat.id);
                          if (e.key === 'Escape') setEditId(null);
                        }}
                      />
                      <button onClick={() => saveEdit(cat.id)}
                        className="p-1.5 rounded-lg cursor-pointer transition-colors"
                        style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)' }}>
                        <Check size={13} />
                      </button>
                      <button onClick={() => setEditId(null)}
                        className="p-1.5 rounded-lg cursor-pointer transition-colors"
                        style={{ color: t.textMuted, background: t.input }}>
                        <X size={13} />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: t.accent }} />
                      <span className="flex-1 text-[13px] font-medium" style={{ color: t.text }}>{cat.name}</span>
                      <span className="text-[11px] mr-2" style={{ color: t.textSub }}>{cat.createdAt?.slice(0, 10)}</span>
                      <button
                        onClick={() => { setEditId(cat.id); setEditName(cat.name); }}
                        className="p-1.5 rounded-lg cursor-pointer transition-all"
                        style={{ color: t.textMuted }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = t.accent; e.currentTarget.style.background = t.accentMuted; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.background = 'transparent'; }}>
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => del(cat.id, cat.name)}
                        className="p-1.5 rounded-lg cursor-pointer transition-all"
                        style={{ color: t.textMuted }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.background = 'transparent'; }}>
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Add form ── */}
        <div style={{ ...card, padding: '24px' }} className="h-fit">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <Plus size={13} style={{ color: '#7c3aed' }} />
            </div>
            <span className="text-[14px] font-semibold" style={{ color: t.text }}>Add New Category</span>
          </div>

          <form onSubmit={add} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: t.textSub }}>
                Category Name
              </span>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Architecture"
                style={inp}
                onFocus={(e) => (e.target.style.borderColor = t.inputFocus)}
                onBlur={(e) => (e.target.style.borderColor = t.inputBorder)}
              />
            </label>

            <button type="submit"
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold text-white cursor-pointer transition-all"
              style={{
                background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
              }}>
              <Plus size={14} /> Add Category
            </button>
          </form>

          <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${t.divider}` }}>
            <p className="text-[11px]" style={{ color: t.textSub }}>
              Categories are used to filter and organize prompts in the gallery sidebar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
