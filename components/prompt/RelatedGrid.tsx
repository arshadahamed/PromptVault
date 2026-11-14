import Link from 'next/link';
import { type Prompt } from '@/lib/types';
import { aspectRatioPaddingBottom } from '@/lib/prompts';
import { LazyImage } from '@/components/gallery/LazyImage';

export function RelatedGrid({ prompts }: { prompts: Prompt[] }) {
  if (!prompts.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">
          More like this
        </h2>
        <span className="text-[11px] text-[#52525b]">{prompts.length} similar</span>
      </div>

      <div className="columns-3 gap-2">
        {prompts.map((p) => {
          const pb = aspectRatioPaddingBottom(p.aspectRatio);
          return (
            <Link
              key={p.id}
              href={`/prompt/${p.id}`}
              className="group block break-inside-avoid mb-2 rounded-[10px] overflow-hidden border border-white/[0.07] hover:border-white/25 transition-all"
              title={p.promptText.slice(0, 80)}
            >
              <div className="relative w-full overflow-hidden" style={{ paddingBottom: pb }}>
                {p.localImg ? (
                  <LazyImage
                    src={p.localImg}
                    alt={p.promptText.slice(0, 60) || `${p.model} prompt`}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04]"
                    gradientFrom={p.gradientFrom}
                    gradientTo={p.gradientTo}
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, ${p.gradientFrom}, ${p.gradientTo})`,
                    }}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
