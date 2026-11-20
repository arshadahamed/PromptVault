'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowUpRight, RotateCcw, Megaphone } from 'lucide-react';
import type { Prompt, Tab, Sort } from '@/lib/types';
import type { SiteSettings } from '@/lib/settings';
import { useApp } from '@/context/AppContext';
import { TabBar, type GridLayoutMode } from '@/components/layout/TabBar';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import { BottomDock } from '@/components/layout/BottomDock';
import { FifaPromoCard } from '@/components/layout/FifaPromoCard';
import { LottieIcon } from '@/components/ui/LottieIcon';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const PAGE_SIZE = 24;

interface Props {
  initialPrompts: Prompt[];
  initialTotal: number;
  tabCounts: Record<string, number>;
  settings: SiteSettings;
}

function HeroHeader({
  total,
  vibeCount,
  activeTab,
  onSearch,
  onPopular,
  onSelectTab,
}: {
  total: number;
  vibeCount: number;
  activeTab: Tab;
  onSearch: () => void;
  onPopular: () => void;
  onSelectTab: (tab: Tab) => void;
}) {
  return (
    <section
      aria-label="Gallery introduction"
      className="relative rounded-2xl overflow-hidden mb-4 px-5 py-5 md:px-7 md:py-6 transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-card)',
        backgroundImage:
          'radial-gradient(120% 140% at 0% 0%, rgba(124,58,237,0.14) 0%, rgba(6,182,212,0.07) 48%, transparent 100%)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Top Row: Live Status Badge + Quick Stats + Theme Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3.5" style={{ borderBottom: '1px solid var(--border-default)' }}>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full"
            style={{
              backgroundColor: 'var(--accent-soft)',
              border: '1px solid var(--accent-border)',
            }}
          >
            <LottieIcon name="sparkles" size={15} />
            <span
              className="text-[11.5px] font-semibold tracking-wide tabular-nums"
              style={{ color: 'var(--accent-text)' }}
            >
              {total.toLocaleString()}+ Verified AI Prompts
            </span>
          </div>

          {vibeCount > 0 && (
            <button
              type="button"
              onClick={() => onSelectTab('Vibe Coding')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-transform hover:scale-[1.02] cursor-pointer"
              style={{
                backgroundColor: 'var(--cyan-soft)',
                border: '1px solid var(--cyan-border)',
                color: 'var(--cyan-text)',
              }}
            >
              <LottieIcon name="code" size={14} />
              <span>{vibeCount.toLocaleString()} Vibe Coding UI Kits</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <ThemeToggle variant="pill" />
        </div>
      </div>

      {/* Main Bento Grid: Headline Left + Command Search & Quick Chips Right */}
      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="max-w-2xl">
          <h1
            className="text-[22px] sm:text-[28px] font-bold leading-[1.16] tracking-tight"
            style={{ fontFamily: 'var(--font-poppins)', color: 'var(--fg-primary)' }}
          >
            Curated AI Prompts &amp;{' '}
            <span className="gradient-text">Visual Inspiration Studio</span>
          </h1>
          <p
            className="text-[13.5px] mt-1.5 leading-relaxed"
            style={{ color: 'var(--fg-muted)' }}
          >
            Copy production-ready prompts, live HTML/TSX components, and multi-shot references for Vibe Coding, ChatGPT, Nanobanana, Midjourney, Flux &amp; Seedance in one click.
          </p>
        </div>

        {/* Right: Quick Command Search + Trending CTA with Lottie Icons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 lg:min-w-[390px]">
          <button
            type="button"
            onClick={onSearch}
            className="flex-1 flex items-center gap-2.5 h-11 px-3.5 rounded-xl text-left transition-all cursor-pointer group theme-surface theme-surface-hover"
          >
            <LottieIcon name="search" size={17} />
            <span
              className="text-[13px] truncate flex-1"
              style={{ color: 'var(--fg-muted)' }}
            >
              Search styles, models, keywords…
            </span>
            <kbd
              className="hidden sm:inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded-md"
              style={{
                backgroundColor: 'var(--bg-muted)',
                color: 'var(--fg-muted)',
                border: '1px solid var(--border-default)',
              }}
            >
              ⌘K
            </kbd>
          </button>

          <button
            type="button"
            onClick={onPopular}
            className="inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl text-[13px] font-semibold text-white transition-all cursor-pointer hover:opacity-95 shrink-0"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              boxShadow: '0 6px 20px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            <LottieIcon name="flame" size={16} primaryColor="#fde047" secondaryColor="#ffffff" />
            <span>Trending</span>
            <ArrowUpRight size={13} className="opacity-85" />
          </button>
        </div>
      </div>

      {/* Quick Model & Vibe Filter Chips (MUI / Ant Design Tag Bar) */}
      <div className="mt-4 pt-3.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar" style={{ borderTop: '1px dashed var(--border-default)' }}>
        <span className="text-[11px] font-semibold uppercase tracking-wider mr-1 shrink-0" style={{ color: 'var(--fg-subtle)' }}>
          Quick Jump:
        </span>
        {(['All', 'Vibe Coding', 'ChatGPT', 'Midjourney', 'Nanobanana', 'Flux', 'Seedance'] as Tab[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onSelectTab(tab)}
              className="px-2.5 py-1 rounded-lg text-[11.5px] font-medium transition-all cursor-pointer whitespace-nowrap shrink-0"
              style={
                isActive
                  ? {
                      backgroundColor: 'var(--accent-soft)',
                      color: 'var(--accent-text)',
                      border: '1px solid var(--accent-border)',
                      fontWeight: 600,
                    }
                  : {
                      backgroundColor: 'var(--bg-muted)',
                      color: 'var(--fg-muted)',
                      border: '1px solid var(--border-default)',
                    }
              }
            >
              {tab}
            </button>
          );
        })}
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
  const [gridLayout, setGridLayout] = useState<GridLayoutMode>('masonry-responsive');

  const filterKey = `${activeTab}:${activeSort}`;
  const isDefaultFilter = activeTab === 'All' && activeSort === 'Featured';

  const [feedCache, setFeedCache] = useState<Record<string, GalleryFeedState>>({});
  const [loadingMore, setLoadingMore] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const activeFilterRef = useRef(filterKey);

  useEffect(() => {
    activeFilterRef.current = filterKey;
  }, [filterKey]);

  // Background idle prefetch for common feeds (Trending, Newest, Vibe Coding) so tab clicks are 0ms
  useEffect(() => {
    const timer = setTimeout(() => {
      const warmTargets: Array<{ tab: Tab; sort: Sort }> = [
        { tab: 'All', sort: 'Popular' },
        { tab: 'All', sort: 'Newest' },
        { tab: 'Vibe Coding', sort: 'Featured' },
      ];
      for (const target of warmTargets) {
        const key = `${target.tab}:${target.sort}`;
        const qs = new URLSearchParams({
          tab: target.tab,
          sort: target.sort,
          page: '1',
        });
        fetch(`/api/prompts?${qs.toString()}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (!data?.prompts) return;
            setFeedCache((prev) => {
              if (prev[key]) return prev;
              return {
                ...prev,
                [key]: {
                  key,
                  pages: [data.prompts],
                  totalCount: data.total ?? data.prompts.length,
                  currentPage: 1,
                  hasMore: Boolean(data.hasMore),
                },
              };
            });
          })
          .catch(() => {});
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Derive active feed synchronously from feedCache (or SSR initialPrompts for All:Featured)
  const activeFeed = feedCache[filterKey];
  const isFeedCurrent = Boolean(activeFeed);
  const pages = activeFeed
    ? activeFeed.pages
    : isDefaultFilter
      ? [initialPrompts]
      : [];
  const totalCount = activeFeed
    ? activeFeed.totalCount
    : isDefaultFilter
      ? initialTotal
      : (tabCounts[activeTab] ?? initialTotal);
  const currentPage = activeFeed ? activeFeed.currentPage : 1;
  const hasMore = activeFeed
    ? activeFeed.hasMore
    : isDefaultFilter
      ? initialPrompts.length < initialTotal
      : false;
  const loading = !isDefaultFilter && !isFeedCurrent;

  // Fetch page 1 whenever a non-default tab/sort filter becomes active (instant if cached in feedCache!)
  useEffect(() => {
    if (isDefaultFilter || feedCache[filterKey]) return;

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
        setFeedCache((prev) => ({
          ...prev,
          [filterKey]: {
            key: filterKey,
            pages: [prompts],
            totalCount: total,
            currentPage: 1,
            hasMore: Boolean(data?.hasMore),
          },
        }));
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          setFeedCache((prev) => ({
            ...prev,
            [filterKey]: {
              key: filterKey,
              pages: [[]],
              totalCount: 0,
              currentPage: 1,
              hasMore: false,
            },
          }));
        }
      });

    return () => controller.abort();
  }, [activeTab, activeSort, filterKey, isDefaultFilter, feedCache]);

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

      setFeedCache((prev) => {
        const existing = prev[filterKey];
        const basePages = existing
          ? existing.pages
          : isDefaultFilter
            ? [initialPrompts]
            : [];
        const seen = new Set(basePages.flat().map((p) => p.id));
        const deduped = nextItems.filter((p) => !seen.has(p.id));
        const nextPages = deduped.length > 0 ? [...basePages, deduped] : basePages;

        return {
          ...prev,
          [filterKey]: {
            key: filterKey,
            pages: nextPages,
            totalCount: data.total ?? totalCount,
            currentPage: nextPage,
            hasMore: Boolean(data.hasMore) && nextItems.length >= PAGE_SIZE / 2,
          },
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

      {/* Optional Announcement Banner */}
      {settings.announcementBar?.trim() && (
        <div
          className="px-4 py-2 text-center text-[12px] font-semibold text-white flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
          }}
        >
          <Megaphone size={13} className="shrink-0" />
          <span>{settings.announcementBar}</span>
        </div>
      )}

      <div className="px-4 md:px-6 pt-4 md:pt-5 pb-28 max-w-[1680px] mx-auto">
        <HeroHeader
          total={tabCounts.All ?? initialTotal}
          vibeCount={tabCounts['Vibe Coding'] ?? 0}
          activeTab={activeTab}
          onSearch={() => openModal('search')}
          onPopular={() => setGalleryFilter({ sort: 'Popular' })}
          onSelectTab={(t) => setGalleryFilter({ tab: t })}
        />

        <TabBar
          activeTab={activeTab}
          onTab={(t: Tab) => setGalleryFilter({ tab: t })}
          activeSort={activeSort}
          onSort={(s: Sort) => setGalleryFilter({ sort: s })}
          tabCounts={tabCounts}
          totalCount={totalCount}
          gridLayout={gridLayout}
          onGridLayoutChange={setGridLayout}
        />

        {!loading && totalLoaded === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl theme-surface"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
              style={{
                backgroundColor: 'var(--accent-soft)',
                border: '1px solid var(--accent-border)',
              }}
            >
              <LottieIcon name="empty" size={28} />
            </div>
            <p className="text-[15px] font-semibold" style={{ color: 'var(--fg-primary)' }}>
              No prompts found in {activeTab}
            </p>
            <p className="text-[13px] mt-1 mb-5" style={{ color: 'var(--fg-muted)' }}>
              Try switching models or resetting filters to browse the full gallery.
            </p>
            <button
              type="button"
              onClick={() => setGalleryFilter({ tab: 'All', sort: 'Featured' })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer theme-surface theme-surface-hover"
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
            className={gridLayout}
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
              className="px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all cursor-pointer disabled:opacity-50 theme-surface theme-surface-hover"
            >
              {loadingMore
                ? 'Loading more prompts…'
                : `Load more (${(totalCount - totalLoaded).toLocaleString()} remaining)`}
            </button>
          </div>
        )}

        {!loading && !hasMore && totalLoaded > 0 && (
          <p className="text-center text-[12px] mt-8" style={{ color: 'var(--fg-subtle)' }}>
            Showing all {totalLoaded.toLocaleString()} prompts
          </p>
        )}
      </div>

      <BottomDock />
      <FifaPromoCard settings={settings} />
    </div>
  );
}
