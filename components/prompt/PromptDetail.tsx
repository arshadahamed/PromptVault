'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Heart, Share2, Copy, Download, X, ArrowLeft, Check, Languages, Loader2, Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { type Prompt } from '@/lib/types';
import { useApp } from '@/context/AppContext';
import { RelatedGrid } from './RelatedGrid';
import { cn } from '@/lib/utils';

// Helper to detect non-English text (CJK, Cyrillic, Arabic, Thai, Devanagari, Accented non-English, etc.)
function isNonEnglishText(text: string): boolean {
  if (!text) return false;
  // Remove common punctuation/dashes
  const cleaned = text.replace(/[\u2010-\u2027\u2030-\u205E\u20A0-\u20CF\u2100-\u214F]/g, '');
  // CJK, Cyrillic, Arabic, Thai, Devanagari, Greek, Hebrew, Korean
  const nonEnglishPattern = /[\u3000-\u9fff\uac00-\ud7af\u0400-\u04ff\u0600-\u06ff\u0e00-\u0e7f\u0900-\u097f\u0370-\u03ff\u0590-\u05ff\u1100-\u11ff\u3130-\u318f]/;
  const nonAsciiCount = (cleaned.match(/[^\x00-\x7F]/g) || []).length;
  return nonEnglishPattern.test(cleaned) || nonAsciiCount > 3;
}

export function PromptDetail({ prompt, related }: { prompt: Prompt; related: Prompt[] }) {
  const router = useRouter();
  const { favorites, toggleFavorite } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const liked = favorites.includes(prompt.id);

  // Translation state
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslated, setIsTranslated] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  const isNonEnglish = useMemo(() => isNonEnglishText(prompt.promptText), [prompt.promptText]);

  // Handle translation
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

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(currentPromptText);
    } catch {
      // fallback
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const TRUNCATE = 260;
  const truncated = currentPromptText.length > TRUNCATE && !expanded;
  const displayText = truncated
    ? currentPromptText.slice(0, TRUNCATE) + '…'
    : currentPromptText;

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
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider">
                  Prompt
                </p>

                {/* Translate button (shown if text is non-English or already translated) */}
                {(isNonEnglish || isTranslated) && (
                  <button
                    onClick={handleTranslateToggle}
                    disabled={isTranslating}
                    className={cn(
                      'flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full transition-all cursor-pointer border',
                      isTranslated
                        ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                        : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'
                    )}
                    title={isTranslated ? 'Show original prompt' : 'Translate prompt to English'}
                  >
                    {isTranslating ? (
                      <Loader2 size={12} className="animate-spin text-indigo-600" />
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

              <div className="bg-[#f7f4ed] rounded-[12px] p-3.5 relative border border-[#e8e4d9]">
                <p className="text-[12px] text-[#1b1b1b] leading-relaxed font-mono break-words">
                  {displayText}
                </p>

                {/* Badges / Controls below prompt text */}
                <div className="mt-2.5 flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-black/5">
                  {isTranslated && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <Sparkles size={10} />
                      Translated to English
                    </span>
                  )}

                  {currentPromptText.length > TRUNCATE && (
                    <button
                      onClick={() => setExpanded((v) => !v)}
                      className="text-[12px] text-[#6b7280] hover:text-[#1b1b1b] font-medium transition-colors cursor-pointer ml-auto"
                    >
                      {expanded ? 'Show less ↑' : 'Show more ↓'}
                    </button>
                  )}
                </div>

                {translationError && (
                  <p className="mt-2 text-[11px] text-rose-500 font-medium">
                    {translationError}
                  </p>
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
