'use client';
import { useEffect, useId, useRef } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useOverlayAccessibility(
  open: boolean,
  containerRef: React.RefObject<HTMLElement | null>,
  onClose: () => void,
  preventClose?: boolean
) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTarget = containerRef.current;
    const raf = requestAnimationFrame(() => {
      if (!focusTarget) return;
      const auto = focusTarget.querySelector<HTMLElement>('[data-autofocus]');
      if (auto) {
        auto.focus();
        return;
      }
      const first = focusTarget.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (first || focusTarget).focus();
    });

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (!preventClose) {
          e.preventDefault();
          onClose();
        }
        return;
      }
      if (e.key === 'Tab' && containerRef.current) {
        const focusables = Array.from(
          containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter((el) => el.offsetParent !== null);
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [open, containerRef, onClose, preventClose]);
}

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  preventClose?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const DIALOG_MAX_W: Record<NonNullable<DialogProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  size = 'md',
  preventClose = false,
  footer,
  children,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useOverlayAccessibility(open, panelRef, onClose, preventClose);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-[3px]"
        onClick={() => {
          if (!preventClose) onClose();
        }}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-10 w-full rounded-2xl flex flex-col max-h-[88vh] outline-none',
          DIALOG_MAX_W[size]
        )}
        style={{
          backgroundColor: 'var(--adm-surface-elevated)',
          border: '1px solid var(--adm-border-strong)',
          boxShadow: 'var(--adm-shadow-lg)',
          color: 'var(--adm-text)',
        }}
      >
        <div
          className="flex items-start justify-between gap-4 px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--adm-border)' }}
        >
          <div className="min-w-0">
            <h2 id={titleId} className="text-[15px] font-semibold leading-snug">
              {title}
            </h2>
            {description && (
              <p
                id={descId}
                className="text-[12.5px] mt-1 leading-relaxed"
                style={{ color: 'var(--adm-text-muted)' }}
              >
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={preventClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors cursor-pointer disabled:opacity-40"
            style={{
              backgroundColor: 'var(--adm-surface-muted)',
              color: 'var(--adm-text-muted)',
            }}
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div
            className="px-5 py-3.5 flex items-center justify-end gap-2.5 shrink-0"
            style={{
              borderTop: '1px solid var(--adm-border)',
              backgroundColor: 'var(--adm-surface-muted)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const confirmBg =
    variant === 'danger'
      ? '#dc2626'
      : variant === 'warning'
        ? '#d97706'
        : 'var(--adm-accent)';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      preventClose={loading}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-[13px] font-medium cursor-pointer disabled:opacity-50 transition-colors"
            style={{
              backgroundColor: 'var(--adm-surface)',
              border: '1px solid var(--adm-border-strong)',
              color: 'var(--adm-text)',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            data-autofocus
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white cursor-pointer disabled:opacity-60 transition-opacity hover:opacity-90"
            style={{ backgroundColor: confirmBg }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3.5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            backgroundColor:
              variant === 'danger'
                ? 'var(--adm-danger-bg)'
                : variant === 'warning'
                  ? 'var(--adm-warning-bg)'
                  : 'var(--adm-accent-soft)',
            border: `1px solid ${
              variant === 'danger'
                ? 'var(--adm-danger-border)'
                : variant === 'warning'
                  ? 'var(--adm-warning-border)'
                  : 'var(--adm-accent-border)'
            }`,
            color:
              variant === 'danger'
                ? 'var(--adm-danger-text)'
                : variant === 'warning'
                  ? 'var(--adm-warning-text)'
                  : 'var(--adm-accent-text)',
          }}
        >
          <AlertTriangle size={18} />
        </div>
        <p className="text-[13px] leading-relaxed pt-0.5" style={{ color: 'var(--adm-text-secondary)' }}>
          {description}
        </p>
      </div>
    </Dialog>
  );
}

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: 'md' | 'lg' | 'xl';
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const DRAWER_WIDTHS: Record<NonNullable<DrawerProps['width']>, string> = {
  md: 'max-w-md',
  lg: 'max-w-xl',
  xl: 'max-w-2xl',
};

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  width = 'lg',
  headerActions,
  footer,
  children,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useOverlayAccessibility(open, panelRef, onClose);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[65] flex justify-end">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'relative z-10 h-full w-full flex flex-col outline-none',
          DRAWER_WIDTHS[width]
        )}
        style={{
          backgroundColor: 'var(--adm-surface)',
          borderLeft: '1px solid var(--adm-border-strong)',
          boxShadow: 'var(--adm-shadow-lg)',
          color: 'var(--adm-text)',
        }}
      >
        <div
          className="flex items-center justify-between gap-3 px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--adm-border)' }}
        >
          <div className="min-w-0">
            <h2 id={titleId} className="text-[15px] font-semibold truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[12px] truncate mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close panel"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--adm-surface-muted)',
                color: 'var(--adm-text-muted)',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">{children}</div>

        {footer && (
          <div
            className="px-5 py-3.5 flex items-center justify-between gap-3 shrink-0"
            style={{
              borderTop: '1px solid var(--adm-border)',
              backgroundColor: 'var(--adm-surface-muted)',
            }}
          >
            {footer}
          </div>
        )}
      </aside>
    </div>
  );
}
