'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Heart, Share2, Copy, Download, X, ArrowLeft, Check,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { type Prompt } from '@/lib/types';
import { getRelatedPrompts } from '@/data/prompts';
import { useApp } from '@/context/AppContext';
import { RelatedGrid } from './RelatedGrid';
import { cn } from '@/lib/utils';

export function PromptDetail({ prompt }: { prompt: Prompt }) {
  const router = useRouter();
  const { favorites, toggleFavorite } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const liked = favorites.includes(prompt.id);
  const related = getRelatedPrompts(prompt.relatedIds);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.promptText);
    } catch {
      // fallback: do nothing
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const TRUNCATE = 260;
  const truncated = prompt.promptText.length > TRUNCATE && !expanded;
  const displayText = truncated
    ? prompt.promptText.slice(0, TRUNCATE) + '…'
    : prompt.promptText;

  return (
    <motion.div
      className="min-h-screen bg-white flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
    >
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3 bg-white/92 backdrop-blur-sm border-b border-[#e5e7eb] shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[13px] text-[#6b7280] hover:text-[#1b1b1b] transition-colors cursor-pointer"
        >
          <ArrowLeft size={15} />
          Back
        </button>
        <div className="text-[12px] font-medium text-[#1b1b1b] truncate max-w-[300px] hidden md:block">
          {prompt.author.name}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="w-8 h-8 rounded-full hover:bg-[#f7f4ed] flex items-center justify-center text-[#6b7280] hover:text-[#1b1b1b] transition-colors cursor-pointer"
            aria-label="Download"
          >
            <Download size={15} />
          </button>
          <Link
            href="/"
            className="w-8 h-8 rounded-full hover:bg-[#f7f4ed] flex items-center justify-center text-[#6b7280] hover:text-[#1b1b1b] transition-colors"
            aria-label="Close (Esc)"
          >
            <X size={15} />
          </Link>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0">

        {/* LEFT: Artwork */}
        <div className="flex-1 flex items-start justify-center p-6 md:p-10 bg-[#f7f4ed] min-h-[300px]">
          <div
            className="rounded-[18px] overflow-hidden shadow-2xl w-full"
            style={{
              aspectRatio: prompt.aspectRatio || '4/3',
              background: `linear-gradient(135deg, ${prompt.gradientFrom}, ${prompt.gradientTo})`,
              maxWidth: '460px',
              maxHeight: '72vh',
            }}
          >
            {prompt.localImg ? (
              <img
                src={prompt.localImg}
                alt={prompt.promptText.slice(0, 80)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full"
                style={{
                  background:
                    'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.18) 0%, transparent 60%)',
                }}
              />
            )}
          </div>
        </div>

        {/* RIGHT: Detail panel */}
        <div className="w-full md:w-[380px] shrink-0 border-t md:border-t-0 md:border-l border-[#e5e7eb] flex flex-col">
          <div className="flex-1 overflow-y-auto p-5 pb-28">

            {/* Action buttons */}
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <button
                onClick={() => toggleFavorite(prompt.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-medium border transition-colors cursor-pointer',
                  liked
                    ? 'bg-rose-50 border-rose-200 text-rose-500'
                    : 'border-[#e5e7eb] text-[#6b7280] hover:bg-[#f7f4ed]'
                )}
              >
                <Heart size={14} fill={liked ? 'currentColor' : 'none'} strokeWidth={1.5} />
                {prompt.likes + (liked ? 1 : 0)}
              </button>

              <button className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f7f4ed] transition-colors cursor-pointer">
                <Share2 size={14} />
                Share
              </button>

              <button
                onClick={copy}
                className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold bg-[#1b1b1b] text-white hover:bg-[#333] transition-colors cursor-pointer"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Prompt'}
              </button>
            </div>

            {/* Prompt text */}
            <div className="mb-5">
              <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-2">
                Prompt
              </p>
              <div className="bg-[#f7f4ed] rounded-[12px] p-3.5">
                <p className="text-[12px] text-[#1b1b1b] leading-relaxed font-mono break-words">
                  {displayText}
                </p>
                {prompt.promptText.length > TRUNCATE && (
                  <button
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-2 text-[12px] text-[#6b7280] hover:text-[#1b1b1b] font-medium transition-colors cursor-pointer"
                  >
                    {expanded ? 'Show less ↑' : 'Show more ↓'}
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-3 mb-6 text-[12px] text-[#6b7280]">
              <span className="text-[11px] font-medium bg-[#f7f4ed] text-[#6b7280] px-2.5 py-1 rounded-full border border-[#e5e7eb]">
                {prompt.model}
              </span>
              <span>
                <strong className="text-[#1b1b1b] font-semibold">{prompt.likes}</strong> likes
              </span>
              {prompt.views ? (
                <span>
                  <strong className="text-[#1b1b1b] font-semibold">{prompt.views.toLocaleString()}</strong> views
                </span>
              ) : null}
              <span className="capitalize">
                <strong className="text-[#1b1b1b] font-semibold">{prompt.category}</strong>
              </span>
            </div>

            {/* Related */}
            <RelatedGrid prompts={related} />
          </div>

        </div>
      </div>
    </motion.div>
  );
}
