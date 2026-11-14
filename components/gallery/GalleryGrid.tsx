'use client';
import { type Prompt } from '@/lib/types';
import { PromptCard } from './PromptCard';
import { SkeletonCard } from './SkeletonCard';

interface Props {
  prompts: Prompt[];
  loading?: boolean;
  className?: string;
}

// First 9 cards are above the fold — load eagerly for LCP performance
const EAGER_THRESHOLD = 9;

export function GalleryGrid({ prompts, loading = false, className = 'masonry-3' }: Props) {
  if (loading) {
    return (
      <div className={className}>
        {Array.from({ length: 9 }).map((_, i) => (
          <SkeletonCard key={i} index={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      {prompts.map((p, i) => (
        <PromptCard key={p.id} prompt={p} eager={i < EAGER_THRESHOLD} />
      ))}
    </div>
  );
}
