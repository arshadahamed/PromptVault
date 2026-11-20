'use client';
import { useState, useCallback } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  gradientFrom: string;
  gradientTo: string;
  eager?: boolean;
  highPriority?: boolean;
}

/**
 * Ultra-fast image component:
 * - Renders `<img>` directly in SSR HTML so the browser preload scanner starts fetching
 *   above-the-fold images before React hydration even finishes.
 * - Uses native C++ browser `loading="lazy"` for below-the-fold images (0 JS IntersectionObservers).
 * - Detects already-cached images synchronously on mount via `img.complete` so cached images
 *   appear in 0ms with no fade delay.
 */
export function LazyImage({
  src,
  alt,
  className,
  style,
  gradientFrom,
  gradientTo,
  eager = false,
  highPriority = false,
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleImgRef = useCallback((img: HTMLImageElement | null) => {
    if (img && img.complete) {
      if (img.naturalWidth > 0) {
        setLoaded(true);
      }
    }
  }, []);

  return (
    <div className="absolute inset-0">
      {/* Lightweight gradient placeholder (fades out in 150ms when image is ready) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
          opacity: loaded && !failed ? 0 : 1,
          transition: 'opacity 0.15s ease-out',
        }}
      />

      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={handleImgRef}
          src={src}
          alt={alt}
          className={className}
          style={{
            ...style,
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.15s ease-out, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={highPriority ? 'high' : eager ? 'auto' : 'low'}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
