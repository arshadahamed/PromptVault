'use client';
import { type Prompt } from '@/lib/types';
import { PromptCard } from './PromptCard';
import { SkeletonCard } from './SkeletonCard';

interface Props {
  pages: Prompt[][];
  loading?: boolean;
  loadingMore?: boolean;
  className?: string;
}

// First 12 cards are above the fold on desktop 4-column layouts — load eagerly
const EAGER_THRESHOLD = 12;
// First 4 cards get fetchPriority="high" for instant LCP
const HIGH_PRIORITY_THRESHOLD = 4;

export function GalleryGrid({
  pages,
  loading = false,
  loadingMore = false,
  className = 'masonry-responsive',
}: Props) {
  if (loading) {
    return (
      <div className={className}>
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonCard key={i} index={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {pages.map((batch, pageIndex) => (
        <div key={pageIndex} className={className}>
          {batch.map((p, i) => (
            <PromptCard
              key={p.id}
              prompt={p}
              eager={pageIndex === 0 && i < EAGER_THRESHOLD}
              highPriority={pageIndex === 0 && i < HIGH_PRIORITY_THRESHOLD}
            />
          ))}
        </div>
      ))}

      {loadingMore && (
        <div className={className}>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={`more-${i}`} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
