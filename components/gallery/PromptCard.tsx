'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Heart, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Prompt } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import { LazyImage } from './LazyImage';

function ModelBadge({ model }: { model: string }) {
  const styles: Record<string, string> = {
    'GPT Image':      'bg-emerald-50 text-emerald-700',
    'Nanobanana Pro': 'bg-orange-50 text-orange-700',
    'Seedance 2.0':   'bg-purple-50 text-purple-700',
    'Midjourney':     'bg-blue-50 text-blue-700',
    'Nanobanana 2':   'bg-rose-50 text-rose-700',
  };
  return (
    <span
      className={cn(
        'text-[10px] font-semibold px-2 py-0.5 rounded-full',
        styles[model] ?? 'bg-[#f7f4ed] text-[#6b7280]'
      )}
    >
      {model}
    </span>
  );
}

export function PromptCard({ prompt }: { prompt: Prompt }) {
  const [hovered, setHovered] = useState(false);
  const { favorites, toggleFavorite } = useApp();
  const liked = favorites.includes(prompt.id);

  const [w, h] = prompt.aspectRatio.split('/').map(Number);
  const paddingBottom = `${(h / w) * 100}%`;

  return (
    <div className="break-inside-avoid mb-3">
      <Link
        href={`/prompt/${prompt.id}`}
        className="block relative rounded-[14px] overflow-hidden cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ display: 'block' }}
      >
        {/* Image with lazy loading + skeleton shimmer */}
        <div className="relative w-full" style={{ paddingBottom }}>
          {prompt.localImg ? (
            <LazyImage
              src={prompt.localImg}
              alt={prompt.promptText.slice(0, 80)}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: hovered ? 'scale(1.02)' : 'scale(1)', transition: 'transform 0.5s' }}
              gradientFrom={prompt.gradientFrom}
              gradientTo={prompt.gradientTo}
            />
          ) : (
            /* Gradient fallback (no image) */
            <div
              className="absolute inset-0 transition-transform duration-500"
              style={{
                background: `linear-gradient(135deg, ${prompt.gradientFrom}, ${prompt.gradientTo})`,
                transform: hovered ? 'scale(1.02)' : 'scale(1)',
              }}
            />
          )}

          {/* Model badge — always visible */}
          <div className="absolute top-2 left-2 z-10">
            <ModelBadge model={prompt.model} />
          </div>

          {/* Dark overlay on hover */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
              />
            )}
          </AnimatePresence>

          {/* Hover controls */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                className="absolute inset-x-0 bottom-0 p-2.5 z-10 flex items-end justify-between"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.18 }}
              >
                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFavorite(prompt.id);
                    }}
                    className="flex items-center gap-1 bg-white/15 backdrop-blur-sm text-white text-[11px] px-2 py-1 rounded-full hover:bg-white/30 transition-colors"
                  >
                    <Heart size={11} fill={liked ? 'white' : 'none'} strokeWidth={1.5} />
                    <span>{prompt.likes + (liked ? 1 : 0)}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="flex items-center gap-1 bg-white text-[#1b1b1b] text-[11px] font-medium px-2.5 py-1 rounded-full hover:bg-[#f7f4ed] transition-colors"
                  >
                    <Lightbulb size={11} />
                    Use Idea
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Link>

      {/* Prompt snippet below image */}
      <p className="mt-1.5 px-0.5 text-[12px] text-[#6b7280] leading-snug line-clamp-2">
        {prompt.promptText.slice(0, 120)}
      </p>
    </div>
  );
}
