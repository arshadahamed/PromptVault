'use client';
import { useState, useEffect } from 'react';
import { Loader2, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { ModalShell } from './ModalShell';
import { useApp } from '@/context/AppContext';
import { LottieIcon } from '@/components/ui/LottieIcon';
import type { Prompt } from '@/lib/types';

const QUICK_TERMS = ['Vibe Coding', 'Hero Section', 'Cyberpunk', 'Portrait', '3D Render', 'Minimalist', 'Landing Page', 'Anime'];

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
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <LottieIcon name="search" size={16} />
        </span>
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search styles, subjects, models…"
          className="admin-control w-full pl-10 pr-9 py-2.5 text-[13px]"
        />
        {loading && (
          <Loader2
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin"
            style={{ color: 'var(--accent-text)' }}
          />
        )}
      </div>

      {!trimmed ? (
        <div className="mt-4">
          <p
            className="text-[11px] font-semibold uppercase tracking-wider mb-2.5"
            style={{ color: 'var(--fg-subtle)' }}
          >
            Popular Searches
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TERMS.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setQuery(term)}
                className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors cursor-pointer theme-surface theme-surface-hover"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      ) : loading && visibleResults.length === 0 ? (
        <p className="text-[13px] text-center mt-12" style={{ color: 'var(--fg-subtle)' }}>
          Searching prompts…
        </p>
      ) : visibleResults.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {visibleResults.map((p) => (
            <li key={p.id}>
              <Link
                href={`/prompt/${p.id}`}
                onClick={closeModal}
                className="group flex gap-3 items-start p-2.5 rounded-xl transition-all theme-surface-hover"
                style={{ border: '1px solid transparent' }}
              >
                <div
                  className="w-12 h-12 rounded-xl shrink-0 overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${p.gradientFrom}, ${p.gradientTo})`,
                    border: '1px solid var(--border-default)',
                  }}
                >
                  {p.localImg && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.localImg} alt="" className="w-full h-full object-cover" loading="lazy" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[12.5px] font-medium leading-snug line-clamp-2"
                    style={{ color: 'var(--fg-primary)' }}
                  >
                    {p.title || p.promptText.slice(0, 110)}
                  </p>
                  <p className="text-[11px] mt-1 flex items-center gap-1.5" style={{ color: 'var(--fg-subtle)' }}>
                    <span>{p.author.handle}</span>
                    <span>·</span>
                    <span style={{ color: 'var(--accent-text)' }} className="font-semibold">
                      {p.model}
                    </span>
                    {p.hasCode && (
                      <span
                        className="px-1.5 py-0.2 rounded text-[9.5px] font-semibold uppercase"
                        style={{
                          backgroundColor: 'var(--cyan-soft)',
                          color: 'var(--cyan-text)',
                        }}
                      >
                        {p.codeLanguage || 'Code'}
                      </span>
                    )}
                  </p>
                </div>
                <ArrowUpRight size={14} className="shrink-0 mt-1" style={{ color: 'var(--fg-subtle)' }} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center mt-14 px-4">
          <div className="mx-auto mb-3 w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--accent-soft)' }}>
            <LottieIcon name="empty" size={24} />
          </div>
          <p className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>
            No prompts matching &ldquo;{trimmed}&rdquo;
          </p>
        </div>
      )}
    </ModalShell>
  );
}
