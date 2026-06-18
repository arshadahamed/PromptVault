'use client';
import { useRef, useState } from 'react';
import { Download, Upload, FileJson, FileText, CheckCircle2, AlertCircle, Loader2, Database } from 'lucide-react';
import { useAdminTheme, tk } from '@/context/AdminThemeContext';

export default function ImportExportPage() {
  const { resolved } = useAdminTheme();
  const t = tk(resolved);
  const dark = resolved === 'dark';
  const fileRef = useRef<HTMLInputElement>(null);

  const [importing, setImporting]   = useState(false);
  const [importResult, setImportResult] = useState<{ added: number; skipped: number; total: number } | null>(null);
  const [importError, setImportError]   = useState('');
  const [preview, setPreview]       = useState<{ count: number; file: File } | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setImportResult(null); setImportError('');
    const file = e.target.files?.[0];
    if (!file) { setPreview(null); return; }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const arr = parsed.prompts || (Array.isArray(parsed) ? parsed : []);
      setPreview({ count: arr.length, file });
    } catch {
      setImportError('Invalid JSON file. Please upload a valid export file.');
      setPreview(null);
    }
  }

  async function runImport() {
    if (!preview) return;
    setImporting(true); setImportResult(null); setImportError('');
    try {
      const text = await preview.file.text();
      const parsed = JSON.parse(text);
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setImportResult(data);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err: any) {
      setImportError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  function exportData(format: 'json' | 'csv') {
    window.location.href = `/api/admin/export?format=${format}`;
  }

  const card = { background: dark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: `1px solid ${t.cardBorder}`, borderRadius: '16px' };

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}>
          <Database size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: t.text }}>Import & Export</h1>
          <p className="text-[13px]" style={{ color: t.textMuted }}>Back up your prompts or import a dataset</p>
        </div>
      </div>

      {/* ── Export ── */}
      <div className="p-6 mb-6" style={card}>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <Download size={13} style={{ color: '#7c3aed' }} />
          </div>
          <span className="text-[14px] font-semibold" style={{ color: t.text }}>Export Data</span>
        </div>

        <p className="text-[13px] mb-5" style={{ color: t.textMuted }}>
          Download all prompts for backup or migration. JSON includes all fields; CSV is spreadsheet-friendly.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => exportData('json')}
            className="flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-[13px] cursor-pointer transition-all"
            style={{ background: t.accentMuted, border: `1px solid ${t.accentBorder}`, color: t.accentText }}>
            <FileJson size={16} />
            Export JSON
          </button>
          <button onClick={() => exportData('csv')}
            className="flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-[13px] cursor-pointer transition-all"
            style={{ background: dark ? 'rgba(255,255,255,0.05)' : '#f3f4f6', border: `1px solid ${t.cardBorder}`, color: t.text }}>
            <FileText size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Import ── */}
      <div className="p-6" style={card}>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <Upload size={13} style={{ color: '#7c3aed' }} />
          </div>
          <span className="text-[14px] font-semibold" style={{ color: t.text }}>Import Prompts</span>
        </div>

        <p className="text-[13px] mb-5" style={{ color: t.textMuted }}>
          Upload a JSON export file to add prompts in bulk. Existing prompts (same ID) are skipped automatically.
        </p>

        {/* Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          className="relative border-2 border-dashed rounded-xl py-10 flex flex-col items-center gap-3 cursor-pointer transition-all"
          style={{ borderColor: preview ? t.accentBorder : t.cardBorder }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f && fileRef.current) {
              const dt = new DataTransfer(); dt.items.add(f);
              fileRef.current.files = dt.files;
              fileRef.current.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }}>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: preview ? t.accentMuted : dark ? 'rgba(255,255,255,0.04)' : '#f3f4f6' }}>
            <FileJson size={20} style={{ color: preview ? t.accent : t.textMuted }} />
          </div>
          {preview ? (
            <div className="text-center">
              <p className="text-[13px] font-semibold" style={{ color: t.text }}>{preview.file.name}</p>
              <p className="text-[12px] mt-1" style={{ color: t.textMuted }}>{preview.count.toLocaleString()} prompts detected</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-[13px] font-medium" style={{ color: t.text }}>Click to select or drag & drop</p>
              <p className="text-[12px] mt-1" style={{ color: t.textMuted }}>JSON export file only</p>
            </div>
          )}
        </div>

        {/* Preview + import button */}
        {preview && (
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 px-4 py-3 rounded-xl text-[13px]"
              style={{ background: t.accentMuted, border: `1px solid ${t.accentBorder}` }}>
              <span style={{ color: t.accentText }}>Ready to import </span>
              <span className="font-bold" style={{ color: t.accent }}>{preview.count.toLocaleString()}</span>
              <span style={{ color: t.accentText }}> prompts</span>
            </div>
            <button onClick={runImport} disabled={importing}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-[13px] font-semibold text-white cursor-pointer disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}>
              {importing ? <><Loader2 size={14} className="animate-spin" />Importing…</> : <><Upload size={14} />Import</>}
            </button>
          </div>
        )}

        {/* Result */}
        {importResult && (
          <div className="mt-4 flex items-start gap-3 px-4 py-3 rounded-xl"
            style={{ background: t.success || 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" style={{ color: '#10b981' }} />
            <div className="text-[13px]" style={{ color: t.successText || '#10b981' }}>
              <span className="font-semibold">Import complete! </span>
              {importResult.added.toLocaleString()} added, {importResult.skipped.toLocaleString()} skipped (already exist or invalid).
            </div>
          </div>
        )}

        {importError && (
          <div className="mt-4 flex items-start gap-3 px-4 py-3 rounded-xl"
            style={{ background: t.danger, border: `1px solid ${t.dangerBorder}` }}>
            <AlertCircle size={16} className="mt-0.5 shrink-0" style={{ color: t.dangerText }} />
            <p className="text-[13px]" style={{ color: t.dangerText }}>{importError}</p>
          </div>
        )}

        {/* Notes */}
        <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${t.divider}` }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: t.textSub }}>Notes</p>
          <ul className="flex flex-col gap-1.5 text-[12px]" style={{ color: t.textMuted }}>
            {[
              'Only JSON files exported from this admin panel are supported.',
              'Prompts with the same ID as existing ones are automatically skipped.',
              'Images referenced in imported prompts must already be present in /public/images/.',
            ].map((note, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 shrink-0 w-1 h-1 rounded-full" style={{ background: t.textSub }} />
                {note}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
