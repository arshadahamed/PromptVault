'use client';
import Link from 'next/link';
import { Star, Lock, LayoutDashboard } from 'lucide-react';
import type { SiteSettings } from '@/lib/settings';
import { SidebarLogoutButton } from './SidebarLogoutButton';
import { useApp } from '@/context/AppContext';
import { isSafeHref, safeHref } from '@/lib/security';

interface Props {
  settings: SiteSettings;
}

export function SidebarFooter({ settings }: Props) {
  const { isAdmin } = useApp();
  const footerLinks = settings.footerLinks?.length
    ? settings.footerLinks.filter((l) => isSafeHref(l.href))
    : [];

  const githubUrl = isSafeHref(settings.socialLinks?.github) ? settings.socialLinks.github : '';

  return (
    <div className="px-3.5 pb-4 flex flex-col gap-2.5">
      {(footerLinks.length > 0 || githubUrl) && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {footerLinks.map((link, i) => (
            <span key={link.label + i} className="flex items-center gap-1.5">
              {i > 0 && <span style={{ color: 'var(--fg-subtle)' }} className="text-xs">·</span>}
              <a
                href={safeHref(link.href)}
                className="text-[11px] hover:underline transition-colors"
                style={{ color: 'var(--fg-subtle)' }}
              >
                {link.label}
              </a>
            </span>
          ))}
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-[11px] hover:underline transition-colors"
              style={{ color: 'var(--fg-subtle)' }}
            >
              <Star size={11} fill="currentColor" />
              <span>Website</span>
            </a>
          )}
        </div>
      )}

      {settings.footerCopyright && (
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--fg-subtle)' }}>
          {settings.footerCopyright}
        </p>
      )}

      <p className="text-[11px]" style={{ color: 'var(--fg-subtle)' }}>
        Built by{' '}
        <a
          href="https://arshadahamed.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold hover:underline transition-colors"
          style={{ color: 'var(--accent-text)' }}
        >
          ArshaD
        </a>
      </p>

      {isAdmin ? (
        <>
          <Link
            href="/admin"
            className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              boxShadow: '0 4px 20px rgba(124,58,237,0.32)',
            }}
          >
            <LayoutDashboard size={14} />
            Admin Studio
          </Link>
          <SidebarLogoutButton />
        </>
      ) : (
        <Link
          href="/login"
          className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-[13px] font-semibold transition-all theme-surface theme-surface-hover"
        >
          <Lock size={13} style={{ color: 'var(--accent-text)' }} />
          Admin Login
        </Link>
      )}
    </div>
  );
}
