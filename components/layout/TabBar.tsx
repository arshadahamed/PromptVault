'use client';
import { cn } from '@/lib/utils';
import { type Tab, type Sort } from '@/lib/types';
import { Flame, Clock, Sparkles, Star } from 'lucide-react';

const TABS: Tab[] = ['All', 'ChatGPT', 'Midjourney', 'Gemini', 'Nanobanana', 'Adobe Firefly'];
const SORTS: Sort[] = ['Featured', 'Newest', 'Popular'];

const TAB_EMOJI: Partial<Record<Tab, string>> = {
  'ChatGPT':      '🤖',
  'Midjourney':   '🎨',
  'Gemini':       '✨',
  'Nanobanana':   '🍌',
  'Adobe Firefly':'🔥',
};

const SORT_ICONS: Record<Sort, React.ElementType> = {
  'Featured': Star,
  'Newest': Clock,
  'Popular': Flame,
};

const SORT_COLORS: Record<Sort, string> = {
  'Featured': '#a855f7',
  'Newest': '#06b6d4',
  'Popular': '#f59e0b',
};

interface Props {
  activeTab: Tab;
  onTab: (t: Tab) => void;
  activeSort: Sort;
  onSort: (s: Sort) => void;
  totalCount?: number;
}

export function TabBar({ activeTab, onTab, activeSort, onSort, totalCount }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
      {/* Tabs pill group */}
      <div
        role="tablist"
        className="flex items-center gap-1 rounded-[14px] p-1 flex-wrap"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              role="tab"
              aria-selected={active}
              onClick={() => onTab(tab)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[13px] transition-all duration-200 cursor-pointer whitespace-nowrap font-medium',
              )}
              style={active ? {
                background: 'linear-gradient(135deg, rgba(124,58,237,0.9), rgba(6,182,212,0.8))',
                color: '#ffffff',
                boxShadow: '0 0 16px rgba(124,58,237,0.4)',
              } : {
                color: '#8b8b99',
              }}
            >
              {TAB_EMOJI[tab] && (
                <span className="text-[12px] leading-none">{TAB_EMOJI[tab]}</span>
              )}
              {tab}
            </button>
          );
        })}
      </div>

      {/* Sort + count */}
      <div className="flex items-center gap-2">
        {totalCount != null && (
          <span className="text-[12px] font-medium mr-1" style={{ color: '#5c5c6b' }}>
            {totalCount.toLocaleString()} prompts
          </span>
        )}
        <div
          className="flex items-center gap-0.5 rounded-[10px] p-0.5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {SORTS.map((s) => {
            const Icon = SORT_ICONS[s];
            const active = activeSort === s;
            return (
              <button
                key={s}
                onClick={() => onSort(s)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all duration-150 cursor-pointer"
                style={active ? {
                  background: SORT_COLORS[s] + '22',
                  color: SORT_COLORS[s],
                  boxShadow: `0 0 10px ${SORT_COLORS[s]}33`,
                } : {
                  color: '#5c5c6b',
                }}
              >
                <Icon size={12} strokeWidth={2} />
                {s}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
