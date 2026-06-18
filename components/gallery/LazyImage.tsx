'use client';
import { useRef, useState, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  gradientFrom: string;
  gradientTo: string;
}

export function LazyImage({ src, alt, className, style, gradientFrom, gradientTo }: LazyImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="absolute inset-0">
      {/* Gradient placeholder / shimmer */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
          opacity: loaded ? 0 : 1,
        }}
      >
        {/* Shimmer sweep */}
        {!loaded && (
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ opacity: visible ? 1 : 0 }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
                animation: 'shimmer 1.6s infinite',
              }}
            />
          </div>
        )}
      </div>

      {/* Actual image — only rendered once in viewport */}
      {visible && (
        <img
          src={src}
          alt={alt}
          className={className}
          style={{
            ...style,
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
        />
      )}
    </div>
  );
}
