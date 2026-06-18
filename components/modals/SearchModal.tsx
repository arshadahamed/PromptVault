'use client';
import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { prompts } from '@/data/prompts';
import { ModalShell } from './ModalShell';
import { useApp } from '@/context/AppContext';

export function SearchModal({ open }: { open: boolean }) {
  const [query, setQuery] = useState('');
  const { closeModal } = useApp();

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return prompts
      .filter(
        (p) =>
          p.promptText.toLowerCase().includes(q) ||
          p.author.name.toLowerCase().includes(q) ||
          p.model.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [query]);

  return (
    <ModalShell title="Search" open={open}>
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search prompts, authors, models…"
          className="w-full pl-9 pr-3 py-2.5 rounded-[10px] border border-[#e5e7eb] text-[13px] outline-none focus:border-[#1b1b1b] transition-colors bg-[#f7f4ed] placeholder:text-[#9ca3af]"
        />
      </div>

      {results.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {results.map((p) => (
            <li key={p.id}>
              <Link
                href={`/prompt/${p.id}`}
                onClick={closeModal}
                className="flex gap-3 items-start p-2.5 rounded-[10px] hover:bg-[#f7f4ed] transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-[8px] shrink-0 overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${p.gradientFrom}, ${p.gradientTo})`,
                  }}
                >
                  {p.localImg && (
                    <img src={p.localImg} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-[#1b1b1b] leading-snug line-clamp-2">
                    {p.promptText.slice(0, 80)}
                  </p>
                  <p className="text-[11px] text-[#6b7280] mt-0.5">
                    {p.author.handle} · {p.model}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : query ? (
        <p className="text-[13px] text-[#9ca3af] text-center mt-10">
          No results for &ldquo;{query}&rdquo;
        </p>
      ) : (
        <p className="text-[13px] text-[#9ca3af] text-center mt-10">
          Type to search prompts…
        </p>
      )}
    </ModalShell>
  );
}
