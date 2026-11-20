import Link from 'next/link';
import { type Prompt } from '@/lib/types';
import { aspectRatioPaddingBottom } from '@/lib/prompts';
import { LazyImage } from '@/components/gallery/LazyImage';

export function RelatedGrid({ prompts }: { prompts: Prompt[] }) {
  if (!prompts.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--fg-subtle)' }}
        >
          More like this
        </h2>
        <span className="text-[11px]" style={{ color: 'var(--fg-subtle)' }}>
          {prompts.length} similar
        </span>
      </div>

      <div className="columns-3 gap-2">
        {prompts.map((p) => {
          const pb = aspectRatioPaddingBottom(p.aspectRatio);
          return (
            <Link
              key={p.id}
              href={`/prompt/${p.id}`}
              className="group block break-inside-avoid mb-2 rounded-xl overflow-hidden transition-all"
              style={{ border: '1px solid var(--border-default)' }}
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
