'use client';
import { useState, memo } from 'react';
import Link from 'next/link';
import { Heart, Copy, Check, Code2, Images } from 'lucide-react';
import { type Prompt } from '@/lib/types';
import { useApp } from '@/context/AppContext';
import { LazyImage } from './LazyImage';
import { aspectRatioPaddingBottom } from '@/lib/prompts';

const MODEL_STYLES: Record<string, { dot: string; color: string; border: string }> = {
  'ChatGPT':        { dot: '#34d399', color: '#a7f3d0', border: 'rgba(52,211,153,0.38)' },
  'GPT Image':      { dot: '#34d399', color: '#a7f3d0', border: 'rgba(52,211,153,0.38)' },
  'Claude':         { dot: '#fb923c', color: '#fed7aa', border: 'rgba(251,146,60,0.4)' },
  'Cursor':         { dot: '#22d3ee', color: '#a5f3fc', border: 'rgba(34,211,238,0.4)' },
  'Lovable':        { dot: '#f472b6', color: '#fbcfe8', border: 'rgba(244,114,182,0.4)' },
  'Bolt.new':       { dot: '#38bdf8', color: '#bae6fd', border: 'rgba(56,189,248,0.4)' },
  'v0':             { dot: '#e4e4e7', color: '#ffffff', border: 'rgba(255,255,255,0.32)' },
  'Replit':         { dot: '#f97316', color: '#fed7aa', border: 'rgba(249,115,22,0.4)' },
  'Windsurf':       { dot: '#2dd4bf', color: '#99f6e4', border: 'rgba(45,212,191,0.4)' },
  'Nanobanana Pro': { dot: '#fbbf24', color: '#fde68a', border: 'rgba(251,191,36,0.38)' },
  'Nanobanana 2':   { dot: '#fbbf24', color: '#fde68a', border: 'rgba(251,191,36,0.38)' },
  'Seedance 2.0':   { dot: '#f472b6', color: '#fbcfe8', border: 'rgba(244,114,182,0.38)' },
  'Midjourney':     { dot: '#60a5fa', color: '#bfdbfe', border: 'rgba(96,165,250,0.38)' },
  'Flux':           { dot: '#22d3ee', color: '#a5f3fc', border: 'rgba(34,211,238,0.38)'  },
  'Gemini':         { dot: '#c084fc', color: '#e9d5ff', border: 'rgba(192,132,252,0.38)' },
  'Adobe Firefly':  { dot: '#fb7185', color: '#fecdd3', border: 'rgba(251,113,133,0.38)' },
};

function ModelBadge({ model }: { model: string }) {
  const key = Object.keys(MODEL_STYLES).find((k) =>
    model.toLowerCase().includes(k.toLowerCase())
  );
  const style = key
    ? MODEL_STYLES[key]
    : { dot: '#a1a1aa', color: '#e4e4e7', border: 'rgba(255,255,255,0.2)' };

  return (
    <span
      className="inline-flex items-center gap-1.5 max-w-full whitespace-nowrap truncate text-[10px] font-semibold tracking-wide px-2.5 py-0.5 rounded-full shadow-sm"
      style={{
        background: 'rgba(9, 9, 11, 0.86)',
        color: style.color,
        border: `1px solid ${style.border}`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: style.dot }}
      />
      <span className="truncate">{model}</span>
    </span>
  );
}

export const PromptCard = memo(function PromptCard({
  prompt,
  eager = false,
  highPriority = false,
}: {
  prompt: Prompt;
  eager?: boolean;
  highPriority?: boolean;
}) {
  const { favorites, toggleFavorite } = useApp();
  const [copied, setCopied] = useState(false);
  const liked = favorites.includes(prompt.id);
  const paddingBottom = aspectRatioPaddingBottom(prompt.aspectRatio);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt.promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(prompt.id);
  };

  return (
    <article
      className="break-inside-avoid mb-3.5"
      style={{ contain: 'layout style paint' }}
    >
      <Link
        href={`/prompt/${prompt.id}`}
        prefetch={false}
        className="group block relative rounded-2xl overflow-hidden cursor-pointer card-surface"
      >
        <div className="relative w-full overflow-hidden" style={{ paddingBottom }}>
          {prompt.localImg ? (
            <LazyImage
              src={prompt.localImg}
              alt={prompt.promptText.slice(0, 80) || `${prompt.model} prompt`}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03]"
              gradientFrom={prompt.gradientFrom}
              gradientTo={prompt.gradientTo}
              eager={eager}
              highPriority={highPriority}
            />
          ) : (
            <div
              className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.03]"
              style={{
                background: `linear-gradient(135deg, ${prompt.gradientFrom}, ${prompt.gradientTo})`,
              }}
            />
          )}

          {/* Top row: Model / Vibe Code badge + Quick Copy (no expensive backdrop-blur per card) */}
          <div className="absolute top-2.5 inset-x-2.5 z-10 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1 min-w-0">
              <ModelBadge model={prompt.model} />
              {prompt.hasCode && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full shrink-0"
                  style={{
                    background: 'rgba(8, 51, 68, 0.9)',
                    color: '#a5f3fc',
                    border: '1px solid rgba(34, 211, 238, 0.5)',
                  }}
                >
                  <Code2 size={10} />
                  <span>{prompt.codeLanguage || 'Code'}</span>
                </span>
              )}
              {prompt.galleryImages && prompt.galleryImages.length > 0 && (
                <span
                  className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                  style={{
                    background: 'rgba(9, 9, 11, 0.86)',
                    color: '#e4e4e7',
                    border: '1px solid rgba(255,255,255,0.18)',
                  }}
                >
                  <Images size={9} />
                  <span>{prompt.galleryImages.length + (prompt.localImg ? 1 : 0)}</span>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy prompt"
              className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full cursor-pointer shrink-0"
              style={
                copied
                  ? {
                      opacity: 1,
                      background: 'rgba(16,185,129,0.95)',
                      color: '#ffffff',
                      border: '1px solid rgba(52,211,153,0.65)',
                    }
                  : {
                      background: 'rgba(9,9,11,0.88)',
                      color: '#f4f4f5',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }
              }
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Subtle bottom scrim */}
          <div
            className={
              prompt.title
                ? 'absolute inset-0 pointer-events-none opacity-85 group-hover:opacity-100 transition-opacity duration-200'
                : 'absolute inset-0 pointer-events-none opacity-55 group-hover:opacity-100 transition-opacity duration-200'
            }
            style={{
              background:
                'linear-gradient(to top, rgba(9,9,11,0.92) 0%, rgba(9,9,11,0.32) 38%, transparent 65%)',
            }}
          />

          {/* Bottom title / hover preview + Favorite action */}
          <div className="absolute inset-x-0 bottom-0 p-3 z-10 flex flex-col gap-1.5">
            {prompt.title ? (
              <div className="pointer-events-none">
                <p className="text-[12.5px] font-semibold text-white truncate drop-shadow-sm">
                  {prompt.title}
                </p>
                <p className="opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-10 group-focus-within:opacity-100 group-focus-within:max-h-10 transition-all duration-150 text-[10.5px] leading-snug text-zinc-200 line-clamp-1 overflow-hidden mt-0.5">
                  {prompt.promptText}
                </p>
              </div>
            ) : (
              <p className="opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-150 text-[11px] leading-snug text-zinc-100 line-clamp-2 pointer-events-none">
                {prompt.promptText}
              </p>
            )}

            <div className="flex items-center justify-between gap-2">
              <span className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 text-[11px] text-zinc-300 truncate">
                {prompt.author.handle}
              </span>

              <button
                type="button"
                onClick={handleFavorite}
                aria-label={liked ? 'Remove from favorites' : 'Add to favorites'}
                className="ml-auto flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                style={{
                  background: liked ? 'rgba(131, 24, 67, 0.88)' : 'rgba(9,9,11,0.84)',
                  color: liked ? '#fbcfe8' : '#e4e4e7',
                  border: liked
                    ? '1px solid rgba(236,72,153,0.6)'
                    : '1px solid rgba(255,255,255,0.18)',
                }}
              >
                <Heart
                  size={11}
                  fill={liked ? '#ec4899' : 'none'}
                  stroke={liked ? '#ec4899' : 'currentColor'}
                  strokeWidth={1.75}
                />
                <span className="tabular-nums">{prompt.likes + (liked ? 1 : 0)}</span>
              </button>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
});
