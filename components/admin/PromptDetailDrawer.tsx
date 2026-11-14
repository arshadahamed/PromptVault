'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Copy, Check, ExternalLink, Pencil, Trash2, Star, Eye, EyeOff,
  Heart, Calendar, User, Layers, Maximize2, Code2, Globe, Images,
} from 'lucide-react';
import type { DbPrompt } from '@/lib/db';
import { isSafeHref } from '@/lib/security';
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
  const [copiedCode, setCopiedCode] = useState(false);
  const [textTab, setTextTab] = useState<'prompt' | 'code'>('prompt');
  const [selectedPhoto, setSelectedPhoto] = useState<string>('');

  if (!prompt) {
    return (
      <Drawer open={open} onClose={onClose} title="Prompt Details">
        <div />
      </Drawer>
    );
  }

  const coverUrl = prompt.localImg || prompt.imageUrl;
  const photos = Array.from(
    new Set(
      [coverUrl, ...(prompt.galleryImages ?? [])].filter(
        (u): u is string => Boolean(u && isSafeHref(u))
      )
    )
  );
  const previewUrl =
    selectedPhoto && photos.includes(selectedPhoto) ? selectedPhoto : photos[0] || '';
  const hasCode = Boolean(prompt.codeSnippet?.trim());
  const activeTab = textTab === 'code' && hasCode ? 'code' : 'prompt';
  const stackTags = prompt.stackTags ?? [];
  const safeDemoUrl = prompt.previewUrl && isSafeHref(prompt.previewUrl) ? prompt.previewUrl : null;
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

  async function copyCode() {
    if (!prompt?.codeSnippet) return;
    try {
      await navigator.clipboard.writeText(prompt.codeSnippet);
      setCopiedCode(true);
      toast({ title: 'Code snippet copied', variant: 'success', durationMs: 2200 });
      setTimeout(() => setCopiedCode(false), 1800);
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
        {/* Image Preview + Multi-Photo Switcher */}
        <div>
          <div
            className="w-full rounded-xl overflow-hidden flex items-center justify-center max-h-72 relative"
            style={{
              background: `linear-gradient(135deg, ${prompt.gradientFrom}, ${prompt.gradientTo})`,
              border: '1px solid var(--adm-border)',
            }}
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt={prompt.title || 'Prompt preview'}
                className="w-full max-h-72 object-contain"
              />
            ) : (
              <div className="py-12 text-center text-[12px]" style={{ color: 'var(--adm-text-muted)' }}>
                No image attached (gradient fallback shown)
              </div>
            )}
            {photos.length > 1 && (
              <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-black/70 text-white backdrop-blur-sm">
                <Images size={11} />
                {photos.indexOf(previewUrl) + 1} / {photos.length}
              </span>
            )}
          </div>

          {photos.length > 1 && (
            <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1">
              {photos.map((url, idx) => {
                const active = url === previewUrl;
                return (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setSelectedPhoto(url)}
                    className="w-14 h-10 rounded-lg overflow-hidden shrink-0 cursor-pointer transition-opacity"
                    style={{
                      border: active
                        ? '2px solid var(--adm-accent)'
                        : '1px solid var(--adm-border)',
                      opacity: active ? 1 : 0.65,
                    }}
                    aria-label={`Preview photo ${idx + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Title, Stack Tags & Live Demo */}
        {(prompt.title || stackTags.length > 0 || safeDemoUrl) && (
          <div
            className="p-3.5 rounded-xl flex flex-col gap-2"
            style={{
              backgroundColor: 'var(--adm-surface-muted)',
              border: '1px solid var(--adm-border)',
            }}
          >
            {prompt.title && (
              <h3 className="text-[14px] font-semibold leading-snug" style={{ color: 'var(--adm-text)' }}>
                {prompt.title}
              </h3>
            )}
            {stackTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {stackTags.map((tag) => (
                  <AdminBadge key={tag} variant="neutral">
                    {tag}
                  </AdminBadge>
                ))}
              </div>
            )}
            {safeDemoUrl && (
              <a
                href={safeDemoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[12px] font-medium hover:underline w-fit"
                style={{ color: 'var(--adm-accent-text)' }}
              >
                <Globe size={12} />
                {safeDemoUrl}
                <ExternalLink size={11} />
              </a>
            )}
          </div>
        )}

        {/* Status & Quick Toggles */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <AdminBadge variant="accent">{prompt.model}</AdminBadge>
            {hasCode && (
              <AdminBadge variant="info">
                {(prompt.codeLanguage || 'code').toUpperCase()}
              </AdminBadge>
            )}
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

        {/* Prompt / Code Inspector */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            {hasCode ? (
              <div
                className="inline-flex items-center gap-1 p-0.5 rounded-lg"
                style={{
                  backgroundColor: 'var(--adm-surface-muted)',
                  border: '1px solid var(--adm-border)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setTextTab('prompt')}
                  className="px-2.5 py-1 rounded-md text-[11.5px] font-semibold cursor-pointer"
                  style={{
                    backgroundColor: activeTab === 'prompt' ? 'var(--adm-surface)' : 'transparent',
                    color: activeTab === 'prompt' ? 'var(--adm-accent-text)' : 'var(--adm-text-muted)',
                  }}
                >
                  Prompt ({prompt.promptText.length.toLocaleString()})
                </button>
                <button
                  type="button"
                  onClick={() => setTextTab('code')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11.5px] font-semibold cursor-pointer"
                  style={{
                    backgroundColor: activeTab === 'code' ? 'var(--adm-surface)' : 'transparent',
                    color: activeTab === 'code' ? 'var(--adm-accent-text)' : 'var(--adm-text-muted)',
                  }}
                >
                  <Code2 size={11.5} />
                  Code ({(prompt.codeLanguage || 'code').toUpperCase()})
                </button>
              </div>
            ) : (
              <span
                className="text-[11.5px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--adm-text-muted)' }}
              >
                Prompt Text ({prompt.promptText.length.toLocaleString()} chars)
              </span>
            )}

            <div className="flex items-center gap-1.5">
              {activeTab === 'code' && hasCode ? (
                <AdminButton
                  variant="secondary"
                  size="sm"
                  onClick={copyCode}
                  icon={copiedCode ? <Check size={12} /> : <Copy size={12} />}
                >
                  {copiedCode ? 'Copied' : 'Copy code'}
                </AdminButton>
              ) : (
                <AdminButton
                  variant="secondary"
                  size="sm"
                  onClick={copyPrompt}
                  icon={copied ? <Check size={12} /> : <Copy size={12} />}
                >
                  {copied ? 'Copied' : 'Copy prompt'}
                </AdminButton>
              )}
            </div>
          </div>

          <pre
            className="p-3.5 rounded-xl font-mono text-[12px] leading-relaxed whitespace-pre-wrap break-words max-h-64 overflow-y-auto"
            style={{
              backgroundColor: 'var(--adm-surface-muted)',
              border: '1px solid var(--adm-border)',
              color: 'var(--adm-text)',
            }}
          >
            {activeTab === 'code' && hasCode ? prompt.codeSnippet : prompt.promptText}
          </pre>
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
