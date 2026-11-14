'use client';
import { useRef, useState, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  gradientFrom: string;
  gradientTo: string;
  eager?: boolean;
}

export function LazyImage({
  src,
  alt,
  className,
  style,
  gradientFrom,
  gradientTo,
  eager = false,
}: LazyImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(eager);
  const [loaded, setLoaded]   = useState(false);
  const [failed, setFailed]   = useState(false);

  useEffect(() => {
    if (eager) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [eager]);

  return (
    <div ref={ref} className="absolute inset-0">
      {/* Aesthetic gradient placeholder */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
          opacity: loaded && !failed ? 0 : 1,
        }}
      >
        {!loaded && !failed && visible && (
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
                animation: 'shimmer 1.6s infinite',
              }}
            />
          </div>
        )}
      </div>

      {visible && !failed && (
        <img
          src={src}
          alt={alt}
          className={className}
          style={{
            ...style,
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.3s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={eager ? 'high' : 'auto'}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
