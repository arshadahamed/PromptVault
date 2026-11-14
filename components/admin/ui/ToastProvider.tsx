'use client';
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
}

interface ToastItem extends Required<Pick<ToastOptions, 'title' | 'variant'>> {
  id: string;
  description?: string;
}

interface ToastContextValue {
  toast: (opts: ToastOptions) => void;
  dismiss: (id: string) => void;
}

const ToastCtx = createContext<ToastContextValue>({
  toast: () => {},
  dismiss: () => {},
});

const VARIANT_STYLES: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; bg: string; border: string; text: string; iconColor: string }
> = {
  success: {
    icon: CheckCircle2,
    bg: 'var(--adm-surface-elevated)',
    border: 'var(--adm-success-border)',
    text: 'var(--adm-text)',
    iconColor: 'var(--adm-success-text)',
  },
  error: {
    icon: AlertCircle,
    bg: 'var(--adm-surface-elevated)',
    border: 'var(--adm-danger-border)',
    text: 'var(--adm-text)',
    iconColor: 'var(--adm-danger-text)',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'var(--adm-surface-elevated)',
    border: 'var(--adm-warning-border)',
    text: 'var(--adm-text)',
    iconColor: 'var(--adm-warning-text)',
  },
  info: {
    icon: Info,
    bg: 'var(--adm-surface-elevated)',
    border: 'var(--adm-info-border)',
    text: 'var(--adm-text)',
    iconColor: 'var(--adm-info-text)',
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, variant = 'info', durationMs = 4200 }: ToastOptions) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setItems((prev) => [...prev.slice(-3), { id, title, description, variant }]);
      if (durationMs > 0) {
        const timer = setTimeout(() => dismiss(id), durationMs);
        timers.current.set(id, timer);
      }
    },
    [dismiss]
  );

  return (
    <ToastCtx.Provider value={{ toast, dismiss }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-4 right-4 z-[90] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm pointer-events-none"
      >
        {items.map((item) => {
          const style = VARIANT_STYLES[item.variant];
          const Icon = style.icon;
          return (
            <div
              key={item.id}
              role={item.variant === 'error' ? 'alert' : 'status'}
              className={cn(
                'pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border transition-all'
              )}
              style={{
                backgroundColor: style.bg,
                borderColor: style.border,
                color: style.text,
                boxShadow: 'var(--adm-shadow-lg)',
              }}
            >
              <Icon size={17} className="shrink-0 mt-0.5" style={{ color: style.iconColor }} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold leading-snug">{item.title}</p>
                {item.description && (
                  <p className="text-[12px] mt-0.5 leading-snug" style={{ color: 'var(--adm-text-muted)' }}>
                    {item.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
                className="p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                style={{ color: 'var(--adm-text-muted)' }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
