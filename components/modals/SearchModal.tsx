'use client';
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { ModalShell } from './ModalShell';
import { useApp } from '@/context/AppContext';

interface SearchResult {
  id: string;
  promptText: string;
  model: string;
  gradientFrom: string;
  gradientTo: string;
  localImg: string;
  authorName: string;
  handle: string;
}

export function SearchModal({ open }: { open: boolean }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const { closeModal } = useApp();

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timer = setTimeout(() => {
      const controller = new AbortController();
      fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((r) => r.ok ? r.json() : [])
        .then((data: any[]) => setResults(data.map((p) => ({
          id: p.id,
          promptText: p.prompt_text || '',
          model: p.model || '',
          gradientFrom: p.gradient_from || '#d4f5b4',
          gradientTo: p.gradient_to || '#f5b4e8',
          localImg: p.local_img || '',
          authorName: p.author_name || 'Admin',
          handle: p.handle || '@admin',
        }))))
        .catch(() => {});
      return () => controller.abort();
    }, 300);
    return () => clearTimeout(timer);
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
                  style={{ background: `linear-gradient(135deg, ${p.gradientFrom}, ${p.gradientTo})` }}
                >
                  {p.localImg && <img src={p.localImg} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-[#1b1b1b] leading-snug line-clamp-2">
                    {p.promptText.slice(0, 80)}
                  </p>
                  <p className="text-[11px] text-[#6b7280] mt-0.5">
                    {p.handle} · {p.model}
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
