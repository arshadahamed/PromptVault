'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Heart, Copy, Check } from 'lucide-react';
import { type Prompt } from '@/lib/types';
import { useApp } from '@/context/AppContext';
import { LazyImage } from './LazyImage';
import { aspectRatioPaddingBottom } from '@/lib/prompts';

const MODEL_STYLES: Record<string, { dot: string; color: string; border: string }> = {
  'ChatGPT':        { dot: '#34d399', color: '#a7f3d0', border: 'rgba(52,211,153,0.38)' },
  'GPT Image':      { dot: '#34d399', color: '#a7f3d0', border: 'rgba(52,211,153,0.38)' },
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
      className="inline-flex items-center gap-1.5 max-w-full whitespace-nowrap truncate text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full backdrop-blur-md shadow-sm"
      style={{
        background: 'rgba(9, 9, 11, 0.74)',
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

export function PromptCard({ prompt, eager = false }: { prompt: Prompt; eager?: boolean }) {
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
    <article className="break-inside-avoid mb-3">
      <Link
        href={`/prompt/${prompt.id}`}
        className="group block relative rounded-[16px] overflow-hidden cursor-pointer card-surface"
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
            />
          ) : (
            <div
              className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]"
              style={{
                background: `linear-gradient(135deg, ${prompt.gradientFrom}, ${prompt.gradientTo})`,
              }}
            />
          )}

          {/* Top row: Model badge + Quick Copy */}
          <div className="absolute top-2.5 inset-x-2.5 z-10 flex items-center justify-between gap-2">
            <ModelBadge model={prompt.model} />

            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy prompt"
              className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-200 flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full cursor-pointer backdrop-blur-md"
              style={
                copied
                  ? {
                      opacity: 1,
                      background: 'rgba(16,185,129,0.9)',
                      color: '#ffffff',
                      border: '1px solid rgba(52,211,153,0.6)',
                    }
                  : {
                      background: 'rgba(9,9,11,0.72)',
                      color: '#f4f4f5',
                      border: '1px solid rgba(255,255,255,0.16)',
                    }
              }
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Subtle bottom scrim */}
          <div
            className="absolute inset-0 pointer-events-none opacity-55 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background:
                'linear-gradient(to top, rgba(9,9,11,0.92) 0%, rgba(9,9,11,0.35) 38%, transparent 65%)',
            }}
          />

          {/* Bottom hover preview + Favorite action */}
          <div className="absolute inset-x-0 bottom-0 p-3 z-10 flex flex-col gap-2">
            <p className="opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-200 text-[11px] leading-snug text-zinc-200 line-clamp-2 pointer-events-none">
              {prompt.promptText}
            </p>

            <div className="flex items-center justify-between gap-2">
              <span className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 text-[11px] text-zinc-400 truncate">
                {prompt.author.handle}
              </span>

              <button
                type="button"
                onClick={handleFavorite}
                aria-label={liked ? 'Remove from favorites' : 'Add to favorites'}
                className="ml-auto flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full transition-all cursor-pointer backdrop-blur-md"
                style={{
                  background: liked ? 'rgba(236,72,153,0.28)' : 'rgba(9,9,11,0.65)',
                  color: liked ? '#f9a8d4' : '#e4e4e7',
                  border: liked
                    ? '1px solid rgba(236,72,153,0.5)'
                    : '1px solid rgba(255,255,255,0.14)',
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
}
