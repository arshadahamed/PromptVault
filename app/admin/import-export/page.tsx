'use client';
import { useEffect, useId, useRef, useState } from 'react';
import {
  Download, Upload, FileJson, FileText, CheckCircle2, AlertCircle,
  Eye, X, ShieldCheck,
} from 'lucide-react';
import type { AdminDashboardStats } from '@/lib/db';
import { ALL_MODELS } from '@/lib/vibe-coding';
import {
  AdminBadge, AdminButton, AdminCard, AdminFormField, AdminPageHeader,
  AdminSectionHeader, AdminSelect,
} from '@/components/admin/ui/Primitives';
import { ConfirmDialog, Dialog } from '@/components/admin/ui/Dialog';
import { useToast } from '@/components/admin/ui/ToastProvider';
import { LottieIcon } from '@/components/ui/LottieIcon';

interface ParsedPromptRow {
  id?: string;
  promptText?: string;
  model?: string;
  authorName?: string;
  published?: boolean;
}

interface ImportPreview {
  fileName: string;
  fileSizeKb: number;
  payload: unknown;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  models: Record<string, number>;
  sample: ParsedPromptRow[];
}

interface ImportResult {
  added: number;
  skipped: number;
  total: number;
  reasons?: {
    missingPrompt: number;
    duplicateId: number;
  };
}

const MODELS = [...ALL_MODELS];

export default function ImportExportPage() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const statusSelectId = useId();
  const modelSelectId = useId();

  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [exportStatus, setExportStatus] = useState<'all' | 'published' | 'draft' | 'featured'>('all');
  const [exportModel, setExportModel] = useState('');
  const [exporting, setExporting] = useState<'json' | 'csv' | null>(null);
  const [exportError, setExportError] = useState('');

  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [confirmImportOpen, setConfirmImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState('');

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(() => {});
  }, []);

  async function processFile(file: File) {
    setImportResult(null);
    setImportError('');
    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      const arr: ParsedPromptRow[] = Array.isArray(parsed)
        ? (parsed as ParsedPromptRow[])
        : parsed && typeof parsed === 'object' && Array.isArray((parsed as { prompts?: unknown }).prompts)
          ? ((parsed as { prompts: ParsedPromptRow[] }).prompts)
          : [];

      if (arr.length === 0) {
        setImportError('No prompt records found in this JSON file.');
        setPreview(null);
        return;
      }

      let validCount = 0;
      let invalidCount = 0;
      const models: Record<string, number> = {};

      for (const item of arr) {
        if (item && typeof item.promptText === 'string' && item.promptText.trim()) {
          validCount++;
          const m = typeof item.model === 'string' && item.model.trim() ? item.model.trim() : 'ChatGPT';
          models[m] = (models[m] || 0) + 1;
        } else {
          invalidCount++;
        }
      }

      setPreview({
        fileName: file.name,
        fileSizeKb: Math.max(1, Math.round(file.size / 1024)),
        payload: parsed,
        totalRows: arr.length,
        validCount,
        invalidCount,
        models,
        sample: arr.slice(0, 8),
      });
    } catch {
      setImportError('Invalid JSON file. Please upload a valid prompt backup export.');
      setPreview(null);
    }
  }

  function clearFile() {
    setPreview(null);
    setImportError('');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function runImport() {
    if (!preview) return;
    setConfirmImportOpen(false);
    setImporting(true);
    setImportResult(null);
    setImportError('');

    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preview.payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Import failed');

      setImportResult(data as ImportResult);
      toast({
        title: `Import complete: ${data.added} added`,
        description: `${data.skipped} skipped (duplicates or invalid).`,
        variant: 'success',
      });
      clearFile();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      setImportError(msg);
      toast({ title: 'Import failed', description: msg, variant: 'error' });
    } finally {
      setImporting(false);
    }
  }

  async function exportData(format: 'json' | 'csv') {
    setExportError('');
    setExporting(format);
    try {
      const qs = new URLSearchParams({ format });
      if (exportStatus !== 'all') qs.set('status', exportStatus);
      if (exportModel) qs.set('model', exportModel);

      const res = await fetch(`/api/admin/export?${qs.toString()}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Export failed');
      }
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = /filename="([^"]+)"/.exec(disposition);
      const filename = match?.[1] || `prompts-export.${format}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({ title: `${format.toUpperCase()} export downloaded`, variant: 'success' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      setExportError(msg);
      toast({ title: 'Export failed', description: msg, variant: 'error' });
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <AdminPageHeader
        title="Import & Export"
        description="Download full or filtered backups, or bulk import prompt datasets via JSON."
        badge={
          stats ? (
            <AdminBadge variant="neutral" className="tabular-nums">
              {stats.totalPrompts.toLocaleString()} prompts in DB
            </AdminBadge>
          ) : null
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Export Section */}
        <AdminCard padding="lg">
          <AdminSectionHeader
            icon={Download}
            title="Export Catalog"
            description="Generate a JSON backup (all fields) or spreadsheet-safe CSV."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <AdminFormField label="Visibility Scope" htmlFor={statusSelectId}>
              <AdminSelect
                id={statusSelectId}
                value={exportStatus}
                onChange={(e) => setExportStatus(e.target.value as typeof exportStatus)}
              >
                <option value="all">All Prompts</option>
                <option value="published">Published Only</option>
                <option value="draft">Hidden Drafts Only</option>
                <option value="featured">Featured Only</option>
              </AdminSelect>
            </AdminFormField>

            <AdminFormField label="Model Filter" htmlFor={modelSelectId}>
              <AdminSelect
                id={modelSelectId}
                value={exportModel}
                onChange={(e) => setExportModel(e.target.value)}
              >
                <option value="">All Models</option>
                {MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </AdminSelect>
            </AdminFormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AdminButton
              variant="primary"
              size="lg"
              loading={exporting === 'json'}
              disabled={exporting !== null}
              onClick={() => void exportData('json')}
              icon={<FileJson size={16} />}
              className="w-full"
            >
              Export JSON
            </AdminButton>
            <AdminButton
              variant="secondary"
              size="lg"
              loading={exporting === 'csv'}
              disabled={exporting !== null}
              onClick={() => void exportData('csv')}
              icon={<FileText size={16} />}
              className="w-full"
            >
              Export CSV
            </AdminButton>
          </div>

          {exportError && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2.5 px-3.5 py-3 rounded-xl text-[12.5px]"
              style={{
                backgroundColor: 'var(--adm-danger-bg)',
                border: '1px solid var(--adm-danger-border)',
                color: 'var(--adm-danger-text)',
              }}
            >
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{exportError}</span>
            </div>
          )}

          <div className="mt-5 pt-4 space-y-1.5 text-[12px]" style={{ borderTop: '1px solid var(--adm-border)', color: 'var(--adm-text-subtle)' }}>
            <p className="font-semibold uppercase tracking-wider text-[11px]">Format Details</p>
            <p>• JSON includes complete prompt metadata, gradients, URLs, and IDs for re-importing.</p>
            <p>• CSV exports key columns with formula-injection protection for Excel &amp; Sheets.</p>
          </div>
        </AdminCard>

        {/* Import Section */}
        <AdminCard padding="lg">
          <AdminSectionHeader
            icon={Upload}
            title="Import Prompts"
            description="Upload a JSON export file to batch-insert new prompts."
          />

          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void processFile(f);
            }}
          />

          <div
            role="button"
            tabIndex={0}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              const f = e.dataTransfer.files?.[0];
              if (f) void processFile(f);
            }}
            className="border-2 border-dashed rounded-xl py-8 px-4 flex flex-col items-center justify-center text-center gap-2.5 cursor-pointer transition-colors"
            style={{
              borderColor: dragActive || preview ? 'var(--adm-accent)' : 'var(--adm-border-strong)',
              backgroundColor: dragActive ? 'var(--adm-accent-soft)' : 'var(--adm-surface-muted)',
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: preview ? 'var(--adm-accent-soft)' : 'var(--adm-surface)',
                border: '1px solid var(--adm-border)',
                color: preview ? 'var(--adm-accent-text)' : 'var(--adm-text-muted)',
              }}
            >
              <LottieIcon name="upload" size={20} />
            </div>

            {preview ? (
              <div>
                <p className="text-[13.5px] font-semibold" style={{ color: 'var(--adm-text)' }}>
                  {preview.fileName}
                </p>
                <p className="text-[12px] mt-0.5 tabular-nums" style={{ color: 'var(--adm-text-muted)' }}>
                  {preview.fileSizeKb.toLocaleString()} KB · {preview.totalRows.toLocaleString()} records parsed
                </p>
              </div>
            ) : (
              <div>
                <p className="text-[13px] font-semibold" style={{ color: 'var(--adm-text)' }}>
                  Click to choose or drag &amp; drop a JSON file
                </p>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--adm-text-subtle)' }}>
                  Supports arrays or &#123; prompts: [...] &#125; export files
                </p>
              </div>
            )}
          </div>

          {preview && (
            <div
              className="mt-4 p-4 rounded-xl flex flex-col gap-3"
              style={{
                backgroundColor: 'var(--adm-surface-muted)',
                border: '1px solid var(--adm-border)',
              }}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <AdminBadge variant="success">{preview.validCount.toLocaleString()} valid</AdminBadge>
                  {preview.invalidCount > 0 && (
                    <AdminBadge variant="warning">{preview.invalidCount.toLocaleString()} missing prompt</AdminBadge>
                  )}
                  <AdminBadge variant="neutral">{Object.keys(preview.models).length} models</AdminBadge>
                </div>

                <div className="flex items-center gap-1.5">
                  <AdminButton
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewModalOpen(true)}
                    icon={<Eye size={13} />}
                  >
                    Preview
                  </AdminButton>
                  <AdminButton
                    variant="ghost"
                    size="sm"
                    onClick={clearFile}
                    aria-label="Clear selected file"
                    icon={<X size={13} />}
                  >
                    Clear
                  </AdminButton>
                </div>
              </div>

              <AdminButton
                variant="primary"
                size="md"
                loading={importing}
                disabled={preview.validCount === 0}
                onClick={() => setConfirmImportOpen(true)}
                icon={<Upload size={14} />}
                className="w-full"
              >
                Import {preview.validCount.toLocaleString()} Valid Prompts
              </AdminButton>
            </div>
          )}

          {importResult && (
            <div
              role="status"
              className="mt-4 flex items-start gap-3 px-4 py-3 rounded-xl"
              style={{
                backgroundColor: 'var(--adm-success-bg)',
                border: '1px solid var(--adm-success-border)',
                color: 'var(--adm-success-text)',
              }}
            >
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              <div className="text-[12.5px]">
                <p className="font-semibold">
                  Import complete: {importResult.added.toLocaleString()} added, {importResult.skipped.toLocaleString()} skipped.
                </p>
                {importResult.reasons && (
                  <p className="opacity-85 mt-0.5">
                    {importResult.reasons.duplicateId.toLocaleString()} duplicate IDs ·{' '}
                    {importResult.reasons.missingPrompt.toLocaleString()} missing prompt text
                  </p>
                )}
              </div>
            </div>
          )}

          {importError && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-3 px-4 py-3 rounded-xl"
              style={{
                backgroundColor: 'var(--adm-danger-bg)',
                border: '1px solid var(--adm-danger-border)',
                color: 'var(--adm-danger-text)',
              }}
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p className="text-[12.5px]">{importError}</p>
            </div>
          )}

          <div className="mt-5 pt-4 space-y-1.5 text-[12px]" style={{ borderTop: '1px solid var(--adm-border)', color: 'var(--adm-text-subtle)' }}>
            <p className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck size={12} /> Import Rules
            </p>
            <p>• Existing prompt IDs already in Supabase are skipped automatically to prevent duplicates.</p>
            <p>• Image URLs (`localImg` / `imageUrl` / `galleryImages`) and `previewUrl` are validated for safe HTTP/HTTPS or relative paths (R2 URLs work out of the box).</p>
            <p>• Vibe Coding prompts support optional `title`, `codeSnippet`, `codeLanguage`, `stackTags`, `galleryImages`, and `previewUrl` fields.</p>
            <p>• Records are inserted in batches of 100 and immediately revalidate the public gallery.</p>
          </div>
        </AdminCard>
      </div>

      {/* File Preview Modal */}
      <Dialog
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title="Import File Preview"
        description={
          preview
            ? `Showing first ${preview.sample.length} of ${preview.totalRows.toLocaleString()} detected rows in ${preview.fileName}.`
            : undefined
        }
        size="lg"
        footer={
          <AdminButton variant="primary" size="sm" onClick={() => setPreviewModalOpen(false)}>
            Close preview
          </AdminButton>
        }
      >
        {preview && (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px] border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--adm-border)' }}>
                  <th className="text-left py-2 pr-3 font-semibold" style={{ color: 'var(--adm-text-muted)' }}>Model</th>
                  <th className="text-left py-2 pr-3 font-semibold" style={{ color: 'var(--adm-text-muted)' }}>Author</th>
                  <th className="text-left py-2 pr-3 font-semibold" style={{ color: 'var(--adm-text-muted)' }}>Prompt Snippet</th>
                  <th className="text-left py-2 font-semibold" style={{ color: 'var(--adm-text-muted)' }}>Valid</th>
                </tr>
              </thead>
              <tbody>
                {preview.sample.map((row, idx) => {
                  const hasText = typeof row?.promptText === 'string' && row.promptText.trim().length > 0;
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--adm-border-subtle)' }}>
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        <AdminBadge variant="accent">{row?.model || 'ChatGPT'}</AdminBadge>
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap" style={{ color: 'var(--adm-text-secondary)' }}>
                        {row?.authorName || 'User'}
                      </td>
                      <td className="py-2.5 pr-3 max-w-xs truncate" style={{ color: 'var(--adm-text)' }}>
                        {hasText ? row.promptText : '—'}
                      </td>
                      <td className="py-2.5 whitespace-nowrap">
                        <AdminBadge variant={hasText ? 'success' : 'danger'}>
                          {hasText ? 'Ready' : 'Skipped'}
                        </AdminBadge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Dialog>

      {/* Confirm Import Dialog */}
      <ConfirmDialog
        open={confirmImportOpen}
        onClose={() => setConfirmImportOpen(false)}
        onConfirm={runImport}
        loading={importing}
        variant="primary"
        title="Run bulk prompt import?"
        description={
          preview
            ? `This will import up to ${preview.validCount.toLocaleString()} valid prompt(s) from "${preview.fileName}". Any records matching existing database IDs will be skipped.`
            : ''
        }
        confirmLabel="Start Import"
      />
    </div>
  );
}
