'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search, Sparkles, ArrowUpRight, Flame, RotateCcw } from 'lucide-react';
import type { Prompt, Tab, Sort } from '@/lib/types';
import type { SiteSettings } from '@/lib/settings';
import { useApp } from '@/context/AppContext';
import { TabBar } from '@/components/layout/TabBar';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import { BottomDock } from '@/components/layout/BottomDock';
import { FifaPromoCard } from '@/components/layout/FifaPromoCard';

const PAGE_SIZE = 48;

interface Props {
  initialPrompts: Prompt[];
  initialTotal: number;
  tabCounts: Record<string, number>;
  settings: SiteSettings;
}

function HeroHeader({
  total,
  onSearch,
  onPopular,
}: {
  total: number;
  onSearch: () => void;
  onPopular: () => void;
}) {
  return (
    <section
      aria-label="Gallery introduction"
      className="relative rounded-[20px] overflow-hidden mb-4 px-5 py-5 md:px-7 md:py-6"
      style={{
        background:
          'radial-gradient(120% 140% at 0% 0%, rgba(124,58,237,0.16) 0%, rgba(6,182,212,0.06) 45%, rgba(17,17,22,0.92) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07), 0 12px 40px -16px rgba(0,0,0,0.6)',
      }}
    >
      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span className="text-[11px] font-semibold tracking-wide text-zinc-200 tabular-nums">
              {total.toLocaleString()}+ Verified Prompts
            </span>
          </div>

          <h1
            className="text-[22px] sm:text-[27px] font-bold text-white leading-[1.18] tracking-tight"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            Curated AI Prompts &amp;{' '}
            <span className="gradient-text">Visual Inspiration</span>
          </h1>
          <p className="text-[13.5px] text-zinc-400 mt-1.5 leading-relaxed">
            Copy production-ready prompts &amp; code for Vibe Coding websites, ChatGPT, Nanobanana, Midjourney, Flux &amp; Seedance in one click.
          </p>
        </div>

        {/* Right: Quick Command Search + Popular CTA */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 lg:min-w-[360px]">
          <button
            type="button"
            onClick={onSearch}
            className="flex-1 flex items-center gap-2.5 h-11 px-3.5 rounded-[12px] bg-[#09090b]/75 hover:bg-[#09090b] border border-white/[0.1] hover:border-violet-400/40 text-left transition-all cursor-pointer group"
          >
            <Search size={15} className="text-zinc-400 group-hover:text-cyan-400 transition-colors shrink-0" />
            <span className="text-[13px] text-zinc-400 group-hover:text-zinc-200 truncate flex-1">
              Search styles, models, keywords…
            </span>
            <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded-[6px] bg-white/[0.06] text-zinc-400 border border-white/[0.08]">
              ⌘K
            </kbd>
          </button>

          <button
            type="button"
            onClick={onPopular}
            className="inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-[12px] text-[13px] font-semibold text-white transition-all cursor-pointer hover:opacity-95 shrink-0"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              boxShadow: '0 6px 20px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            <Flame size={14} />
            <span>Trending</span>
            <ArrowUpRight size={13} className="opacity-80" />
          </button>
        </div>
      </div>
    </section>
  );
}

interface GalleryFeedState {
  key: string;
  pages: Prompt[][];
  totalCount: number;
  currentPage: number;
  hasMore: boolean;
}

export function GalleryClient({ initialPrompts, initialTotal, tabCounts, settings }: Props) {
  const { activeTab, activeSort, setGalleryFilter, openModal } = useApp();

  const filterKey = `${activeTab}:${activeSort}`;
  const isDefaultFilter = activeTab === 'All' && activeSort === 'Featured';

  const [feedState, setFeedState] = useState<GalleryFeedState | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const activeFilterRef = useRef(filterKey);

  useEffect(() => {
    activeFilterRef.current = filterKey;
  }, [filterKey]);

  // Derive active feed synchronously from feedState (or SSR initialPrompts for All:Featured)
  const isFeedCurrent = feedState?.key === filterKey;
  const pages = isFeedCurrent
    ? feedState.pages
    : isDefaultFilter
      ? [initialPrompts]
      : [];
  const totalCount = isFeedCurrent
    ? feedState.totalCount
    : isDefaultFilter
      ? initialTotal
      : (tabCounts[activeTab] ?? initialTotal);
  const currentPage = isFeedCurrent ? feedState.currentPage : 1;
  const hasMore = isFeedCurrent
    ? feedState.hasMore
    : isDefaultFilter
      ? initialPrompts.length < initialTotal
      : false;
  const loading = !isDefaultFilter && !isFeedCurrent;

  // Fetch page 1 whenever a non-default tab/sort filter becomes active
  useEffect(() => {
    if (isDefaultFilter || feedState?.key === filterKey) return;

    const controller = new AbortController();
    const qs = new URLSearchParams({
      tab: activeTab,
      sort: activeSort,
      page: '1',
    });

    fetch(`/api/prompts?${qs.toString()}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (controller.signal.aborted) return;
        const prompts: Prompt[] = data?.prompts ?? [];
        const total: number = data?.total ?? prompts.length;
        setFeedState({
          key: filterKey,
          pages: [prompts],
          totalCount: total,
          currentPage: 1,
          hasMore: Boolean(data?.hasMore),
        });
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          setFeedState({
            key: filterKey,
            pages: [[]],
            totalCount: 0,
            currentPage: 1,
            hasMore: false,
          });
        }
      });

    return () => controller.abort();
  }, [activeTab, activeSort, filterKey, isDefaultFilter, feedState?.key]);

  const loadNextPage = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    const nextPage = currentPage + 1;
    setLoadingMore(true);

    try {
      const qs = new URLSearchParams({
        tab: activeTab,
        sort: activeSort,
        page: String(nextPage),
      });
      const res = await fetch(`/api/prompts?${qs.toString()}`);
      if (!res.ok || activeFilterRef.current !== filterKey) return;
      const data = await res.json();
      if (activeFilterRef.current !== filterKey) return;
      const nextItems: Prompt[] = data.prompts ?? [];

      setFeedState((prev) => {
        const basePages =
          prev && prev.key === filterKey
            ? prev.pages
            : isDefaultFilter
              ? [initialPrompts]
              : [];
        const seen = new Set(basePages.flat().map((p) => p.id));
        const deduped = nextItems.filter((p) => !seen.has(p.id));
        const nextPages = deduped.length > 0 ? [...basePages, deduped] : basePages;

        return {
          key: filterKey,
          pages: nextPages,
          totalCount: data.total ?? totalCount,
          currentPage: nextPage,
          hasMore: Boolean(data.hasMore) && nextItems.length >= PAGE_SIZE / 2,
        };
      });
    } finally {
      setLoadingMore(false);
    }
  }, [
    activeTab,
    activeSort,
    currentPage,
    filterKey,
    hasMore,
    initialPrompts,
    isDefaultFilter,
    loading,
    loadingMore,
    totalCount,
  ]);

  // Infinite scroll trigger
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadNextPage();
      },
      { rootMargin: '700px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadNextPage]);

  const totalLoaded = pages.reduce((sum, batch) => sum + batch.length, 0);

  return (
    <div className="relative">
      {/* SEO structural quick-links */}
      <div className="sr-only">
        <h1>Free AI Prompt Gallery — ChatGPT, Nanobanana, Midjourney, Flux</h1>
        <p>Browse {initialTotal.toLocaleString()}+ free AI prompts and visual inspiration.</p>
        <nav aria-label="Model categories">
          <Link href="/?tab=Vibe%20Coding">Vibe Coding Website Prompts &amp; Code</Link>
          <Link href="/?tab=ChatGPT">ChatGPT Prompts</Link>
          <Link href="/?tab=Nanobanana">Nanobanana Prompts</Link>
          <Link href="/?tab=Midjourney">Midjourney Prompts</Link>
          <Link href="/?tab=Flux">Flux Prompts</Link>
          <Link href="/?tab=Seedance">Seedance Prompts</Link>
        </nav>
      </div>

      <div className="px-4 md:px-6 pt-4 md:pt-5 pb-28 max-w-[1680px] mx-auto">
        <HeroHeader
          total={tabCounts.All ?? initialTotal}
          onSearch={() => openModal('search')}
          onPopular={() => setGalleryFilter({ sort: 'Popular' })}
        />

        <TabBar
          activeTab={activeTab}
          onTab={(t: Tab) => setGalleryFilter({ tab: t })}
          activeSort={activeSort}
          onSort={(s: Sort) => setGalleryFilter({ sort: s })}
          tabCounts={tabCounts}
          totalCount={totalCount}
        />

        {!loading && totalLoaded === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-[20px] border border-white/[0.07] bg-[#111115]">
            <Sparkles size={28} className="text-violet-400 mb-3" />
            <p className="text-[15px] font-semibold text-white">No prompts found in {activeTab}</p>
            <p className="text-[13px] text-zinc-400 mt-1 mb-5">
              Try switching models or resetting filters to browse the full gallery.
            </p>
            <button
              type="button"
              onClick={() => setGalleryFilter({ tab: 'All', sort: 'Featured' })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/10 transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              Reset filters
            </button>
          </div>
        ) : (
          <GalleryGrid
            pages={pages}
            loading={loading}
            loadingMore={loadingMore}
            className="masonry-responsive"
          />
        )}

        {/* Infinite scroll sentinel & manual fallback */}
        <div ref={sentinelRef} className="h-4" aria-hidden="true" />

        {!loading && hasMore && (
          <div className="flex justify-center mt-8">
            <button
              type="button"
              onClick={loadNextPage}
              disabled={loadingMore}
              className="px-5 py-2.5 rounded-full text-[13px] font-semibold text-zinc-200 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] transition-all cursor-pointer disabled:opacity-50"
            >
              {loadingMore
                ? 'Loading more prompts…'
                : `Load more (${(totalCount - totalLoaded).toLocaleString()} remaining)`}
            </button>
          </div>
        )}

        {!loading && !hasMore && totalLoaded > 0 && (
          <p className="text-center text-[12px] text-[#71717a] mt-8">
            Showing all {totalLoaded.toLocaleString()} prompts
          </p>
        )}
      </div>

      <BottomDock />
      <FifaPromoCard settings={settings} />
    </div>
  );
}
