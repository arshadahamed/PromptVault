'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Heart, Trash2 } from 'lucide-react';
import { ModalShell } from './ModalShell';
import { useApp } from '@/context/AppContext';
import type { Prompt } from '@/lib/types';

export function FavoritesModal({ open }: { open: boolean }) {
  const { favorites, toggleFavorite, clearFavorites, closeModal } = useApp();
  const [items, setItems]         = useState<Prompt[]>([]);
  const [loadedKey, setLoadedKey] = useState('');

  const reqKey = open && favorites.length > 0 ? favorites.join(',') : '';
  const favSet = useMemo(() => new Set(favorites), [favorites]);

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

  const visibleItems = reqKey ? items.filter((p) => favSet.has(p.id)) : [];
  const loading = Boolean(reqKey) && loadedKey !== reqKey && visibleItems.length === 0;

  return (
    <ModalShell
      title="Favorites"
      subtitle={`${favorites.length} saved`}
      open={open}
      headerAction={
        favorites.length > 0 ? (
          <button
            type="button"
            onClick={clearFavorites}
            className="text-[11px] font-medium text-zinc-400 hover:text-rose-400 flex items-center gap-1 px-2 py-1 rounded-[8px] hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <Trash2 size={12} />
            Clear
          </button>
        ) : undefined
      }
    >
      {loading ? (
        <p className="text-[13px] text-[#71717a] text-center mt-12">Loading favorites…</p>
      ) : visibleItems.length === 0 ? (
        <div className="text-center mt-14 px-4">
          <Heart size={28} className="mx-auto mb-3 text-zinc-600" />
          <p className="text-[13px] text-zinc-400">
            No favorites yet. Tap the heart on any prompt card to save it here.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {visibleItems.map((p) => (
            <li key={p.id}>
              <div className="flex gap-3 items-start p-2.5 rounded-[12px] hover:bg-white/[0.05] border border-transparent hover:border-white/[0.07] transition-all">
                <Link
                  href={`/prompt/${p.id}`}
                  onClick={closeModal}
                  className="flex gap-3 items-start flex-1 min-w-0"
                >
                  <div
                    className="w-11 h-11 rounded-[9px] shrink-0 overflow-hidden ring-1 ring-white/10"
                    style={{ background: `linear-gradient(135deg, ${p.gradientFrom}, ${p.gradientTo})` }}
                  >
                    {p.localImg && (
                      <img src={p.localImg} alt="" className="w-full h-full object-cover" loading="lazy" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-medium text-zinc-100 leading-snug line-clamp-2">
                      {p.promptText.slice(0, 100)}
                    </p>
                    <p className="text-[11px] text-[#71717a] mt-1">{p.model}</p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => toggleFavorite(p.id)}
                  className="shrink-0 mt-1 p-1.5 rounded-full text-pink-400 hover:text-pink-300 hover:bg-pink-500/10 transition-colors cursor-pointer"
                  aria-label="Remove from favorites"
                >
                  <Heart size={14} fill="currentColor" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </ModalShell>
  );
}
