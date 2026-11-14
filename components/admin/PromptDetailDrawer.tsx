'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Copy, Check, ExternalLink, Pencil, Trash2, Star, Eye, EyeOff,
  Heart, Calendar, User, Layers, Maximize2,
} from 'lucide-react';
import type { DbPrompt } from '@/lib/db';
import { Drawer } from './ui/Dialog';
import { AdminBadge, AdminButton } from './ui/Primitives';
import { useToast } from './ui/ToastProvider';

interface Props {
  prompt: DbPrompt | null;
  open: boolean;
  onClose: () => void;
  onToggle: (id: string, field: 'featured' | 'published', value: boolean) => Promise<void>;
  onDeleteRequest: (prompt: DbPrompt) => void;
  togglingKey: string | null;
}

export function PromptDetailDrawer({
  prompt,
  open,
  onClose,
  onToggle,
  onDeleteRequest,
  togglingKey,
}: Props) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!prompt) {
    return (
      <Drawer open={open} onClose={onClose} title="Prompt Details">
        <div />
      </Drawer>
    );
  }

  const previewUrl = prompt.localImg || prompt.imageUrl;
  const isPublished = prompt.published !== false;
  const isFeatured = prompt.featured === true;

  async function copyPrompt() {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt.promptText);
      setCopied(true);
      toast({ title: 'Prompt copied to clipboard', variant: 'success', durationMs: 2200 });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: 'Copy failed', description: 'Clipboard permission denied.', variant: 'error' });
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Prompt Details"
      subtitle={`ID: ${prompt.id}`}
      width="lg"
      headerActions={
        isPublished ? (
          <Link
            href={`/prompt/${prompt.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
            style={{
              backgroundColor: 'var(--adm-surface-muted)',
              border: '1px solid var(--adm-border)',
              color: 'var(--adm-text-secondary)',
            }}
          >
            <ExternalLink size={12} />
            Public Page
          </Link>
        ) : null
      }
      footer={
        <>
          <AdminButton
            variant="danger"
            size="sm"
            icon={<Trash2 size={13} />}
            onClick={() => onDeleteRequest(prompt)}
          >
            Delete
          </AdminButton>
          <div className="flex items-center gap-2">
            <AdminButton variant="outline" size="sm" onClick={onClose}>
              Close
            </AdminButton>
            <Link href={`/admin/prompts/${prompt.id}/edit`}>
              <AdminButton variant="primary" size="sm" icon={<Pencil size={13} />}>
                Edit Prompt
              </AdminButton>
            </Link>
          </div>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Image Preview */}
        <div
          className="w-full rounded-xl overflow-hidden flex items-center justify-center max-h-72"
          style={{
            background: `linear-gradient(135deg, ${prompt.gradientFrom}, ${prompt.gradientTo})`,
            border: '1px solid var(--adm-border)',
          }}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Prompt preview"
              className="w-full max-h-72 object-contain"
            />
          ) : (
            <div className="py-12 text-center text-[12px]" style={{ color: 'var(--adm-text-muted)' }}>
              No image attached (gradient fallback shown)
            </div>
          )}
        </div>

        {/* Status & Quick Toggles */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <AdminBadge variant="accent">{prompt.model}</AdminBadge>
            <AdminBadge variant={isPublished ? 'success' : 'danger'}>
              {isPublished ? 'Published' : 'Hidden Draft'}
            </AdminBadge>
            {isFeatured && <AdminBadge variant="warning">Featured</AdminBadge>}
          </div>

          <div className="flex items-center gap-2">
            <AdminButton
              variant="outline"
              size="sm"
              loading={togglingKey === `${prompt.id}:featured`}
              onClick={() => onToggle(prompt.id, 'featured', !isFeatured)}
              icon={<Star size={13} fill={isFeatured ? '#f59e0b' : 'none'} />}
            >
              {isFeatured ? 'Unfeature' : 'Feature'}
            </AdminButton>
            <AdminButton
              variant="outline"
              size="sm"
              loading={togglingKey === `${prompt.id}:published`}
              onClick={() => onToggle(prompt.id, 'published', !isPublished)}
              icon={isPublished ? <EyeOff size={13} /> : <Eye size={13} />}
            >
              {isPublished ? 'Unpublish' : 'Publish'}
            </AdminButton>
          </div>
        </div>

        {/* Prompt Text */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-[11.5px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--adm-text-muted)' }}
            >
              Prompt Text ({prompt.promptText.length.toLocaleString()} chars)
            </span>
            <AdminButton
              variant="secondary"
              size="sm"
              onClick={copyPrompt}
              icon={copied ? <Check size={12} /> : <Copy size={12} />}
            >
              {copied ? 'Copied' : 'Copy prompt'}
            </AdminButton>
          </div>
          <div
            className="p-3.5 rounded-xl font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap break-words max-h-56 overflow-y-auto"
            style={{
              backgroundColor: 'var(--adm-surface-muted)',
              border: '1px solid var(--adm-border)',
              color: 'var(--adm-text)',
            }}
          >
            {prompt.promptText}
          </div>
        </div>

        {/* Metadata Grid */}
        <div
          className="grid grid-cols-2 gap-3 p-4 rounded-xl"
          style={{
            backgroundColor: 'var(--adm-surface-muted)',
            border: '1px solid var(--adm-border)',
          }}
        >
          <MetaItem icon={<User size={13} />} label="Author" value={`${prompt.authorName} (${prompt.handle || '—'})`} />
          <MetaItem icon={<Layers size={13} />} label="Category / Tab" value={`${prompt.category} / ${prompt.tab}`} />
          <MetaItem icon={<Heart size={13} />} label="Likes" value={prompt.likes.toLocaleString()} />
          <MetaItem icon={<Eye size={13} />} label="Views" value={prompt.views.toLocaleString()} />
          <MetaItem icon={<Maximize2 size={13} />} label="Aspect Ratio" value={prompt.aspectRatio} />
          <MetaItem
            icon={<Calendar size={13} />}
            label="Created"
            value={prompt.createdAt ? new Date(prompt.createdAt).toLocaleDateString() : '—'}
          />
        </div>
      </div>
    </Drawer>
  );
}

function MetaItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: 'var(--adm-text-subtle)' }}>
        {icon}
        {label}
      </p>
      <p className="text-[12.5px] font-semibold mt-0.5 truncate" style={{ color: 'var(--adm-text)' }}>
        {value}
      </p>
    </div>
  );
}
