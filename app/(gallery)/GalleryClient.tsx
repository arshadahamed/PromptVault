'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Prompt, Tab, Sort } from '@/lib/types';
import { TabBar } from '@/components/layout/TabBar';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import { BottomDock } from '@/components/layout/BottomDock';
import { FifaPromoCard } from '@/components/layout/FifaPromoCard';
import { Sparkles, TrendingUp, Users } from 'lucide-react';

function HeroBanner({ total }: { total: number }) {
  return (
    <div
      className="relative rounded-[20px] overflow-hidden mb-5 p-5"
      style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(6,182,212,0.08) 100%)',
        border: '1px solid rgba(124,58,237,0.2)',
      }}
    >
      {/* Animated orbs */}
      <div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full anim-orb-pulse pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full anim-orb-pulse pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)', animationDelay: '2s' }}
      />

      <div className="relative flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div
              className="w-6 h-6 rounded-[7px] flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
            >
              <Sparkles size={13} className="text-white" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-widest gradient-text">
              AI Prompt Gallery
            </span>
          </div>
          <h1 className="text-[22px] md:text-[26px] font-bold text-white leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Discover & Copy{' '}
            <span className="gradient-text">Free AI Prompts</span>
          </h1>
          <p className="text-[13px] mt-1" style={{ color: '#8b8b99' }}>
            ChatGPT · Midjourney · Gemini · Flux · and more
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 flex-wrap">
          <Stat icon={<Sparkles size={14} />} value={total.toLocaleString()} label="Prompts" color="#a855f7" />
          <Stat icon={<TrendingUp size={14} />} value="Daily" label="Updates" color="#06b6d4" />
          <Stat icon={<Users size={14} />} value="Free" label="Forever" color="#10b981" />
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-[12px]"
      style={{ background: `${color}11`, border: `1px solid ${color}22` }}
    >
      <span style={{ color }}>{icon}</span>
      <div>
        <div className="text-[14px] font-bold text-white leading-tight">{value}</div>
        <div className="text-[10px] font-medium" style={{ color: '#5c5c6b' }}>{label}</div>
      </div>
    </div>
  );
}

export function GalleryClient({ initialPrompts, initialTotal }: { initialPrompts: Prompt[]; initialTotal: number }) {
  const [tab,  setTab]  = useState<Tab>('All');
  const [sort, setSort] = useState<Sort>('Featured');

  const filtered = useMemo(() => {
    const base = tab === 'All' ? initialPrompts : initialPrompts.filter((p) => p.tab === tab);
    if (sort === 'Popular') return [...base].sort((a, b) => b.likes - a.likes);
    if (sort === 'Newest')  return [...base].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return base;
  }, [initialPrompts, tab, sort]);

  const tabTotal = tab === 'All' ? initialTotal : filtered.length;

  return (
    <div className="relative">
      {/* SEO hidden content */}
      <div className="sr-only">
        <h1>Free GPT Image 2 &amp; AI Prompt Gallery</h1>
        <p>Browse {initialTotal}+ free AI prompts for ChatGPT, Midjourney, Gemini, Nanobanana, and more.</p>
        <nav aria-label="Quick links">
          <Link href="/?tab=ChatGPT">ChatGPT Prompts</Link>
          <Link href="/?tab=Midjourney">Midjourney Prompts</Link>
          <Link href="/?tab=Gemini">Gemini Prompts</Link>
          <Link href="/?tab=Nanobanana">Nanobanana Prompts</Link>
        </nav>
      </div>

      <div className="px-4 md:px-5 pt-4 md:pt-5 pb-28">
        {/* Hero banner */}
        <HeroBanner total={initialTotal} />

        {/* Tab + sort bar */}
        <TabBar
          activeTab={tab}
          onTab={setTab}
          activeSort={sort}
          onSort={setSort}
          totalCount={tabTotal}
        />

        {/* Gallery grid */}
        <GalleryGrid prompts={filtered} className="masonry-3" />
      </div>

      <BottomDock />
      <FifaPromoCard />
    </div>
  );
}
