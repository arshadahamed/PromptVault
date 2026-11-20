'use client';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type LottieIconName =
  | 'sparkles'
  | 'flame'
  | 'search'
  | 'heart'
  | 'code'
  | 'sun'
  | 'moon'
  | 'layers'
  | 'clock'
  | 'shield'
  | 'rocket'
  | 'chart'
  | 'upload'
  | 'empty';

interface LottieWindow extends Window {
  lottie?: {
    loadAnimation: (params: {
      container: HTMLElement;
      renderer: 'svg' | 'canvas' | 'html';
      loop: boolean;
      autoplay: boolean;
      animationData: Record<string, unknown>;
    }) => {
      destroy: () => void;
      play: () => void;
      stop: () => void;
      setSpeed?: (speed: number) => void;
    };
  };
}

/**
 * Helper to convert hex (#rrggbb) to normalized Lottie [r, g, b, 1] array
 */
function hexToRgbNorm(hex: string): [number, number, number, number] {
  const clean = hex.replace('#', '');
  const num = Number.parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  return [Number(r.toFixed(3)), Number(g.toFixed(3)), Number(b.toFixed(3)), 1];
}

/**
 * Generates valid Bodymovin / Lottie v5.7.4 vector keyframe JSON for each icon,
 * rendered by the CDN lottie-web engine (https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js).
 */
function buildLottieData(name: LottieIconName, primaryHex: string, secondaryHex: string): Record<string, unknown> {
  const c1 = hexToRgbNorm(primaryHex);
  const c2 = hexToRgbNorm(secondaryHex);

  // Common animated pulse/rotate transform keyframes (60fps, 90 frames = 1.5s loop)
  const pulseScale = {
    a: 1,
    k: [
      { t: 0, s: [92, 92, 100], e: [108, 108, 100], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
      { t: 45, s: [108, 108, 100], e: [92, 92, 100], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
      { t: 90, s: [92, 92, 100] },
    ],
  };

  const gentleRotate = {
    a: 1,
    k: [
      { t: 0, s: [-8], e: [8], i: { x: [0.45], y: [1] }, o: { x: [0.55], y: [0] } },
      { t: 45, s: [8], e: [-8], i: { x: [0.45], y: [1] }, o: { x: [0.55], y: [0] } },
      { t: 90, s: [-8] },
    ],
  };

  const fullSpin = {
    a: 1,
    k: [
      { t: 0, s: [0], e: [360] },
      { t: 90, s: [360] },
    ],
  };

  const floatY = {
    a: 1,
    k: [
      { t: 0, s: [32, 34, 0], e: [32, 28, 0] },
      { t: 45, s: [32, 28, 0], e: [32, 34, 0] },
      { t: 90, s: [32, 34, 0] },
    ],
  };

  const makeShapeLayer = (
    nm: string,
    shapes: Record<string, unknown>[],
    ksOverrides: Record<string, unknown> = {}
  ) => ({
    ddd: 0,
    ind: 1,
    ty: 4,
    nm,
    sr: 1,
    ks: {
      o: { a: 0, k: 100 },
      r: gentleRotate,
      p: { a: 0, k: [32, 32, 0] },
      a: { a: 0, k: [0, 0, 0] },
      s: pulseScale,
      ...ksOverrides,
    },
    ao: 0,
    shapes,
    ip: 0,
    op: 90,
    st: 0,
    bm: 0,
  });

  switch (name) {
    case 'sparkles':
    case 'rocket':
      return {
        v: '5.7.4',
        fr: 60,
        ip: 0,
        op: 90,
        w: 64,
        h: 64,
        nm: name,
        ddd: 0,
        assets: [],
        layers: [
          makeShapeLayer('StarCore', [
            {
              ty: 'sr',
              sy: 1,
              d: 1,
              pt: { a: 0, k: 4 },
              p: { a: 0, k: [0, 0] },
              r: { a: 0, k: 0 },
              ir: { a: 0, k: 7 },
              is: { a: 0, k: 0 },
              or: { a: 0, k: 22 },
              os: { a: 0, k: 0 },
              nm: 'Polystar',
            },
            { ty: 'fl', c: { a: 0, k: c1 }, o: { a: 0, k: 100 }, r: 1, nm: 'Fill' },
          ]),
          makeShapeLayer(
            'OrbitStar',
            [
              {
                ty: 'sr',
                sy: 1,
                d: 1,
                pt: { a: 0, k: 4 },
                p: { a: 0, k: [16, -15] },
                r: { a: 0, k: 15 },
                ir: { a: 0, k: 3 },
                is: { a: 0, k: 0 },
                or: { a: 0, k: 9 },
                os: { a: 0, k: 0 },
                nm: 'MiniStar',
              },
              { ty: 'fl', c: { a: 0, k: c2 }, o: { a: 0, k: 95 }, r: 1, nm: 'Fill2' },
            ],
            { r: fullSpin }
          ),
        ],
      };

    case 'sun':
      return {
        v: '5.7.4',
        fr: 60,
        ip: 0,
        op: 90,
        w: 64,
        h: 64,
        nm: 'sun',
        ddd: 0,
        assets: [],
        layers: [
          makeShapeLayer(
            'SunRays',
            [
              {
                ty: 'sr',
                sy: 1,
                d: 1,
                pt: { a: 0, k: 8 },
                p: { a: 0, k: [0, 0] },
                r: { a: 0, k: 0 },
                ir: { a: 0, k: 14 },
                is: { a: 0, k: 0 },
                or: { a: 0, k: 24 },
                os: { a: 0, k: 0 },
                nm: 'Rays',
              },
              { ty: 'fl', c: { a: 0, k: c1 }, o: { a: 0, k: 95 }, r: 1, nm: 'Fill' },
            ],
            { r: fullSpin }
          ),
        ],
      };

    case 'moon':
      return {
        v: '5.7.4',
        fr: 60,
        ip: 0,
        op: 90,
        w: 64,
        h: 64,
        nm: 'moon',
        ddd: 0,
        assets: [],
        layers: [
          makeShapeLayer('MoonDisc', [
            { ty: 'el', d: 1, s: { a: 0, k: [34, 34] }, p: { a: 0, k: [0, 0] }, nm: 'Circle' },
            { ty: 'st', c: { a: 0, k: c1 }, o: { a: 0, k: 100 }, w: { a: 0, k: 5 }, lc: 2, lj: 2, nm: 'Stroke' },
            {
              ty: 'sr',
              sy: 1,
              d: 1,
              pt: { a: 0, k: 4 },
              p: { a: 0, k: [14, -12] },
              r: { a: 0, k: 0 },
              ir: { a: 0, k: 2.5 },
              is: { a: 0, k: 0 },
              or: { a: 0, k: 7 },
              os: { a: 0, k: 0 },
              nm: 'Twinkle',
            },
            { ty: 'fl', c: { a: 0, k: c2 }, o: { a: 0, k: 90 }, r: 1, nm: 'Fill' },
          ]),
        ],
      };

    case 'flame':
    case 'heart':
      return {
        v: '5.7.4',
        fr: 60,
        ip: 0,
        op: 90,
        w: 64,
        h: 64,
        nm: name,
        ddd: 0,
        assets: [],
        layers: [
          makeShapeLayer('PulseCore', [
            {
              ty: 'sr',
              sy: 2,
              d: 1,
              pt: { a: 0, k: name === 'heart' ? 3 : 5 },
              p: { a: 0, k: [0, 0] },
              r: { a: 0, k: name === 'heart' ? 180 : 0 },
              or: { a: 0, k: 22 },
              os: { a: 0, k: 35 },
              nm: 'Poly',
            },
            { ty: 'fl', c: { a: 0, k: c1 }, o: { a: 0, k: 95 }, r: 1, nm: 'Fill' },
          ]),
          makeShapeLayer(
            'InnerGlow',
            [
              { ty: 'el', d: 1, s: { a: 0, k: [14, 14] }, p: { a: 0, k: [0, 3] }, nm: 'Core' },
              { ty: 'fl', c: { a: 0, k: c2 }, o: { a: 0, k: 90 }, r: 1, nm: 'Fill2' },
            ],
            { p: floatY }
          ),
        ],
      };

    case 'search':
    case 'clock':
      return {
        v: '5.7.4',
        fr: 60,
        ip: 0,
        op: 90,
        w: 64,
        h: 64,
        nm: name,
        ddd: 0,
        assets: [],
        layers: [
          makeShapeLayer('Ring', [
            { ty: 'el', d: 1, s: { a: 0, k: [36, 36] }, p: { a: 0, k: [0, 0] }, nm: 'OuterRing' },
            { ty: 'st', c: { a: 0, k: c1 }, o: { a: 0, k: 100 }, w: { a: 0, k: 5.5 }, lc: 2, lj: 2, nm: 'Stroke' },
          ]),
          makeShapeLayer(
            'ScannerDot',
            [
              { ty: 'el', d: 1, s: { a: 0, k: [10, 10] }, p: { a: 0, k: [0, -10] }, nm: 'Dot' },
              { ty: 'fl', c: { a: 0, k: c2 }, o: { a: 0, k: 100 }, r: 1, nm: 'Fill' },
            ],
            { r: fullSpin }
          ),
        ],
      };

    default:
      // layers, code, shield, chart, upload, empty
      return {
        v: '5.7.4',
        fr: 60,
        ip: 0,
        op: 90,
        w: 64,
        h: 64,
        nm: name,
        ddd: 0,
        assets: [],
        layers: [
          makeShapeLayer(
            'GeoFrame',
            [
              {
                ty: 'rc',
                d: 1,
                s: { a: 0, k: [34, 34] },
                p: { a: 0, k: [0, 0] },
                r: { a: 0, k: 10 },
                nm: 'RoundedBox',
              },
              { ty: 'st', c: { a: 0, k: c1 }, o: { a: 0, k: 100 }, w: { a: 0, k: 5 }, lc: 2, lj: 2, nm: 'Stroke' },
            ],
            { p: floatY }
          ),
          makeShapeLayer('InnerAccent', [
            {
              ty: 'sr',
              sy: 1,
              d: 1,
              pt: { a: 0, k: 4 },
              p: { a: 0, k: [0, 0] },
              r: { a: 0, k: 0 },
              ir: { a: 0, k: 4 },
              is: { a: 0, k: 0 },
              or: { a: 0, k: 11 },
              os: { a: 0, k: 0 },
              nm: 'Spark',
            },
            { ty: 'fl', c: { a: 0, k: c2 }, o: { a: 0, k: 95 }, r: 1, nm: 'Fill' },
          ]),
        ],
      };
  }
}

const ICON_COLORS: Record<LottieIconName, { primary: string; secondary: string }> = {
  sparkles: { primary: '#a855f7', secondary: '#22d3ee' },
  flame: { primary: '#f97316', secondary: '#facc15' },
  search: { primary: '#06b6d4', secondary: '#a855f7' },
  heart: { primary: '#ec4899', secondary: '#f43f5e' },
  code: { primary: '#22d3ee', secondary: '#818cf8' },
  sun: { primary: '#f59e0b', secondary: '#fde047' },
  moon: { primary: '#818cf8', secondary: '#22d3ee' },
  layers: { primary: '#8b5cf6', secondary: '#06b6d4' },
  clock: { primary: '#f59e0b', secondary: '#38bdf8' },
  shield: { primary: '#10b981', secondary: '#34d399' },
  rocket: { primary: '#a855f7', secondary: '#ec4899' },
  chart: { primary: '#6366f1', secondary: '#22d3ee' },
  upload: { primary: '#8b5cf6', secondary: '#38bdf8' },
  empty: { primary: '#a855f7', secondary: '#06b6d4' },
};

/**
 * Crisp animated SVG fallback while CDN lottie-web script initializes
 */
function AnimatedSvgFallback({
  name,
  size,
  primary,
  secondary,
}: {
  name: LottieIconName;
  size: number;
  primary: string;
  secondary: string;
}) {
  switch (name) {
    case 'sun':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="anim-spin-slow">
          <circle cx="12" cy="12" r="4.5" fill={primary} />
          <path
            d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77"
            stroke={secondary}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'moon':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="anim-float-medium">
          <path
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
            fill={primary}
            stroke={secondary}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'flame':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="anim-orb-pulse">
          <path
            d="M12 2c1.5 3.5 4 5.5 4 9a6 6 0 1 1-12 0c0-2.5 1.5-5 3-6.5 0 2 1.5 3 2.5 3C10.5 5.5 11 3.5 12 2z"
            fill={primary}
          />
          <circle cx="10.5" cy="14" r="2.3" fill={secondary} />
        </svg>
      );
    case 'heart':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="anim-orb-pulse">
          <path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            fill={primary}
          />
        </svg>
      );
    case 'code':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path
            d="M16 18l6-6-6-6M8 6l-6 6 6 6"
            stroke={primary}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'search':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke={primary} strokeWidth="2.2" />
          <path d="M20 20l-3.8-3.8" stroke={secondary} strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="anim-orb-pulse">
          <path
            d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2z"
            fill={primary}
          />
          <circle cx="18.5" cy="5.5" r="2" fill={secondary} />
        </svg>
      );
  }
}

let lottieScriptPromise: Promise<void> | null = null;

function ensureLottieCdnLoaded(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  const win = window as LottieWindow;
  if (win.lottie) return Promise.resolve();
  if (lottieScriptPromise) return lottieScriptPromise;

  lottieScriptPromise = new Promise<void>((resolve) => {
    const existing = document.querySelector('script[data-lottie-cdn="1"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js';
    script.async = true;
    script.dataset.lottieCdn = '1';
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });

  return lottieScriptPromise;
}

export function LottieIcon({
  name,
  size = 18,
  className,
  primaryColor,
  secondaryColor,
  loop = true,
  autoplay = true,
  ariaLabel,
}: {
  name: LottieIconName;
  size?: number;
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
  loop?: boolean;
  autoplay?: boolean;
  ariaLabel?: string;
}) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [cdnReady, setCdnReady] = useState(false);

  const palette = ICON_COLORS[name] || ICON_COLORS.sparkles;
  const primary = primaryColor || palette.primary;
  const secondary = secondaryColor || palette.secondary;

  const useFullLottie = size >= 22;

  useEffect(() => {
    if (!useFullLottie || typeof window === 'undefined') return;
    let active = true;
    let animInstance: ReturnType<NonNullable<LottieWindow['lottie']>['loadAnimation']> | null = null;

    void ensureLottieCdnLoaded().then(() => {
      if (!active || !containerRef.current) return;
      const win = window as LottieWindow;
      if (!win.lottie) return;
      containerRef.current.innerHTML = '';
      const data = buildLottieData(name, primary, secondary);
      animInstance = win.lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop,
        autoplay,
        animationData: data,
      });
      setCdnReady(true);
    });

    return () => {
      active = false;
      animInstance?.destroy();
    };
  }, [useFullLottie, name, primary, secondary, loop, autoplay]);

  return (
    <span
      className={cn('inline-flex items-center justify-center shrink-0 select-none relative', className)}
      style={{ width: size, height: size }}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      <span
        ref={containerRef}
        className="w-full h-full inline-flex items-center justify-center"
        style={{ display: useFullLottie && cdnReady ? 'inline-flex' : 'none' }}
      />
      {(!useFullLottie || !cdnReady) && (
        <AnimatedSvgFallback name={name} size={size} primary={primary} secondary={secondary} />
      )}
    </span>
  );
}
