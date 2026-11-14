'use client';
import { useState } from 'react';
import { Tag, ChevronDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const TAGS = [
  'All', 'ChatGPT', 'Midjourney', 'Gemini', 'Stable Diffusion',
  'DALL-E', 'Flux', 'Seedance', 'Nanobanana', 'Adobe Firefly', 'Leonardo AI',
];

const TAG_DOTS: Partial<Record<string, string>> = {
  'ChatGPT':         '#10b981',
  'Midjourney':      '#3b82f6',
  'Gemini':          '#ec4899',
  'Stable Diffusion':'#a855f7',
  'Flux':            '#06b6d4',
  'Seedance':        '#f59e0b',
  'Nanobanana':      '#f97316',
  'Adobe Firefly':   '#fb7185',
};

export function Categories({ onTagSelect }: { onTagSelect?: (t: string) => void }) {
  const [tagsOpen, setTagsOpen] = useState(true);
  const [activeTag, setActiveTag] = useState('All');

  const selectTag = (t: string) => {
    setActiveTag(t);
    onTagSelect?.(t);
  };

  return (
    <div className="px-2">
      <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#3d3d47' }}>
        Categories
      </p>

      {/* Tags collapsible */}
      <button
        onClick={() => setTagsOpen((v) => !v)}
        className="flex items-center gap-3 w-full px-3 py-2 rounded-[10px] text-sm font-medium transition-colors cursor-pointer group"
        style={{ color: '#8b8b99' }}
      >
        <Tag size={15} strokeWidth={1.8} className="group-hover:text-white transition-colors" />
        <span className="group-hover:text-white transition-colors">Tags</span>
        <ChevronDown
          size={13}
          className={cn('ml-auto transition-transform duration-200', tagsOpen ? 'rotate-180' : '')}
          style={{ color: '#3d3d47' }}
        />
      </button>

      {tagsOpen && (
        <ul className="ml-7 flex flex-col gap-0.5 mt-0.5 mb-1">
          {TAGS.map((t) => {
            const active = activeTag === t;
            const dot = TAG_DOTS[t];
            return (
              <li key={t}>
                <button
                  onClick={() => selectTag(t)}
                  className="w-full text-left px-3 py-1.5 rounded-[8px] text-[12px] transition-all cursor-pointer flex items-center gap-2"
                  style={active ? {
                    background: 'rgba(124,58,237,0.1)',
                    color: '#f0f0f2',
                    fontWeight: 600,
                  } : {
                    color: '#5c5c6b',
                  }}
                >
                  {dot && (
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: active ? dot : '#2d2d34' }}
                    />
                  )}
                  {t}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Recent Updates */}
      <button
        className="flex items-center gap-3 w-full px-3 py-2 rounded-[10px] text-sm font-medium transition-colors mt-0.5 cursor-pointer group"
        style={{ color: '#8b8b99' }}
      >
        <Clock size={15} strokeWidth={1.8} className="group-hover:text-white transition-colors" />
        <span className="group-hover:text-white transition-colors">Recent Updates</span>
      </button>
    </div>
  );
}
