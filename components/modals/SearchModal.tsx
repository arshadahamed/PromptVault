'use client';
import { useState, useEffect } from 'react';
import { Search, Loader2, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { ModalShell } from './ModalShell';
import { useApp } from '@/context/AppContext';
import type { Prompt } from '@/lib/types';

const QUICK_TERMS = ['Cyberpunk', 'Portrait', '3D Render', 'Minimalist', 'Product', 'Anime'];

export function SearchModal({ open }: { open: boolean }) {
  const [query, setQuery]               = useState('');
  const [results, setResults]           = useState<Prompt[]>([]);
  const [settledQuery, setSettledQuery] = useState('');
  const { closeModal } = useApp();

  const trimmed = query.trim();
  const visibleResults = trimmed ? results : [];
  const loading = Boolean(trimmed) && settledQuery !== trimmed;

  useEffect(() => {
    if (!trimmed) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : []))
        .then((data: Prompt[]) => {
          setResults(Array.isArray(data) ? data : []);
          setSettledQuery(trimmed);
        })
        .catch((err) => {
          if (err?.name !== 'AbortError') {
            setResults([]);
            setSettledQuery(trimmed);
          }
        });
    }, 240);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  return (
    <ModalShell title="Search Prompts" subtitle="Press Esc to close · ⌘K anytime" open={open}>
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search styles, subjects, models…"
          className="w-full pl-10 pr-9 py-2.5 rounded-[12px] border border-white/[0.1] focus:border-violet-400/60 text-[13px] text-white outline-none transition-colors bg-[#141418] placeholder:text-[#71717a]"
        />
        {loading && (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-400 animate-spin" />
        )}
      </div>

      {!trimmed ? (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#71717a] mb-2.5">
            Popular Searches
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TERMS.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setQuery(term)}
                className="px-3 py-1.5 rounded-full text-[12px] font-medium bg-white/[0.05] hover:bg-violet-500/20 text-zinc-300 hover:text-white border border-white/[0.08] transition-colors cursor-pointer"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      ) : loading && visibleResults.length === 0 ? (
        <p className="text-[13px] text-[#71717a] text-center mt-12">Searching prompts…</p>
      ) : visibleResults.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {visibleResults.map((p) => (
            <li key={p.id}>
              <Link
                href={`/prompt/${p.id}`}
                onClick={closeModal}
                className="group flex gap-3 items-start p-2.5 rounded-[12px] hover:bg-white/[0.05] border border-transparent hover:border-white/[0.07] transition-all"
              >
                <div
                  className="w-12 h-12 rounded-[9px] shrink-0 overflow-hidden ring-1 ring-white/10"
                  style={{ background: `linear-gradient(135deg, ${p.gradientFrom}, ${p.gradientTo})` }}
                >
                  {p.localImg && (
                    <img src={p.localImg} alt="" className="w-full h-full object-cover" loading="lazy" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-medium text-zinc-100 leading-snug line-clamp-2 group-hover:text-white">
                    {p.promptText.slice(0, 110)}
                  </p>
                  <p className="text-[11px] text-[#71717a] mt-1">
                    {p.author.handle} · <span className="text-violet-400">{p.model}</span>
                  </p>
                </div>
                <ArrowUpRight size={14} className="text-zinc-600 group-hover:text-zinc-300 shrink-0 mt-1" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-[#71717a] text-center mt-12">
          No prompts matching &ldquo;{trimmed}&rdquo;
        </p>
      )}
    </ModalShell>
  );
}
