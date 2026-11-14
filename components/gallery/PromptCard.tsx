'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Prompt } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import { LazyImage } from './LazyImage';

const MODEL_STYLES: Record<string, { bg: string; color: string; glow: string }> = {
  'ChatGPT':        { bg: 'rgba(16,185,129,0.15)',  color: '#10b981', glow: 'rgba(16,185,129,0.3)'  },
  'GPT Image':      { bg: 'rgba(16,185,129,0.15)',  color: '#10b981', glow: 'rgba(16,185,129,0.3)'  },
  'Nanobanana Pro': { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b', glow: 'rgba(245,158,11,0.3)'  },
  'Nanobanana 2':   { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444', glow: 'rgba(239,68,68,0.3)'   },
  'Seedance 2.0':   { bg: 'rgba(168,85,247,0.15)',  color: '#a855f7', glow: 'rgba(168,85,247,0.3)'  },
  'Midjourney':     { bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6', glow: 'rgba(59,130,246,0.3)'  },
  'Flux':           { bg: 'rgba(6,182,212,0.15)',   color: '#06b6d4', glow: 'rgba(6,182,212,0.3)'   },
  'Gemini':         { bg: 'rgba(236,72,153,0.15)',  color: '#ec4899', glow: 'rgba(236,72,153,0.3)'  },
  'Adobe Firefly':  { bg: 'rgba(251,113,133,0.15)', color: '#fb7185', glow: 'rgba(251,113,133,0.3)' },
};

function ModelBadge({ model }: { model: string }) {
  // Normalize model key
  const key = Object.keys(MODEL_STYLES).find(k => model.toLowerCase().includes(k.toLowerCase())) || model;
  const style = MODEL_STYLES[key] || { bg: 'rgba(139,139,153,0.15)', color: '#8b8b99', glow: 'transparent' };

  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm"
      style={{ background: style.bg, color: style.color, border: `1px solid ${style.color}33` }}
    >
      {model}
    </span>
  );
}

export function PromptCard({ prompt, eager = false }: { prompt: Prompt; eager?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const { favorites, toggleFavorite } = useApp();
  const liked = favorites.includes(prompt.id);

  const [w, h] = prompt.aspectRatio.split('/').map(Number);
  const paddingBottom = `${(h / w) * 100}%`;

  return (
    <div className="break-inside-avoid mb-2.5">
      <Link
        href={`/prompt/${prompt.id}`}
        className="block relative rounded-[14px] overflow-hidden cursor-pointer transition-all duration-300 card-glow"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          border: hovered
            ? '1px solid rgba(124,58,237,0.3)'
            : '1px solid rgba(255,255,255,0.05)',
          transition: 'border-color 0.3s, box-shadow 0.3s',
        }}
      >
        {/* Image area */}
        <div className="relative w-full" style={{ paddingBottom }}>
          {prompt.localImg ? (
            <LazyImage
              src={prompt.localImg}
              alt={prompt.promptText.slice(0, 80)}
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                transform: hovered ? 'scale(1.03)' : 'scale(1)',
                transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)',
              }}
              gradientFrom={prompt.gradientFrom}
              gradientTo={prompt.gradientTo}
              eager={eager}
            />
          ) : (
            <div
              className="absolute inset-0 transition-transform duration-500"
              style={{
                background: `linear-gradient(135deg, ${prompt.gradientFrom}, ${prompt.gradientTo})`,
                transform: hovered ? 'scale(1.03)' : 'scale(1)',
              }}
            />
          )}

          {/* Model badge — always visible */}
          <div className="absolute top-2 left-2 z-10">
            <ModelBadge model={prompt.model} />
          </div>

          {/* Gradient overlay — always subtle on dark */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)',
              opacity: hovered ? 1 : 0.4,
              transition: 'opacity 0.3s',
            }}
          />

          {/* Hover controls */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                className="absolute inset-x-0 bottom-0 p-2.5 z-10 flex items-end justify-between"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                {/* Like button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFavorite(prompt.id);
                  }}
                  className="flex items-center gap-1 text-white text-[11px] px-2.5 py-1 rounded-full transition-all"
                  style={{
                    background: liked ? 'rgba(236,72,153,0.4)' : 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(8px)',
                    border: liked ? '1px solid rgba(236,72,153,0.5)' : '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <Heart
                    size={11}
                    fill={liked ? '#ec4899' : 'none'}
                    stroke={liked ? '#ec4899' : 'white'}
                    strokeWidth={1.5}
                  />
                  <span>{prompt.likes + (liked ? 1 : 0)}</span>
                </button>

                {/* Use prompt button */}
                <Link
                  href={`/prompt/${prompt.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all"
                  style={{
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.9), rgba(6,182,212,0.8))',
                    color: '#fff',
                    boxShadow: '0 0 12px rgba(124,58,237,0.4)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <Zap size={10} />
                  Use
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Link>
    </div>
  );
}
