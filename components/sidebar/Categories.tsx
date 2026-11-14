'use client';
import { useState } from 'react';
import { Layers, ChevronDown, Clock, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import type { Tab } from '@/lib/types';

const MODEL_TABS: { tab: Tab; dot: string }[] = [
  { tab: 'All',         dot: '#a855f7' },
  { tab: 'ChatGPT',     dot: '#10b981' },
  { tab: 'Nanobanana',  dot: '#f59e0b' },
  { tab: 'Midjourney',  dot: '#3b82f6' },
  { tab: 'Flux',        dot: '#06b6d4' },
  { tab: 'Seedance',    dot: '#ec4899' },
];

interface Props {
  tabCounts?: Record<string, number>;
  onNavigate?: () => void;
}

export function Categories({ tabCounts, onNavigate }: Props) {
  const [open, setOpen] = useState(true);
  const { activeTab, activeSort, setGalleryFilter } = useApp();

  const vibeCount = tabCounts?.['Vibe Coding'];
  const vibeActive = activeTab === 'Vibe Coding';

  return (
    <div className="px-2.5">
      <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#71717a]">
        Models &amp; Feeds
      </p>

      <button
        type="button"
        onClick={() => {
          setGalleryFilter({ tab: 'Vibe Coding' });
          onNavigate?.();
        }}
        className={cn(
          'flex items-center gap-3 w-full px-3 py-2 rounded-[10px] text-[13px] font-medium transition-all mb-1 cursor-pointer',
          vibeActive
            ? 'bg-cyan-500/15 text-cyan-200 font-semibold border border-cyan-400/25'
            : 'text-[#a1a1aa] hover:text-white hover:bg-white/[0.04] border border-transparent'
        )}
      >
        <Code2
          size={15}
          strokeWidth={1.9}
          className={vibeActive ? 'text-cyan-300' : 'text-cyan-400/80'}
        />
        <span className="truncate flex-1 text-left">Vibe Coding</span>
        {typeof vibeCount === 'number' && (
          <span
            className={cn(
              'text-[10px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums',
              vibeActive ? 'bg-cyan-400/20 text-cyan-200' : 'bg-white/[0.05] text-[#71717a]'
            )}
          >
            {vibeCount.toLocaleString()}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-3 w-full px-3 py-2 rounded-[10px] text-[13px] font-medium text-[#a1a1aa] hover:text-white transition-colors cursor-pointer group"
      >
        <Layers size={15} strokeWidth={1.8} className="group-hover:text-white transition-colors" />
        <span>AI Models</span>
        <ChevronDown
          size={13}
          className={cn('ml-auto text-[#71717a] transition-transform duration-200', open ? 'rotate-180' : '')}
        />
      </button>

      {open && (
        <ul className="ml-3 pl-3 border-l border-white/[0.06] flex flex-col gap-0.5 mt-1 mb-2">
          {MODEL_TABS.map(({ tab, dot }) => {
            const count = tabCounts?.[tab];
            if (tab !== 'All' && count === 0) return null;
            const active = activeTab === tab;
            return (
              <li key={tab}>
                <button
                  type="button"
                  onClick={() => {
                    setGalleryFilter({ tab });
                    onNavigate?.();
                  }}
                  className={cn(
                    'w-full text-left px-2.5 py-1.5 rounded-[8px] text-[12px] transition-all cursor-pointer flex items-center gap-2.5',
                    active
                      ? 'bg-violet-500/15 text-white font-semibold'
                      : 'text-[#a1a1aa] hover:text-white hover:bg-white/[0.04]'
                  )}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0 transition-transform"
                    style={{
                      background: active ? dot : `${dot}66`,
                      boxShadow: active ? `0 0 8px ${dot}` : 'none',
                    }}
                  />
                  <span className="truncate flex-1">{tab}</span>
                  {typeof count === 'number' && (
                    <span className="text-[10px] tabular-nums text-[#71717a]">
                      {count.toLocaleString()}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={() => {
          setGalleryFilter({ sort: 'Newest' });
          onNavigate?.();
        }}
        className={cn(
          'flex items-center gap-3 w-full px-3 py-2 rounded-[10px] text-[13px] font-medium transition-colors mt-0.5 cursor-pointer',
          activeSort === 'Newest'
            ? 'bg-cyan-500/10 text-cyan-300 font-semibold'
            : 'text-[#a1a1aa] hover:text-white hover:bg-white/[0.04]'
        )}
      >
        <Clock size={15} strokeWidth={1.8} />
        <span>Recent Updates</span>
      </button>
    </div>
  );
}
