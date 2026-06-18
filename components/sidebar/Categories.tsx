'use client';
import { useState } from 'react';
import { Tag, ChevronDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const TAGS = [
  'All',
  'ChatGPT',
  'Midjourney',
  'Gemini',
  'Stable Diffusion',
  'DALL-E',
  'Flux',
  'Seedance',
  'Nanobanana',
  'Adobe Firefly',
  'Leonardo AI',
];

export function Categories({ onTagSelect }: { onTagSelect?: (t: string) => void }) {
  const [tagsOpen, setTagsOpen] = useState(true);
  const [activeTag, setActiveTag] = useState('All');

  const selectTag = (t: string) => {
    setActiveTag(t);
    onTagSelect?.(t);
  };

  return (
    <div className="px-2">
      <p className="px-3 py-1 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider">
        Categories
      </p>

      {/* Tags collapsible */}
      <button
        onClick={() => setTagsOpen((v) => !v)}
        className="flex items-center gap-3 w-full px-3 py-2 rounded-[10px] text-sm font-medium text-[#1b1b1b] hover:bg-[#f7f4ed] transition-colors cursor-pointer"
      >
        <Tag size={16} strokeWidth={1.8} />
        <span>Tags</span>
        <ChevronDown
          size={13}
          className={cn(
            'ml-auto text-[#9ca3af] transition-transform duration-200',
            tagsOpen ? 'rotate-180' : ''
          )}
        />
      </button>

      {tagsOpen && (
        <ul className="ml-8 flex flex-col gap-0.5 mt-0.5 mb-1">
          {TAGS.map((t) => (
            <li key={t}>
              <button
                onClick={() => selectTag(t)}
                className={cn(
                  'w-full text-left px-3 py-1.5 rounded-[8px] text-[13px] transition-colors cursor-pointer',
                  activeTag === t
                    ? 'bg-[#ebe8e1] font-medium text-[#1b1b1b]'
                    : 'text-[#6b7280] hover:text-[#1b1b1b] hover:bg-[#f7f4ed]'
                )}
              >
                {t}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Recent Updates */}
      <button className="flex items-center gap-3 w-full px-3 py-2 rounded-[10px] text-sm font-medium text-[#1b1b1b] hover:bg-[#f7f4ed] transition-colors mt-0.5 cursor-pointer">
        <Clock size={16} strokeWidth={1.8} />
        <span>Recent Updates</span>
      </button>
    </div>
  );
}
