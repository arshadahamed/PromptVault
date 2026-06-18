import Link from 'next/link';
import { type Prompt } from '@/lib/types';

export function RelatedGrid({ prompts }: { prompts: Prompt[] }) {
  if (!prompts.length) return null;

  return (
    <div>
      <h2 className="text-[13px] font-semibold text-[#1b1b1b] mb-3">More like this</h2>
      <div style={{ columnCount: 3, columnGap: '8px' }}>
        {prompts.map((p) => {
          const [w, h] = p.aspectRatio.split('/').map(Number);
          const pb = `${(h / w) * 100}%`;
          return (
            <Link
              key={p.id}
              href={`/prompt/${p.id}`}
              className="block mb-2 rounded-[10px] overflow-hidden hover:opacity-90 transition-opacity"
            >
              <div className="relative w-full" style={{ paddingBottom: pb }}>
                <div
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(135deg, ${p.gradientFrom}, ${p.gradientTo})` }}
                />
                {p.localImg && (
                  <img
                    src={p.localImg}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
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
