'use client';
import { cn } from '@/lib/utils';
import { type Tab, type Sort } from '@/lib/types';
import { LayoutGrid, Columns3, Columns2 } from 'lucide-react';
import { LottieIcon, type LottieIconName } from '@/components/ui/LottieIcon';

export type GridLayoutMode = 'masonry-responsive' | 'masonry-3' | 'masonry-2';

const TAB_CONFIG: { tab: Tab; dot: string }[] = [
  { tab: 'All',         dot: '#a855f7' },
  { tab: 'Vibe Coding', dot: '#22d3ee' },
  { tab: 'ChatGPT',     dot: '#10b981' },
  { tab: 'Nanobanana',  dot: '#f59e0b' },
  { tab: 'Midjourney',  dot: '#3b82f6' },
  { tab: 'Flux',        dot: '#06b6d4' },
  { tab: 'Seedance',    dot: '#ec4899' },
];

const SORTS: { value: Sort; lottie: LottieIconName; activeColor: string }[] = [
  { value: 'Featured', lottie: 'sparkles', activeColor: '#a855f7' },
  { value: 'Newest',   lottie: 'clock',    activeColor: '#06b6d4' },
  { value: 'Popular',  lottie: 'flame',    activeColor: '#f59e0b' },
];

const LAYOUT_MODES: { value: GridLayoutMode; label: string; icon: typeof LayoutGrid }[] = [
  { value: 'masonry-responsive', label: '4-Column Auto Grid', icon: LayoutGrid },
  { value: 'masonry-3',          label: '3-Column Studio Grid', icon: Columns3 },
  { value: 'masonry-2',          label: '2-Column Showcase Grid', icon: Columns2 },
];

interface Props {
  activeTab: Tab;
  onTab: (t: Tab) => void;
  activeSort: Sort;
  onSort: (s: Sort) => void;
  tabCounts?: Record<string, number>;
  totalCount?: number;
  gridLayout?: GridLayoutMode;
  onGridLayoutChange?: (mode: GridLayoutMode) => void;
}

export function TabBar({
  activeTab,
  onTab,
  activeSort,
  onSort,
  tabCounts,
  totalCount,
  gridLayout = 'masonry-responsive',
  onGridLayoutChange,
}: Props) {
  return (
    <div
      className="sticky top-14 md:top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-5 transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-topbar)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-default)',
      }}
    >
      <div className="flex items-center justify-between gap-2.5 flex-wrap">
        {/* Horizontal scrollable model tabs (Ant Design Segmented + shadcn Tabs style) */}
        <div
          role="tablist"
          aria-label="Filter by AI model"
          className="flex items-center gap-1 rounded-2xl p-1 overflow-x-auto no-scrollbar max-w-full"
          style={{
            backgroundColor: 'var(--bg-muted)',
            border: '1px solid var(--border-default)',
          }}
        >
          {TAB_CONFIG.map(({ tab, dot }) => {
            const count = tabCounts?.[tab];
            if (tab !== 'All' && tab !== 'Vibe Coding' && count === 0) return null;
            const active = activeTab === tab;
            const isCodeTab = tab === 'Vibe Coding';
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onTab(tab)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] transition-all duration-200 cursor-pointer whitespace-nowrap font-semibold',
                  active ? 'text-white shadow-sm' : 'hover:opacity-100'
                )}
                style={
                  active
                    ? {
                        background: isCodeTab
                          ? 'linear-gradient(135deg, #06b6d4, #4f46e5)'
                          : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                        boxShadow: isCodeTab
                          ? '0 4px 16px rgba(6,182,212,0.32)'
                          : '0 4px 16px rgba(124,58,237,0.35)',
                      }
                    : {
                        color: 'var(--fg-muted)',
                      }
                }
              >
                {isCodeTab ? (
                  <LottieIcon
                    name="code"
                    size={14}
                    primaryColor={active ? '#ffffff' : dot}
                    secondaryColor={active ? '#a5f3fc' : '#818cf8'}
                  />
                ) : (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      background: active ? '#ffffff' : dot,
                      boxShadow: active ? 'none' : `0 0 6px ${dot}88`,
                    }}
                  />
                )}
                <span>{tab}</span>
                {typeof count === 'number' && (
                  <span
                    className="text-[10px] tabular-nums px-1.5 py-0.2 rounded-full"
                    style={{
                      backgroundColor: active ? 'rgba(255,255,255,0.22)' : 'var(--bg-card)',
                      color: active ? '#ffffff' : 'var(--fg-subtle)',
                    }}
                  >
                    {count.toLocaleString()}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Live count + Sort controls with Lottie icons + Grid Density Layout Switcher */}
        <div className="flex items-center gap-2 ml-auto">
          {totalCount != null && (
            <span
              className="hidden 2xl:inline-block text-[12px] font-medium tabular-nums whitespace-nowrap"
              style={{ color: 'var(--fg-subtle)' }}
            >
              {totalCount.toLocaleString()} results
            </span>
          )}

          {/* Sort Segmented Control */}
          <div
            className="flex items-center gap-0.5 rounded-xl p-1"
            style={{
              backgroundColor: 'var(--bg-muted)',
              border: '1px solid var(--border-default)',
            }}
          >
            {SORTS.map(({ value, lottie, activeColor }) => {
              const active = activeSort === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onSort(value)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-150 cursor-pointer"
                  style={
                    active
                      ? {
                          backgroundColor: 'var(--bg-card)',
                          color: activeColor,
                          boxShadow: 'var(--adm-shadow-sm)',
                          border: '1px solid var(--border-strong)',
                        }
                      : {
                          color: 'var(--fg-muted)',
                          border: '1px solid transparent',
                        }
                  }
                >
                  <LottieIcon name={lottie} size={14} />
                  <span>{value}</span>
                </button>
              );
            })}
          </div>

          {/* Layout Density Switcher (MUI ToggleButtonGroup pattern) */}
          {onGridLayoutChange && (
            <div
              role="group"
              aria-label="Gallery layout density"
              className="hidden sm:flex items-center gap-0.5 rounded-xl p-1"
              style={{
                backgroundColor: 'var(--bg-muted)',
                border: '1px solid var(--border-default)',
              }}
            >
              {LAYOUT_MODES.map(({ value, label, icon: Icon }) => {
                const active = gridLayout === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onGridLayoutChange(value)}
                    aria-pressed={active}
                    aria-label={label}
                    title={label}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                    style={
                      active
                        ? {
                            backgroundColor: 'var(--bg-card)',
                            color: 'var(--accent-text)',
                            boxShadow: 'var(--adm-shadow-sm)',
                            border: '1px solid var(--border-strong)',
                          }
                        : {
                            color: 'var(--fg-muted)',
                          }
                    }
                  >
                    <Icon size={14} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
