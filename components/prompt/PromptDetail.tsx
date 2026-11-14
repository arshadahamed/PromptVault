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
  Code2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileCode2,
  Image as ImageIcon,
  Monitor,
  Smartphone,
  WrapText,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { type Prompt } from '@/lib/types';
import { useApp } from '@/context/AppContext';
import { safeAspectRatio } from '@/lib/prompts';
import { isSafeHref } from '@/lib/security';
import {
  CODE_LANGUAGES,
  getCodeFileExtension,
  normalizeCodeLanguage,
} from '@/lib/vibe-coding';
import { RelatedGrid } from './RelatedGrid';
import { cn } from '@/lib/utils';

type StageMode = 'photos' | 'code' | 'preview';

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
  const [copiedCode, setCopiedCode] = useState(false);
  const [shared, setShared] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const isVibeCoding =
    prompt.tab === 'Vibe Coding' ||
    prompt.category === 'Vibe Coding' ||
    Boolean(prompt.codeSnippet?.trim()) ||
    (prompt.stackTags?.length ?? 0) > 0;
  const [photoFit, setPhotoFit] = useState<'cover' | 'contain'>(() =>
    isVibeCoding ? 'contain' : 'cover'
  );
  const [wrapCode, setWrapCode] = useState(false);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>('desktop');
  const recordedIdRef = useRef<string | null>(null);

  const photos = useMemo(() => {
    const candidates = [prompt.localImg, ...(prompt.galleryImages ?? [])];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of candidates) {
      if (!raw || !isSafeHref(raw) || seen.has(raw) || failedUrls[raw]) continue;
      seen.add(raw);
      out.push(raw);
    }
    return out;
  }, [prompt.localImg, prompt.galleryImages, failedUrls]);

  const codeSnippet = prompt.codeSnippet?.trim() ? prompt.codeSnippet : '';
  const hasCode = codeSnippet.length > 0;
  const normalizedLang = useMemo(
    () => normalizeCodeLanguage(prompt.codeLanguage || (hasCode ? 'tsx' : '')),
    [prompt.codeLanguage, hasCode]
  );
  const langMeta = useMemo(
    () => CODE_LANGUAGES.find((l) => l.value === normalizedLang),
    [normalizedLang]
  );
  const canPreviewHtml = hasCode && normalizedLang === 'html';
  const [stageMode, setStageMode] = useState<StageMode>(() =>
    photos.length === 0 && hasCode ? (canPreviewHtml ? 'preview' : 'code') : 'photos'
  );

  const clampedPhotoIdx = photos.length > 0 ? Math.min(activePhotoIdx, photos.length - 1) : 0;
  const safeImgUrl = photos[clampedPhotoIdx] ?? null;
  const safePreviewUrl = prompt.previewUrl && isSafeHref(prompt.previewUrl) ? prompt.previewUrl : null;
  const stackTags = prompt.stackTags ?? [];

  const liked = favorites.includes(prompt.id);
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

  const copyCode = async () => {
    if (!codeSnippet) return;
    try {
      await navigator.clipboard.writeText(codeSnippet);
    } catch {
      // clipboard blocked
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const downloadCode = () => {
    if (!codeSnippet) return;
    const ext = getCodeFileExtension(normalizedLang);
    const slug = (prompt.title || prompt.id || 'vibe-component')
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48);
    const blob = new Blob([codeSnippet], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug || 'promptvault'}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const codeLines = useMemo(() => (hasCode ? codeSnippet.split(/\r?\n/) : []), [hasCode, codeSnippet]);

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
                {prompt.title || prompt.author.name}
              </p>
              <span className="hidden sm:inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/[0.08]">
                {prompt.tab || prompt.model}
              </span>
              {hasCode && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/25">
                  <Code2 size={10} />
                  {langMeta?.label || normalizedLang.toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#71717a] truncate">
              {prompt.title ? `${prompt.author.name} · ${prompt.author.handle}` : prompt.author.handle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {safePreviewUrl && (
            <a
              href={safePreviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 px-3 rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/25 flex items-center gap-1.5 text-[12px] font-medium text-cyan-200 hover:text-white transition-colors"
            >
              <ExternalLink size={12.5} />
              <span className="hidden sm:inline">Live Demo</span>
            </a>
          )}
          {hasCode && (
            <button
              type="button"
              onClick={downloadCode}
              className="h-8 px-3 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] flex items-center gap-1.5 text-[12px] font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Download source code file"
            >
              <FileCode2 size={13} />
              <span className="hidden md:inline">.{getCodeFileExtension(normalizedLang)}</span>
            </button>
          )}
          {safeImgUrl && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="h-8 px-3 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] flex items-center gap-1.5 text-[12px] font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              aria-label="Download image"
              title="Download active reference image"
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
        {/* LEFT: Artwork / Multi-Photo / Code / HTML Preview stage */}
        <div className="relative flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10 bg-[#070709] min-h-[340px] md:sticky md:top-[57px] md:h-[calc(100vh-57px)] overflow-hidden">
          {/* Subtle ambient radial glow matching artwork */}
          <div
            className="pointer-events-none absolute inset-0 opacity-20 blur-3xl"
            style={{
              background: `radial-gradient(circle at 50% 45%, ${prompt.gradientFrom}55, ${prompt.gradientTo}22 45%, transparent 70%)`,
            }}
          />

          {/* Stage toolbar (shown for Vibe Coding, code snippets, or multi-photo galleries) */}
          {(hasCode || photos.length > 1 || isVibeCoding) && (
            <div className="relative z-10 w-full max-w-4xl flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="inline-flex items-center p-1 rounded-xl bg-[#111116]/90 border border-white/[0.08] backdrop-blur-md">
                {(photos.length > 0 || !hasCode) && (
                  <button
                    type="button"
                    onClick={() => setStageMode('photos')}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer',
                      stageMode === 'photos'
                        ? 'bg-white text-[#09090b] shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    )}
                  >
                    <ImageIcon size={13} />
                    {photos.length > 1 ? `Photos (${photos.length})` : 'Preview'}
                  </button>
                )}

                {hasCode && (
                  <button
                    type="button"
                    onClick={() => setStageMode('code')}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer',
                      stageMode === 'code'
                        ? 'bg-cyan-400 text-[#09090b] shadow-sm font-semibold'
                        : 'text-zinc-400 hover:text-white'
                    )}
                  >
                    <Code2 size={13} />
                    Code
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.2 rounded uppercase font-mono',
                        stageMode === 'code' ? 'bg-black/15 text-[#09090b]' : 'bg-white/[0.07] text-zinc-300'
                      )}
                    >
                      {normalizedLang}
                    </span>
                  </button>
                )}

                {canPreviewHtml && (
                  <button
                    type="button"
                    onClick={() => setStageMode('preview')}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer',
                      stageMode === 'preview'
                        ? 'bg-emerald-400 text-[#09090b] shadow-sm font-semibold'
                        : 'text-zinc-400 hover:text-white'
                    )}
                  >
                    <Monitor size={13} />
                    Live HTML
                  </button>
                )}
              </div>

              {/* Contextual right-side stage controls */}
              <div className="inline-flex items-center gap-1.5">
                {stageMode === 'photos' && safeImgUrl && (
                  <>
                    {photos.length > 1 && (
                      <span className="text-[11px] font-medium text-zinc-400 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-lg tabular-nums">
                        {clampedPhotoIdx + 1} / {photos.length}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setPhotoFit((m) => (m === 'contain' ? 'cover' : 'contain'))}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                      title={photoFit === 'contain' ? 'Switch to fill crop' : 'Fit full screenshot'}
                    >
                      {photoFit === 'contain' ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
                      {photoFit === 'contain' ? 'Fit' : 'Fill'}
                    </button>
                  </>
                )}

                {stageMode === 'code' && hasCode && (
                  <>
                    <button
                      type="button"
                      onClick={() => setWrapCode((w) => !w)}
                      className={cn(
                        'inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer',
                        wrapCode
                          ? 'bg-white/[0.12] border-white/[0.18] text-white'
                          : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white'
                      )}
                    >
                      <WrapText size={12} />
                      Wrap
                    </button>
                    <button
                      type="button"
                      onClick={copyCode}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-white text-[#09090b] hover:bg-zinc-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                      {copiedCode ? 'Copied Code!' : 'Copy Code'}
                    </button>
                  </>
                )}

                {stageMode === 'preview' && canPreviewHtml && (
                  <div className="inline-flex items-center p-0.5 rounded-lg bg-[#111116] border border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setPreviewViewport('desktop')}
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer',
                        previewViewport === 'desktop' ? 'bg-white/[0.12] text-white' : 'text-zinc-400 hover:text-white'
                      )}
                    >
                      <Monitor size={12} />
                      Desktop
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewViewport('mobile')}
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer',
                        previewViewport === 'mobile' ? 'bg-white/[0.12] text-white' : 'text-zinc-400 hover:text-white'
                      )}
                    >
                      <Smartphone size={12} />
                      Mobile
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STAGE BODY */}
          {stageMode === 'code' && hasCode ? (
            <div className="relative z-10 w-full max-w-4xl flex-1 min-h-0 max-h-[72vh] rounded-[16px] bg-[#0b0b10] border border-white/[0.1] shadow-[0_24px_80px_rgba(0,0,0,0.75)] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#121218] border-b border-white/[0.07] shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <FileCode2 size={14} className="text-cyan-400 shrink-0" />
                  <span className="text-[12px] font-mono text-zinc-200 truncate">
                    {(prompt.title || 'vibe-component')
                      .toLowerCase()
                      .replace(/[^a-z0-9-_]+/g, '-')
                      .replace(/^-|-$/g, '') || 'component'}
                    .{getCodeFileExtension(normalizedLang)}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                    {codeLines.length} lines
                  </span>
                </div>
                <button
                  type="button"
                  onClick={downloadCode}
                  className="inline-flex items-center gap-1 text-[11px] text-zinc-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0"
                >
                  <Download size={11.5} />
                  Download
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 font-mono text-[12.5px] leading-[1.6]">
                <table className="w-full border-collapse">
                  <tbody>
                    {codeLines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.025]">
                        <td className="select-none text-right pr-4 text-[11px] text-zinc-600 align-top w-10 tabular-nums">
                          {idx + 1}
                        </td>
                        <td
                          className={cn(
                            'text-zinc-200 align-top',
                            wrapCode ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'
                          )}
                        >
                          {line || ' '}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : stageMode === 'preview' && canPreviewHtml ? (
            <div
              className={cn(
                'relative z-10 w-full flex-1 min-h-0 max-h-[74vh] rounded-[16px] bg-[#111116] border border-white/[0.1] shadow-[0_24px_80px_rgba(0,0,0,0.75)] flex flex-col overflow-hidden transition-[max-width] duration-200',
                previewViewport === 'mobile' ? 'max-w-[390px]' : 'max-w-4xl'
              )}
            >
              <div className="flex items-center justify-between px-3.5 py-2 bg-[#16161d] border-b border-white/[0.08] shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
                </div>
                <span className="text-[11px] font-mono text-zinc-400 truncate px-3">
                  sandboxed-html-preview · static css/html
                </span>
                <span className="text-[10px] text-emerald-300/90 font-medium">
                  {previewViewport === 'mobile' ? '390px' : '100%'}
                </span>
              </div>
              <iframe
                sandbox=""
                title={prompt.title || `${prompt.model} HTML preview`}
                srcDoc={codeSnippet}
                className="flex-1 w-full bg-white border-0"
              />
            </div>
          ) : (
            <div className="relative z-10 w-full flex flex-col items-center">
              <div
                className={cn(
                  'relative rounded-[18px] overflow-hidden w-full border border-white/[0.1] shadow-[0_24px_80px_rgba(0,0,0,0.75)]',
                  isVibeCoding || photos.length > 1 ? 'max-w-4xl' : ''
                )}
                style={
                  isVibeCoding || photos.length > 1
                    ? {
                        background:
                          photoFit === 'contain'
                            ? '#0e0e13'
                            : `linear-gradient(135deg, ${prompt.gradientFrom}, ${prompt.gradientTo})`,
                        height: photos.length > 1 ? 'min(60vh, 560px)' : 'min(68vh, 620px)',
                      }
                    : {
                        aspectRatio: safeRatio,
                        background: `linear-gradient(135deg, ${prompt.gradientFrom}, ${prompt.gradientTo})`,
                        maxWidth: '500px',
                        maxHeight: '76vh',
                      }
                }
              >
                {safeImgUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={safeImgUrl}
                    alt={
                      prompt.title ||
                      prompt.promptText.slice(0, 80) ||
                      `${prompt.model} prompt artwork`
                    }
                    className={cn(
                      'w-full h-full',
                      photoFit === 'contain' ? 'object-contain p-2' : 'object-cover'
                    )}
                    onError={() =>
                      setFailedUrls((prev) => ({ ...prev, [safeImgUrl]: true }))
                    }
                  />
                ) : (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center gap-2 text-center p-6"
                    style={{
                      background:
                        'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.22) 0%, transparent 60%)',
                    }}
                  >
                    {hasCode && (
                      <>
                        <Code2 size={28} className="text-white/80" />
                        <p className="text-[13px] font-medium text-white/90">
                          Code & Prompt Package
                        </p>
                      </>
                    )}
                  </div>
                )}

                {photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActivePhotoIdx((i) => (i - 1 + photos.length) % photos.length)
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/65 hover:bg-black/85 border border-white/15 flex items-center justify-center text-white transition-colors cursor-pointer backdrop-blur-md"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePhotoIdx((i) => (i + 1) % photos.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/65 hover:bg-black/85 border border-white/15 flex items-center justify-center text-white transition-colors cursor-pointer backdrop-blur-md"
                      aria-label="Next photo"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </div>

              {/* Multi-photo thumbnail strip */}
              {photos.length > 1 && (
                <div className="mt-3 flex items-center gap-2 overflow-x-auto max-w-4xl py-1 px-1">
                  {photos.map((url, idx) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setActivePhotoIdx(idx)}
                      className={cn(
                        'relative w-16 h-11 rounded-lg overflow-hidden border shrink-0 transition-all cursor-pointer bg-[#121218]',
                        idx === clampedPhotoIdx
                          ? 'border-cyan-400 ring-2 ring-cyan-400/30 opacity-100'
                          : 'border-white/[0.1] opacity-60 hover:opacity-95'
                      )}
                      aria-label={`View photo ${idx + 1}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Inspector rail */}
        <aside className="w-full md:w-[390px] lg:w-[420px] shrink-0 bg-[#0d0d11] border-t md:border-t-0 md:border-l border-white/[0.08] flex flex-col">
          <div className="flex-1 overflow-y-auto p-5 pb-24">
            {/* Optional Component / Design Title & Stack Tags */}
            {(prompt.title || stackTags.length > 0) && (
              <div className="mb-4 pb-4 border-b border-white/[0.07]">
                {prompt.title && (
                  <h1 className="text-[17px] font-semibold text-white tracking-[-0.015em] leading-snug">
                    {prompt.title}
                  </h1>
                )}
                {stackTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {stackTags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-400/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

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

              {hasCode && (
                <button
                  type="button"
                  onClick={copyCode}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-200 transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check size={14} /> : <Code2 size={14} />}
                  {copiedCode ? 'Copied!' : 'Copy Code'}
                </button>
              )}

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
              {hasCode && (
                <span className="inline-flex items-center gap-1 font-medium bg-cyan-500/10 text-cyan-300 px-2.5 py-1 rounded-full border border-cyan-400/20">
                  <Code2 size={11} />
                  {langMeta?.label || normalizedLang.toUpperCase()}
                </span>
              )}
              {photos.length > 1 && (
                <span className="inline-flex items-center gap-1 bg-white/[0.04] text-zinc-300 px-2.5 py-1 rounded-full border border-white/[0.07]">
                  <ImageIcon size={11} />
                  {photos.length} photos
                </span>
              )}
              {safePreviewUrl && (
                <a
                  href={safePreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 px-2.5 py-1 rounded-full border border-white/[0.08] transition-colors"
                >
                  <ExternalLink size={11} />
                  Live Demo
                </a>
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
