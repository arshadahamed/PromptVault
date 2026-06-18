'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Link as LinkIcon, Check, Loader2, Image as ImageIcon, Type, Cpu, User, BarChart2, Palette } from 'lucide-react';
import { useAdminTheme, tk } from '@/context/AdminThemeContext';

const MODELS = ['ChatGPT','Nanobanana Pro','Nanobanana 2','Seedance 2.0','Midjourney','DALL-E','Flux','Stable Diffusion','Adobe Firefly','Leonardo AI','Gemini'];
const TABS   = ['ChatGPT','Nanobanana','Seedance','Midjourney','DALL-E','Flux','Stable Diffusion','Adobe Firefly','Leonardo AI','Gemini'];
const ASPECTS = ['4/3','16/9','1/1','9/16','3/4','2/3'];
const CATEGORIES = ['ChatGPT','Midjourney','Nanobanana','Seedance','DALL-E','Flux','Stable Diffusion','Adobe Firefly','Leonardo AI','Gemini'];

interface Props { initial?: any; mode: 'create' | 'edit'; }

export function PromptForm({ initial, mode }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const { resolved } = useAdminTheme();
  const t = tk(resolved);
  const dark = resolved === 'dark';

  const [imgTab, setImgTab] = useState<'upload' | 'url'>('upload');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [charCount, setCharCount] = useState((initial?.promptText || '').length);

  const [form, setForm] = useState({
    promptText:   initial?.promptText   || '',
    imageUrl:     initial?.imageUrl     || '',
    localImg:     initial?.localImg     || '',
    authorName:   initial?.authorName   || '',
    handle:       initial?.handle       || '',
    model:        initial?.model        || 'ChatGPT',
    tab:          initial?.tab          || 'ChatGPT',
    category:     initial?.category     || 'ChatGPT',
    likes:        initial?.likes        ?? 0,
    views:        initial?.views        ?? 0,
    gradientFrom: initial?.gradientFrom || '#b4d4f5',
    gradientTo:   initial?.gradientTo   || '#f5d4b4',
    aspectRatio:  initial?.aspectRatio  || '4/3',
  });

  function set(key: string, value: any) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function uploadFile(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.localImg) set('localImg', data.localImg);
    setUploading(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.promptText.trim()) { setError('Prompt text is required'); return; }
    setSaving(true); setError('');
    const url    = mode === 'create' ? '/api/admin/prompts' : `/api/admin/prompts/${initial.id}`;
    const method = mode === 'create' ? 'POST' : 'PUT';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSaving(false);
    if (!res.ok) { setError('Failed to save. Please try again.'); return; }
    setSaved(true);
    setTimeout(() => router.push('/admin/prompts'), 800);
  }

  const preview = form.localImg || form.imageUrl;

  // Theme-aware styles
  const cardStyle = {
    background: dark ? 'rgba(255,255,255,0.03)' : '#ffffff',
    border: `1px solid ${t.cardBorder}`,
    borderRadius: '16px',
  };
  const inputStyle = {
    background: t.input,
    border: `1px solid ${t.inputBorder}`,
    color: t.text,
    borderRadius: '10px',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    padding: '10px 14px',
    transition: 'border-color 0.15s',
  };
  const labelStyle = {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    color: t.textSub,
    marginBottom: '6px',
    display: 'block',
  };

  return (
    <form onSubmit={save}>
      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">

        {/* ── Left column ─────────────────────────── */}
        <div className="flex flex-col gap-5">

          {/* Image preview card */}
          <div style={cardStyle} className="p-5">
            <SectionHeader icon={ImageIcon} label="Image" t={t} />

            {/* Preview */}
            <div className="w-full rounded-xl overflow-hidden mb-4 relative group"
              style={{
                aspectRatio: form.aspectRatio.replace('/', '/'),
                background: `linear-gradient(135deg, ${form.gradientFrom}, ${form.gradientTo})`,
                minHeight: '180px',
              }}>
              {preview
                ? <img src={preview} alt="" className="w-full h-full object-cover" />
                : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <ImageIcon size={28} style={{ color: t.textSub }} />
                    <span className="text-[11px]" style={{ color: t.textSub }}>No image selected</span>
                  </div>
                )
              }
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 p-1 rounded-xl mb-3"
              style={{ background: dark ? 'rgba(255,255,255,0.04)' : '#f3f4f6' }}>
              {(['upload', 'url'] as const).map((tab) => (
                <button key={tab} type="button" onClick={() => setImgTab(tab)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-[12px] font-medium transition-all cursor-pointer"
                  style={{
                    background: imgTab === tab ? (dark ? 'rgba(124,58,237,0.2)' : '#ffffff') : 'transparent',
                    color: imgTab === tab ? t.accent : t.textMuted,
                    boxShadow: imgTab === tab && !dark ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  }}>
                  {tab === 'upload' ? <><Upload size={12} />Upload</> : <><LinkIcon size={12} />URL</>}
                </button>
              ))}
            </div>

            {imgTab === 'upload' ? (
              <>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="w-full py-3 rounded-xl border-2 border-dashed text-[12px] font-medium transition-all cursor-pointer flex items-center justify-center gap-2"
                  style={{
                    borderColor: uploading ? t.accent : t.cardBorder,
                    color: uploading ? t.accent : t.textMuted,
                    background: uploading ? t.accentMuted : 'transparent',
                  }}>
                  {uploading
                    ? <><Loader2 size={13} className="animate-spin" />Uploading…</>
                    : <><Upload size={13} />Choose image file</>}
                </button>
              </>
            ) : (
              <input value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)}
                placeholder="https://images.meigen.ai/…"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = t.inputFocus)}
                onBlur={(e) => (e.target.style.borderColor = t.inputBorder)} />
            )}
          </div>

          {/* Style card */}
          <div style={cardStyle} className="p-5">
            <SectionHeader icon={Palette} label="Style" t={t} />

            <div className="grid grid-cols-2 gap-3 mb-3">
              {(['gradientFrom', 'gradientTo'] as const).map((key) => (
                <label key={key} className="flex flex-col gap-1.5">
                  <span style={labelStyle}>{key === 'gradientFrom' ? 'From' : 'To'}</span>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-[10px] transition-all"
                    style={{ background: t.input, border: `1px solid ${t.cardBorder}` }}>
                    <input type="color" value={form[key]} onChange={(e) => set(key, e.target.value)}
                      className="w-6 h-6 rounded-md cursor-pointer border-0 p-0 bg-transparent"
                      style={{ minWidth: 24 }} />
                    <span className="text-[11px] font-mono" style={{ color: t.textMuted }}>{form[key]}</span>
                  </div>
                </label>
              ))}
            </div>

            <label className="flex flex-col gap-1.5">
              <span style={labelStyle}>Aspect Ratio</span>
              <select value={form.aspectRatio} onChange={(e) => set('aspectRatio', e.target.value)}
                style={{ ...inputStyle }}
                onFocus={(e) => (e.target.style.borderColor = t.inputFocus)}
                onBlur={(e) => (e.target.style.borderColor = t.inputBorder)}>
                {ASPECTS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </label>
          </div>
        </div>

        {/* ── Right column ────────────────────────── */}
        <div className="flex flex-col gap-5">

          {/* Prompt text card */}
          <div style={cardStyle} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionHeader icon={Type} label="Prompt Text" t={t} />
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md"
                style={{ background: t.badge, color: t.badgeText }}>
                {charCount} chars
              </span>
            </div>
            <textarea
              value={form.promptText}
              onChange={(e) => { set('promptText', e.target.value); setCharCount(e.target.value.length); }}
              rows={10}
              placeholder="Enter the full AI prompt text here…"
              className="w-full resize-y font-mono leading-relaxed text-[13px] outline-none transition-all"
              style={{
                ...inputStyle,
                padding: '12px 14px',
                minHeight: '200px',
              }}
              onFocus={(e) => (e.target.style.borderColor = t.inputFocus)}
              onBlur={(e) => (e.target.style.borderColor = t.inputBorder)}
            />
          </div>

          {/* Classification card */}
          <div style={cardStyle} className="p-5">
            <SectionHeader icon={Cpu} label="Classification" t={t} />
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Model" style={labelStyle}>
                <select value={form.model}
                  onChange={(e) => {
                    const m = e.target.value;
                    const tabMap: Record<string,string> = {
                      'Seedance 2.0':'Seedance', 'Midjourney':'Midjourney',
                      'DALL-E':'DALL-E', 'Flux':'Flux', 'Stable Diffusion':'Stable Diffusion',
                      'Adobe Firefly':'Adobe Firefly', 'Leonardo AI':'Leonardo AI',
                      'Gemini':'Gemini', 'Nanobanana Pro':'Nanobanana', 'Nanobanana 2':'Nanobanana',
                    };
                    set('model', m);
                    set('tab', tabMap[m] || 'ChatGPT');
                    set('category', tabMap[m] || 'ChatGPT');
                  }}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = t.inputFocus)}
                  onBlur={(e) => (e.target.style.borderColor = t.inputBorder)}>
                  {MODELS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </FormField>

              <FormField label="Tab" style={labelStyle}>
                <select value={form.tab} onChange={(e) => set('tab', e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = t.inputFocus)}
                  onBlur={(e) => (e.target.style.borderColor = t.inputBorder)}>
                  {TABS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </FormField>

              <FormField label="Category" style={labelStyle}>
                <select value={form.category} onChange={(e) => set('category', e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = t.inputFocus)}
                  onBlur={(e) => (e.target.style.borderColor = t.inputBorder)}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </FormField>
            </div>
          </div>

          {/* Author card */}
          <div style={cardStyle} className="p-5">
            <SectionHeader icon={User} label="Author" t={t} />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Name" style={labelStyle}>
                <input value={form.authorName} onChange={(e) => set('authorName', e.target.value)}
                  placeholder="e.g. Sairah" style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = t.inputFocus)}
                  onBlur={(e) => (e.target.style.borderColor = t.inputBorder)} />
              </FormField>
              <FormField label="Handle" style={labelStyle}>
                <input value={form.handle} onChange={(e) => set('handle', e.target.value)}
                  placeholder="@username" style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = t.inputFocus)}
                  onBlur={(e) => (e.target.style.borderColor = t.inputBorder)} />
              </FormField>
            </div>
          </div>

          {/* Stats card */}
          <div style={cardStyle} className="p-5">
            <SectionHeader icon={BarChart2} label="Stats" t={t} />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Likes" style={labelStyle}>
                <input type="number" min={0} value={form.likes}
                  onChange={(e) => set('likes', parseInt(e.target.value) || 0)}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = t.inputFocus)}
                  onBlur={(e) => (e.target.style.borderColor = t.inputBorder)} />
              </FormField>
              <FormField label="Views" style={labelStyle}>
                <input type="number" min={0} value={form.views}
                  onChange={(e) => set('views', parseInt(e.target.value) || 0)}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = t.inputFocus)}
                  onBlur={(e) => (e.target.style.borderColor = t.inputBorder)} />
              </FormField>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 rounded-xl text-[13px]"
              style={{ background: t.danger, border: `1px solid ${t.dangerBorder}`, color: t.dangerText }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={saving || saved}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-semibold text-white transition-all disabled:opacity-60 cursor-pointer"
              style={{
                background: saved
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                boxShadow: saved ? '0 4px 20px rgba(16,185,129,0.35)' : '0 4px 20px rgba(124,58,237,0.35)',
              }}>
              {saved   ? <><Check size={14} />Saved!</>
               : saving ? <><Loader2 size={14} className="animate-spin" />Saving…</>
               : mode === 'create' ? 'Create Prompt' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => router.push('/admin/prompts')}
              className="px-6 py-3 rounded-xl text-[13px] font-semibold transition-all cursor-pointer"
              style={{
                background: t.card,
                border: `1px solid ${t.cardBorder}`,
                color: t.textMuted,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = t.text)}
              onMouseLeave={(e) => (e.currentTarget.style.color = t.textMuted)}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function SectionHeader({ icon: Icon, label, t }: { icon: any; label: string; t: any }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>
        <Icon size={13} style={{ color: '#7c3aed' }} />
      </div>
      <span className="text-[13px] font-semibold" style={{ color: t.text }}>{label}</span>
    </div>
  );
}

function FormField({ label, children, style }: { label: string; children: React.ReactNode; style: any }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span style={style}>{label}</span>
      {children}
    </label>
  );
}
