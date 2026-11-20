'use client';
import { Monitor } from 'lucide-react';
import { useTheme, type ThemeMode } from '@/context/AdminThemeContext';
import { LottieIcon } from './LottieIcon';
import { cn } from '@/lib/utils';

/**
 * Multi-variant Theme Switcher powered by shadcn/ui, Ant Design Segmented, MUI IconButton,
 * and animated Lottie Sun/Moon icons.
 */
export function ThemeToggle({
  variant = 'pill',
  className,
}: {
  variant?: 'segmented' | 'pill' | 'icon';
  className?: string;
}) {
  const { mode, resolved, setMode, toggleTheme } = useTheme();
  const isDark = resolved === 'dark';

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className={cn(
          'relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer theme-surface theme-surface-hover',
          className
        )}
      >
        <LottieIcon name={isDark ? 'sun' : 'moon'} size={19} />
      </button>
    );
  }

  if (variant === 'segmented') {
    const opts: { value: ThemeMode; label: string }[] = [
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
      { value: 'system', label: 'System' },
    ];

    return (
      <div
        role="group"
        aria-label="Color theme preference"
        className={cn(
          'inline-flex items-center p-1 rounded-xl gap-1 w-full',
          className
        )}
        style={{
          backgroundColor: 'var(--bg-muted)',
          border: '1px solid var(--border-default)',
        }}
      >
        {opts.map((opt) => {
          const active = mode === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMode(opt.value)}
              aria-pressed={active}
              className={cn(
                'flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-[11.5px] font-semibold transition-all cursor-pointer',
                active ? 'shadow-sm' : 'opacity-75 hover:opacity-100'
              )}
              style={{
                backgroundColor: active ? 'var(--bg-card)' : 'transparent',
                color: active ? 'var(--accent-text)' : 'var(--fg-muted)',
                border: active ? '1px solid var(--border-strong)' : '1px solid transparent',
              }}
            >
              {opt.value === 'light' && <LottieIcon name="sun" size={14} />}
              {opt.value === 'dark' && <LottieIcon name="moon" size={14} />}
              {opt.value === 'system' && <Monitor size={13} />}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Default 'pill' variant: Sleek AntD / shadcn / MUI hybrid toggle pill
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={cn(
        'inline-flex items-center gap-2 h-9 px-3 rounded-xl text-[12px] font-semibold transition-all duration-200 cursor-pointer theme-surface theme-surface-hover shrink-0',
        className
      )}
    >
      <LottieIcon name={isDark ? 'moon' : 'sun'} size={17} />
      <span style={{ color: 'var(--fg-primary)' }}>
        {isDark ? 'Dark' : 'Light'}
      </span>
      <span
        className="text-[10px] px-1.5 py-0.5 rounded-md font-mono uppercase"
        style={{
          backgroundColor: 'var(--accent-soft)',
          color: 'var(--accent-text)',
        }}
      >
        {isDark ? 'Switch ☀️' : 'Switch 🌙'}
      </span>
    </button>
  );
}
