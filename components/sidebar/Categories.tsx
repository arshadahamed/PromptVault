'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import type { Tab } from '@/lib/types';
import { LottieIcon } from '@/components/ui/LottieIcon';

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
      <p
        className="px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: 'var(--fg-subtle)' }}
      >
        Models &amp; Feeds
      </p>

      {/* Vibe Coding Featured Pill with Lottie Code Icon */}
      <button
        type="button"
        onClick={() => {
          setGalleryFilter({ tab: 'Vibe Coding' });
          onNavigate?.();
        }}
        className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-[13px] font-medium transition-all mb-1.5 cursor-pointer"
        style={
          vibeActive
            ? {
                backgroundColor: 'var(--cyan-soft)',
                color: 'var(--cyan-text)',
                border: '1px solid var(--cyan-border)',
                fontWeight: 600,
              }
            : {
                color: 'var(--fg-muted)',
                border: '1px solid transparent',
              }
        }
      >
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{
            backgroundColor: 'var(--cyan-soft)',
            border: '1px solid var(--cyan-border)',
          }}
        >
          <LottieIcon name="code" size={15} />
        </span>
        <span className="truncate flex-1 text-left">Vibe Coding</span>
        {typeof vibeCount === 'number' && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full tabular-nums"
            style={{
              backgroundColor: vibeActive ? 'var(--cyan-soft)' : 'var(--bg-muted)',
              color: vibeActive ? 'var(--cyan-text)' : 'var(--fg-subtle)',
              border: '1px solid var(--border-default)',
            }}
          >
            {vibeCount.toLocaleString()}
          </span>
        )}
      </button>

      {/* AI Models Accordion Trigger with Lottie Layers Icon */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-[13px] font-medium transition-colors cursor-pointer group"
        style={{ color: 'var(--fg-muted)' }}
      >
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{
            backgroundColor: 'var(--bg-muted)',
            border: '1px solid var(--border-default)',
          }}
        >
          <LottieIcon name="layers" size={15} />
        </span>
        <span style={{ color: 'var(--fg-primary)' }} className="font-medium">
          AI Models
        </span>
        <ChevronDown
          size={13}
          className={cn('ml-auto transition-transform duration-200', open ? 'rotate-180' : '')}
          style={{ color: 'var(--fg-subtle)' }}
        />
      </button>

      {open && (
        <ul
          className="ml-4 pl-3 flex flex-col gap-1 mt-1 mb-2"
          style={{ borderLeft: '1px solid var(--border-default)' }}
        >
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
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[12.5px] transition-all cursor-pointer flex items-center gap-2.5"
                  style={
                    active
                      ? {
                          backgroundColor: 'var(--accent-soft)',
                          color: 'var(--accent-text)',
                          border: '1px solid var(--accent-border)',
                          fontWeight: 600,
                        }
                      : {
                          color: 'var(--fg-muted)',
                          border: '1px solid transparent',
                        }
                  }
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0 transition-transform"
                    style={{
                      background: dot,
                      boxShadow: active ? `0 0 8px ${dot}` : 'none',
                    }}
                  />
                  <span className="truncate flex-1">{tab}</span>
                  {typeof count === 'number' && (
                    <span
                      className="text-[10.5px] tabular-nums px-1.5 py-0.2 rounded-md"
                      style={{
                        color: active ? 'var(--accent-text)' : 'var(--fg-subtle)',
                      }}
                    >
                      {count.toLocaleString()}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Recent Updates Feed with Lottie Clock Icon */}
      <button
        type="button"
        onClick={() => {
          setGalleryFilter({ sort: 'Newest' });
          onNavigate?.();
        }}
        className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-[13px] font-medium transition-colors mt-0.5 cursor-pointer"
        style={
          activeSort === 'Newest'
            ? {
                backgroundColor: 'var(--cyan-soft)',
                color: 'var(--cyan-text)',
                border: '1px solid var(--cyan-border)',
                fontWeight: 600,
              }
            : {
                color: 'var(--fg-muted)',
                border: '1px solid transparent',
              }
        }
      >
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{
            backgroundColor: 'var(--bg-muted)',
            border: '1px solid var(--border-default)',
          }}
        >
          <LottieIcon name="clock" size={15} />
        </span>
        <span>Recent Updates</span>
      </button>
    </div>
  );
}
