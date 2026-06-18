'use client';
import { useState, useEffect } from 'react';
import { type Prompt } from '@/lib/types';
import { PromptCard } from './PromptCard';
import { SkeletonCard } from './SkeletonCard';

interface Props {
  prompts: Prompt[];
  loading?: boolean;
  className?: string;
}

export function GalleryGrid({ prompts, loading = false, className = 'masonry-3' }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 450);
    return () => clearTimeout(t);
  }, []);

  if (!mounted || loading) {
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
      {prompts.map((p) => (
        <PromptCard key={p.id} prompt={p} />
      ))}
    </div>
  );
}
