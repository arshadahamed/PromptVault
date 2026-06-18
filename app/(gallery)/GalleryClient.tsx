'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Prompt, Tab, Sort } from '@/lib/types';
import { TabBar } from '@/components/layout/TabBar';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import { BottomDock } from '@/components/layout/BottomDock';
import { FifaPromoCard } from '@/components/layout/FifaPromoCard';

export function GalleryClient({ prompts }: { prompts: Prompt[] }) {
  const [tab,  setTab]  = useState<Tab>('All');
  const [sort, setSort] = useState<Sort>('Featured');

  const filtered = useMemo(() => {
    const base = tab === 'All' ? prompts : prompts.filter((p) => p.tab === tab);
    if (sort === 'Popular') return [...base].sort((a, b) => b.likes - a.likes);
    if (sort === 'Newest')  return [...base].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return base;
  }, [prompts, tab, sort]);

  return (
    <div className="relative">
      <div className="sr-only">
        <h1>Free GPT Image 2 &amp; AI Prompt Gallery</h1>
        <p>Browse 750+ free AI prompts for ChatGPT, Midjourney, Gemini, Nanobanana, and more.</p>
        <nav aria-label="Quick links">
          <Link href="/?tab=ChatGPT">ChatGPT Prompts</Link>
          <Link href="/?tab=Midjourney">Midjourney Prompts</Link>
          <Link href="/?tab=Gemini">Gemini Prompts</Link>
          <Link href="/?tab=Nanobanana">Nanobanana Prompts</Link>
        </nav>
      </div>
      <div className="px-4 md:px-5 pt-4 md:pt-5 pb-28">
        <TabBar activeTab={tab} onTab={setTab} activeSort={sort} onSort={setSort} />
        <GalleryGrid prompts={filtered} className="masonry-3" />
      </div>
      <BottomDock />
      <FifaPromoCard />
    </div>
  );
}
