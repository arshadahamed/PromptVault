'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { ModalShell } from './ModalShell';
import { useApp } from '@/context/AppContext';

interface PromptItem {
  id: string;
  promptText: string;
  model: string;
  gradientFrom: string;
  gradientTo: string;
  localImg: string;
}

function mapItem(p: any): PromptItem {
  return {
    id: p.id,
    promptText: p.promptText || p.prompt_text || '',
    model: p.model || '',
    gradientFrom: p.gradientFrom || p.gradient_from || '#d4f5b4',
    gradientTo: p.gradientTo || p.gradient_to || '#f5b4e8',
    localImg: p.localImg || p.local_img || '',
  };
}

export function HistoryModal({ open }: { open: boolean }) {
  const { history, closeModal } = useApp();
  const [items, setItems] = useState<PromptItem[]>([]);

  useEffect(() => {
    if (!history.length) { setItems([]); return; }
    fetch(`/api/prompts/batch?ids=${history.join(',')}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setItems((data as any[]).map(mapItem)))
      .catch(() => {});
  }, [history]);

  return (
    <ModalShell title="History" open={open}>
      {items.length === 0 ? (
        <div className="text-center mt-10">
          <Clock size={28} className="mx-auto mb-2 text-[#d6d3cc]" />
          <p className="text-[13px] text-[#9ca3af]">
            No history yet. View prompts to build your history.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((p) => (
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
                  <p className="text-[11px] text-[#6b7280] mt-0.5">{p.model}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ModalShell>
  );
}
