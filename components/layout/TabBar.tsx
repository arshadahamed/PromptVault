'use client';
import { cn } from '@/lib/utils';
import { type Tab, type Sort } from '@/lib/types';

const TABS: Tab[] = ['All', 'ChatGPT', 'Midjourney', 'Gemini', 'Nanobanana', 'Adobe Firefly'];
const SORTS: Sort[] = ['Featured', 'Newest', 'Popular'];

const TAB_EMOJI: Partial<Record<Tab, string>> = {
  'ChatGPT':      '🤖',
  'Midjourney':   '🎨',
  'Gemini':       '✨',
  'Nanobanana':   '🍌',
  'Adobe Firefly':'🔥',
};

interface Props {
  activeTab: Tab;
  onTab: (t: Tab) => void;
  activeSort: Sort;
  onSort: (s: Sort) => void;
}

export function TabBar({ activeTab, onTab, activeSort, onSort }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
      {/* Tabs pill group */}
      <div
        role="tablist"
        className="flex items-center gap-0.5 bg-[#f7f4ed] rounded-[14px] p-1 flex-wrap"
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => onTab(tab)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[13px] transition-all duration-200 cursor-pointer whitespace-nowrap',
              activeTab === tab
                ? 'bg-white text-[#1b1b1b] font-semibold shadow-sm'
                : 'text-[#6b7280] hover:text-[#1b1b1b] font-normal'
            )}
          >
            {TAB_EMOJI[tab] && (
              <span className="text-[12px] leading-none">{TAB_EMOJI[tab]}</span>
            )}
            {tab}
          </button>
        ))}
      </div>

      {/* Sort buttons */}
      <div className="flex items-center gap-1">
        {SORTS.map((s) => (
          <button
            key={s}
            onClick={() => onSort(s)}
            className={cn(
              'px-3 py-1.5 rounded-[10px] text-[13px] transition-all duration-150 cursor-pointer',
              activeSort === s
                ? 'bg-[#1b1b1b] text-white font-semibold'
                : 'text-[#6b7280] hover:bg-[#f7f4ed] hover:text-[#1b1b1b]'
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
