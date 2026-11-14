'use client';
import Link from 'next/link';
import { ChevronRight, Loader2, RefreshCw, Inbox, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const BTN_SIZE: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[12px] rounded-lg gap-1.5',
  md: 'h-9 px-4 text-[13px] rounded-[10px] gap-2',
  lg: 'h-11 px-5 text-[13.5px] rounded-xl gap-2',
};

export function AdminButton({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  style,
  type = 'button',
  ...props
}: ButtonProps) {
  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
      color: '#ffffff',
      border: '1px solid rgba(255,255,255,0.12)',
      boxShadow: '0 4px 16px -4px rgba(124, 58, 237, 0.45)',
    },
    secondary: {
      backgroundColor: 'var(--adm-surface-muted)',
      color: 'var(--adm-text)',
      border: '1px solid var(--adm-border)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--adm-text-secondary)',
      border: '1px solid var(--adm-border-strong)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--adm-text-muted)',
      border: '1px solid transparent',
    },
    danger: {
      backgroundColor: 'var(--adm-danger-bg)',
      color: 'var(--adm-danger-text)',
      border: '1px solid var(--adm-danger-border)',
    },
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 shrink-0',
        BTN_SIZE[size],
        className
      )}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin shrink-0" /> : icon}
      {children}
    </button>
  );
}

export type BadgeVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

export function AdminBadge({
  variant = 'neutral',
  children,
  className,
}: {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}) {
  const styles: Record<BadgeVariant, React.CSSProperties> = {
    neutral: {
      backgroundColor: 'var(--adm-surface-muted)',
      borderColor: 'var(--adm-border)',
      color: 'var(--adm-text-secondary)',
    },
    accent: {
      backgroundColor: 'var(--adm-accent-soft)',
      borderColor: 'var(--adm-accent-border)',
      color: 'var(--adm-accent-text)',
    },
    success: {
      backgroundColor: 'var(--adm-success-bg)',
      borderColor: 'var(--adm-success-border)',
      color: 'var(--adm-success-text)',
    },
    warning: {
      backgroundColor: 'var(--adm-warning-bg)',
      borderColor: 'var(--adm-warning-border)',
      color: 'var(--adm-warning-text)',
    },
    danger: {
      backgroundColor: 'var(--adm-danger-bg)',
      borderColor: 'var(--adm-danger-border)',
      color: 'var(--adm-danger-text)',
    },
    info: {
      backgroundColor: 'var(--adm-info-bg)',
      borderColor: 'var(--adm-info-border)',
      color: 'var(--adm-info-text)',
    },
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap',
        className
      )}
      style={styles[variant]}
    >
      {children}
    </span>
  );
}

export function AdminCard({
  children,
  className,
  padding = 'md',
}: {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}) {
  const pad = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' }[padding];
  return (
    <div className={cn('admin-surface rounded-2xl', pad, className)}>
      {children}
    </div>
  );
}

export function AdminSectionHeader({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{
            backgroundColor: 'var(--adm-accent-soft)',
            border: '1px solid var(--adm-accent-border)',
          }}
        >
          <Icon size={14} style={{ color: 'var(--adm-accent-text)' }} />
        </div>
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold leading-tight" style={{ color: 'var(--adm-text)' }}>
            {title}
          </h2>
          {description && (
            <p className="text-[12px] mt-0.5 leading-snug" style={{ color: 'var(--adm-text-muted)' }}>
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function AdminPageHeader({
  title,
  description,
  breadcrumbs,
  badge,
  actions,
}: {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 mb-2 flex-wrap">
            {breadcrumbs.map((crumb, idx) => (
              <span key={crumb.label + idx} className="inline-flex items-center gap-1.5 text-[12px]">
                {idx > 0 && <ChevronRight size={12} style={{ color: 'var(--adm-text-subtle)' }} />}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="transition-colors hover:underline"
                    style={{ color: 'var(--adm-text-muted)' }}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-medium" style={{ color: 'var(--adm-text-secondary)' }}>
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1
            className="text-[22px] sm:text-[24px] font-bold tracking-tight leading-tight"
            style={{ color: 'var(--adm-text)', fontFamily: 'var(--font-poppins)' }}
          >
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-[13px] mt-1 leading-relaxed" style={{ color: 'var(--adm-text-muted)' }}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
    </div>
  );
}

export function AdminFormField({
  label,
  htmlFor,
  required,
  hint,
  error,
  rightLabel,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  rightLabel?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className="text-[11.5px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--adm-text-muted)' }}
        >
          {label}
          {required && (
            <span className="ml-1" style={{ color: 'var(--adm-danger-text)' }} aria-hidden="true">
              *
            </span>
          )}
        </label>
        {rightLabel}
      </div>
      {children}
      {error ? (
        <p role="alert" className="text-[12px] font-medium" style={{ color: 'var(--adm-danger-text)' }}>
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11.5px]" style={{ color: 'var(--adm-text-subtle)' }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function AdminInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('admin-control w-full px-3.5 py-2.5', className)} {...props} />;
}

export function AdminTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('admin-control w-full px-3.5 py-2.5', className)} {...props} />;
}

export function AdminSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn('admin-control w-full px-3 py-2.5 cursor-pointer', className)} {...props}>
      {children}
    </select>
  );
}

export function AdminSwitch({
  checked,
  onChange,
  label,
  description,
  id,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  id?: string;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 p-3.5 rounded-xl"
      style={{
        backgroundColor: 'var(--adm-surface-muted)',
        border: '1px solid var(--adm-border)',
      }}
    >
      <div className="min-w-0">
        <label
          htmlFor={id}
          className="text-[13px] font-semibold block cursor-pointer"
          style={{ color: 'var(--adm-text)' }}
        >
          {label}
        </label>
        {description && (
          <p className="text-[12px] mt-0.5 leading-snug" style={{ color: 'var(--adm-text-muted)' }}>
            {description}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0"
        style={{
          backgroundColor: checked ? 'var(--adm-accent)' : 'var(--adm-border-strong)',
        }}
      >
        <span
          className="block w-5 h-5 rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }}
        />
      </button>
    </div>
  );
}

export function AdminEmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-14 px-6 flex flex-col items-center justify-center text-center">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3.5"
        style={{
          backgroundColor: 'var(--adm-accent-soft)',
          border: '1px solid var(--adm-accent-border)',
        }}
      >
        <Icon size={20} style={{ color: 'var(--adm-accent-text)' }} />
      </div>
      <h3 className="text-[14px] font-semibold" style={{ color: 'var(--adm-text)' }}>
        {title}
      </h3>
      <p className="text-[12.5px] mt-1 max-w-sm leading-relaxed" style={{ color: 'var(--adm-text-muted)' }}>
        {description}
      </p>
      {action && <div className="mt-4 flex items-center gap-2 flex-wrap justify-center">{action}</div>}
    </div>
  );
}

export function AdminErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      style={{
        backgroundColor: 'var(--adm-danger-bg)',
        border: '1px solid var(--adm-danger-border)',
        color: 'var(--adm-danger-text)',
      }}
    >
      <div className="flex items-start gap-3">
        <AlertCircle size={18} className="shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-semibold">Something went wrong</p>
          <p className="text-[12.5px] mt-0.5 opacity-90">{message}</p>
        </div>
      </div>
      {onRetry && (
        <AdminButton variant="outline" size="sm" onClick={onRetry} icon={<RefreshCw size={13} />}>
          Retry
        </AdminButton>
      )}
    </div>
  );
}
