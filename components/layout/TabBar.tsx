'use client';
import { cn } from '@/lib/utils';
import { type Tab, type Sort } from '@/lib/types';
import { Flame, Clock, Sparkles } from 'lucide-react';

const TAB_CONFIG: { tab: Tab; dot: string }[] = [
  { tab: 'All',        dot: '#a855f7' },
  { tab: 'ChatGPT',    dot: '#10b981' },
  { tab: 'Nanobanana', dot: '#f59e0b' },
  { tab: 'Midjourney', dot: '#3b82f6' },
  { tab: 'Flux',       dot: '#06b6d4' },
  { tab: 'Seedance',   dot: '#ec4899' },
];

const SORTS: { value: Sort; icon: React.ElementType; activeColor: string }[] = [
  { value: 'Featured', icon: Sparkles, activeColor: '#c084fc' },
  { value: 'Newest',   icon: Clock,    activeColor: '#22d3ee' },
  { value: 'Popular',  icon: Flame,    activeColor: '#fbbf24' },
];

interface Props {
  activeTab: Tab;
  onTab: (t: Tab) => void;
  activeSort: Sort;
  onSort: (s: Sort) => void;
  tabCounts?: Record<string, number>;
  totalCount?: number;
}

export function TabBar({
  activeTab,
  onTab,
  activeSort,
  onSort,
  tabCounts,
  totalCount,
}: Props) {
  return (
    <div
      className="sticky top-14 md:top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-5"
      style={{
        background: 'rgba(9,9,11,0.84)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center justify-between gap-2.5 flex-wrap">
        {/* Horizontal scrollable model tabs */}
        <div
          role="tablist"
          aria-label="Filter by AI model"
          className="flex items-center gap-0.5 rounded-[14px] p-1 overflow-x-auto no-scrollbar max-w-full"
          style={{
            background: 'rgba(255,255,255,0.035)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {TAB_CONFIG.map(({ tab, dot }) => {
            const count = tabCounts?.[tab];
            if (tab !== 'All' && count === 0) return null;
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onTab(tab)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] text-[12px] transition-all duration-200 cursor-pointer whitespace-nowrap font-medium',
                  active ? 'text-white shadow-sm' : 'text-[#a1a1aa] hover:text-white hover:bg-white/[0.04]'
                )}
                style={
                  active
                    ? {
                        background:
                          'linear-gradient(135deg, rgba(124,58,237,0.92), rgba(79,70,229,0.9))',
                        boxShadow: '0 4px 16px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                      }
                    : undefined
                }
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    background: active ? '#ffffff' : dot,
                    boxShadow: active ? 'none' : `0 0 6px ${dot}88`,
                  }}
                />
                <span>{tab}</span>
                {typeof count === 'number' && (
                  <span
                    className={cn(
                      'text-[10px] tabular-nums px-1.5 py-0.2 rounded-full',
                      active ? 'bg-white/20 text-white' : 'text-[#71717a]'
                    )}
                  >
                    {count.toLocaleString()}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sort controls + live total */}
        <div className="flex items-center gap-2.5 ml-auto">
          {totalCount != null && (
            <span className="hidden 2xl:inline-block text-[12px] font-medium text-[#71717a] tabular-nums whitespace-nowrap">
              {totalCount.toLocaleString()} results
            </span>
          )}
          <div
            className="flex items-center gap-0.5 rounded-[11px] p-1"
            style={{
              background: 'rgba(255,255,255,0.035)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {SORTS.map(({ value, icon: Icon, activeColor }) => {
              const active = activeSort === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onSort(value)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all duration-150 cursor-pointer',
                    active ? 'bg-white/[0.08]' : 'text-[#71717a] hover:text-zinc-200'
                  )}
                  style={active ? { color: activeColor } : undefined}
                >
                  <Icon size={12} strokeWidth={2} />
                  <span>{value}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
