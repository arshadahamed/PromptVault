'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { ModalShell } from './ModalShell';
import { useApp } from '@/context/AppContext';
import { LottieIcon } from '@/components/ui/LottieIcon';
import type { Prompt } from '@/lib/types';

export function HistoryModal({ open }: { open: boolean }) {
  const { history, clearHistory, closeModal } = useApp();
  const [items, setItems]         = useState<Prompt[]>([]);
  const [loadedKey, setLoadedKey] = useState('');

  const reqKey = open && history.length > 0 ? history.join(',') : '';
  const histSet = useMemo(() => new Set(history), [history]);

  useEffect(() => {
    if (!reqKey) return;
    const controller = new AbortController();

    fetch(`/api/prompts/batch?ids=${reqKey}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setLoadedKey(reqKey);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') setLoadedKey(reqKey);
      });

    return () => controller.abort();
  }, [reqKey]);

  const visibleItems = reqKey ? items.filter((p) => histSet.has(p.id)) : [];
  const loading = Boolean(reqKey) && loadedKey !== reqKey && visibleItems.length === 0;

  return (
    <ModalShell
      title="Recently Viewed"
      subtitle={`${history.length} recent prompts`}
      open={open}
      headerAction={
        history.length > 0 ? (
          <button
            type="button"
            onClick={clearHistory}
            className="text-[11px] font-medium hover:text-rose-500 flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer theme-surface"
          >
            <Trash2 size={12} />
            Clear
          </button>
        ) : undefined
      }
    >
      {loading ? (
        <p className="text-[13px] text-center mt-12" style={{ color: 'var(--fg-subtle)' }}>
          Loading history…
        </p>
      ) : visibleItems.length === 0 ? (
        <div className="text-center mt-14 px-4">
          <div className="mx-auto mb-3 w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(245,158,11,0.12)' }}>
            <LottieIcon name="clock" size={24} />
          </div>
          <p className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>
            No history yet. Open any prompt to keep track of it here.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {visibleItems.map((p) => (
            <li key={p.id}>
              <Link
                href={`/prompt/${p.id}`}
                onClick={closeModal}
                className="flex gap-3 items-start p-2.5 rounded-xl transition-all theme-surface-hover"
                style={{ border: '1px solid transparent' }}
              >
                <div
                  className="w-11 h-11 rounded-xl shrink-0 overflow-hidden"
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
                    {p.title || p.promptText.slice(0, 100)}
                  </p>
                  <p className="text-[11px] mt-1 font-medium" style={{ color: 'var(--accent-text)' }}>
                    {p.model}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ModalShell>
  );
}
