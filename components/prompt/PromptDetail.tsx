'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Heart,
  Share2,
  Copy,
  Download,
  X,
  ArrowLeft,
  Check,
  Languages,
  Loader2,
  Sparkles,
  Eye,
  Calendar,
} from 'lucide-react';
import { type Prompt } from '@/lib/types';
import { useApp } from '@/context/AppContext';
import { safeAspectRatio } from '@/lib/prompts';
import { isSafeHref } from '@/lib/security';
import { RelatedGrid } from './RelatedGrid';
import { cn } from '@/lib/utils';

function isNonEnglishText(text: string): boolean {
  if (!text) return false;
  const cleaned = text.replace(/[\u2010-\u2027\u2030-\u205E\u20A0-\u20CF\u2100-\u214F]/g, '');
  const nonEnglishPattern =
    /[\u3000-\u9fff\uac00-\ud7af\u0400-\u04ff\u0600-\u06ff\u0e00-\u0e7f\u0900-\u097f\u0370-\u03ff\u0590-\u05ff\u1100-\u11ff\u3130-\u318f]/;
  const nonAsciiCount = (cleaned.match(/[^\x00-\x7F]/g) || []).length;
  return nonEnglishPattern.test(cleaned) || nonAsciiCount > 3;
}

export function PromptDetail({ prompt, related }: { prompt: Prompt; related: Prompt[] }) {
  const router = useRouter();
  const { favorites, toggleFavorite, addToHistory } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const recordedIdRef = useRef<string | null>(null);

  const liked = favorites.includes(prompt.id);
  const safeImgUrl =
    !imgError && prompt.localImg && isSafeHref(prompt.localImg) ? prompt.localImg : null;
  const safeRatio = safeAspectRatio(prompt.aspectRatio);

  // Record in browsing history once per prompt view
  useEffect(() => {
    if (recordedIdRef.current !== prompt.id) {
      recordedIdRef.current = prompt.id;
      addToHistory(prompt.id);
    }
  }, [prompt.id, addToHistory]);

  // Translation state
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslated, setIsTranslated] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  const isNonEnglish = useMemo(() => isNonEnglishText(prompt.promptText), [prompt.promptText]);

  const handleTranslateToggle = async () => {
    if (isTranslated) {
      setIsTranslated(false);
      return;
    }

    if (translatedText) {
      setIsTranslated(true);
      return;
    }

    setIsTranslating(true);
    setTranslationError(null);

    try {
      // Primary: Google Translate GTX endpoint (fast, accurate, zero key)
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(prompt.promptText)}`
      );
      if (!res.ok) throw new Error('Translation request failed');
      const data = await res.json();
      const translation = data[0]?.map((part: [string]) => part[0]).join('') || '';

      if (translation && translation !== prompt.promptText) {
        setTranslatedText(translation);
        setIsTranslated(true);
      } else {
        throw new Error('No translation returned');
      }
    } catch {
      // Fallback: MyMemory API
      try {
        const fallbackRes = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(prompt.promptText.slice(0, 1000))}&langpair=autodetect|en`
        );
        const fallbackData = await fallbackRes.json();
        const fallbackTranslation = fallbackData.responseData?.translatedText;
        if (fallbackTranslation) {
          setTranslatedText(fallbackTranslation);
          setIsTranslated(true);
        } else {
          setTranslationError('Could not translate text.');
        }
      } catch {
        setTranslationError('Translation failed. Check network connection.');
      }
    } finally {
      setIsTranslating(false);
    }
  };

  const currentPromptText = isTranslated && translatedText ? translatedText : prompt.promptText;

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(currentPromptText);
    } catch {
      // clipboard blocked
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: `${prompt.model} Prompt — PromptVault`,
          text: prompt.promptText.slice(0, 100),
          url: shareUrl,
        });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // user cancelled or clipboard unavailable
    }
  };

  const handleDownload = async () => {
    if (!safeImgUrl || downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(safeImgUrl, { mode: 'cors' });
      if (!res.ok) throw new Error('Fetch failed');
      const blob = await res.blob();
      const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `promptvault-${prompt.id}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(safeImgUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(false);
    }
  };

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const TRUNCATE = 300;
  const truncated = currentPromptText.length > TRUNCATE && !expanded;
  const displayText = truncated
    ? currentPromptText.slice(0, TRUNCATE) + '…'
    : currentPromptText;

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col">
      {/* Top sticky header bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-6 py-3 bg-[#09090b]/85 backdrop-blur-xl border-b border-white/[0.07] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleBack}
            className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Back to gallery"
          >
            <ArrowLeft size={15} />
          </button>

          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold text-white shrink-0 ring-1 ring-white/15"
            style={{ background: prompt.author.avatarColor }}
          >
            {prompt.author.initials}
          </div>

          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold text-white truncate">
                {prompt.author.name}
              </p>
              <span className="hidden sm:inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/[0.08]">
                {prompt.tab || prompt.model}
              </span>
            </div>
            <p className="text-[11px] text-[#71717a] truncate">{prompt.author.handle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {safeImgUrl && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="h-8 px-3 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] flex items-center gap-1.5 text-[12px] font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              aria-label="Download image"
              title="Download reference image"
            >
              {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              <span className="hidden sm:inline">Download</span>
            </button>
          )}
          <Link
            href="/"
            className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={15} />
          </Link>
        </div>
      </header>

      {/* Two-column studio workspace */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        {/* LEFT: Artwork stage */}
        <div className="relative flex-1 flex items-center justify-center p-5 sm:p-8 lg:p-12 bg-[#070709] min-h-[320px] md:sticky md:top-[57px] md:h-[calc(100vh-57px)] overflow-hidden">
          {/* Subtle ambient radial glow matching artwork */}
          <div
            className="pointer-events-none absolute inset-0 opacity-20 blur-3xl"
            style={{
              background: `radial-gradient(circle at 50% 45%, ${prompt.gradientFrom}55, ${prompt.gradientTo}22 45%, transparent 70%)`,
            }}
          />

          <div
            className="relative rounded-[18px] overflow-hidden w-full border border-white/[0.1] shadow-[0_24px_80px_rgba(0,0,0,0.75)]"
            style={{
              aspectRatio: safeRatio,
              background: `linear-gradient(135deg, ${prompt.gradientFrom}, ${prompt.gradientTo})`,
              maxWidth: '500px',
              maxHeight: '76vh',
            }}
          >
            {safeImgUrl ? (
              <img
                src={safeImgUrl}
                alt={prompt.promptText.slice(0, 80) || `${prompt.model} prompt artwork`}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div
                className="w-full h-full"
                style={{
                  background:
                    'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.22) 0%, transparent 60%)',
                }}
              />
            )}
          </div>
        </div>

        {/* RIGHT: Inspector rail */}
        <aside className="w-full md:w-[390px] lg:w-[420px] shrink-0 bg-[#0d0d11] border-t md:border-t-0 md:border-l border-white/[0.08] flex flex-col">
          <div className="flex-1 overflow-y-auto p-5 pb-24">
            {/* Primary actions */}
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <button
                type="button"
                onClick={() => toggleFavorite(prompt.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-medium border transition-colors cursor-pointer',
                  liked
                    ? 'bg-rose-500/15 border-rose-400/35 text-rose-300'
                    : 'bg-white/[0.03] border-white/[0.08] text-zinc-300 hover:bg-white/[0.07] hover:text-white'
                )}
              >
                <Heart size={14} fill={liked ? 'currentColor' : 'none'} strokeWidth={1.75} />
                {(prompt.likes + (liked ? 1 : 0)).toLocaleString()}
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-medium bg-white/[0.03] border border-white/[0.08] text-zinc-300 hover:bg-white/[0.07] hover:text-white transition-colors cursor-pointer"
              >
                {shared ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
                {shared ? 'Copied!' : 'Share'}
              </button>

              <button
                type="button"
                onClick={copyPrompt}
                className="ml-auto flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-semibold bg-white text-[#09090b] hover:bg-zinc-200 transition-colors cursor-pointer shadow-sm"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Prompt'}
              </button>
            </div>

            {/* Prompt inspector box */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">
                  Prompt
                </p>

                {(isNonEnglish || isTranslated) && (
                  <button
                    type="button"
                    onClick={handleTranslateToggle}
                    disabled={isTranslating}
                    className={cn(
                      'flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors cursor-pointer border',
                      isTranslated
                        ? 'bg-amber-500/15 border-amber-400/30 text-amber-300 hover:bg-amber-500/20'
                        : 'bg-indigo-500/15 border-indigo-400/30 text-indigo-300 hover:bg-indigo-500/20'
                    )}
                    title={isTranslated ? 'Show original prompt' : 'Translate prompt to English'}
                  >
                    {isTranslating ? (
                      <Loader2 size={12} className="animate-spin text-indigo-300" />
                    ) : (
                      <Languages size={12} />
                    )}
                    {isTranslating
                      ? 'Translating…'
                      : isTranslated
                      ? 'Show Original'
                      : 'Translate to English'}
                  </button>
                )}
              </div>

              <div className="bg-[#121218] rounded-[14px] p-4 border border-white/[0.08]">
                <p className="text-[12.5px] text-zinc-200 leading-relaxed font-mono break-words whitespace-pre-wrap">
                  {displayText}
                </p>

                <div className="mt-3 flex items-center justify-between flex-wrap gap-2 pt-2.5 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    {isTranslated && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-300 bg-emerald-500/15 border border-emerald-400/25 px-2 py-0.5 rounded-full">
                        <Sparkles size={10} />
                        Translated to English
                      </span>
                    )}
                    <span className="text-[11px] text-[#52525b]">
                      {currentPromptText.length} chars
                    </span>
                  </div>

                  {currentPromptText.length > TRUNCATE && (
                    <button
                      type="button"
                      onClick={() => setExpanded((v) => !v)}
                      className="text-[12px] text-zinc-400 hover:text-white font-medium transition-colors cursor-pointer ml-auto"
                    >
                      {expanded ? 'Show less ↑' : 'Show more ↓'}
                    </button>
                  )}
                </div>

                {translationError && (
                  <p className="mt-2 text-[11px] text-rose-400 font-medium">
                    {translationError}
                  </p>
                )}
              </div>
            </div>

            {/* Metadata pills */}
            <div className="flex flex-wrap items-center gap-2 mb-6 text-[11px]">
              <span className="font-semibold bg-white/[0.06] text-zinc-200 px-2.5 py-1 rounded-full border border-white/[0.09]">
                {prompt.model}
              </span>
              {prompt.category &&
                prompt.category.toLowerCase() !== prompt.model.toLowerCase() && (
                  <span className="capitalize bg-white/[0.04] text-zinc-300 px-2.5 py-1 rounded-full border border-white/[0.07]">
                    {prompt.category}
                  </span>
                )}
              {prompt.views ? (
                <span className="inline-flex items-center gap-1 text-zinc-400 px-2 py-1">
                  <Eye size={12} className="text-[#71717a]" />
                  <strong className="text-zinc-200 font-semibold">
                    {prompt.views.toLocaleString()}
                  </strong>
                </span>
              ) : null}
              {prompt.createdAt && (
                <span className="inline-flex items-center gap-1 text-[#71717a] px-2 py-1 ml-auto">
                  <Calendar size={11} />
                  {prompt.createdAt}
                </span>
              )}
            </div>

            {/* Related */}
            <RelatedGrid prompts={related} />
          </div>
        </aside>
      </div>
    </div>
  );
}
