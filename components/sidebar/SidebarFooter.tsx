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
              {i > 0 && <span className="text-[#3f3f46] text-xs">·</span>}
              <a
                href={safeHref(link.href)}
                className="text-[11px] text-[#71717a] hover:text-white transition-colors"
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
              className="ml-auto flex items-center gap-1 text-[11px] text-[#71717a] hover:text-white transition-colors"
            >
              <Star size={11} fill="currentColor" />
              <span>Website</span>
            </a>
          )}
        </div>
      )}

      {settings.footerCopyright && (
        <p className="text-[11px] leading-relaxed text-[#71717a]">
          {settings.footerCopyright}
        </p>
      )}

      <p className="text-[11px] text-[#71717a]">
        Built by{' '}
        <a
          href="https://arshadahamed.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-violet-400 hover:text-violet-300 hover:underline transition-colors"
        >
          ArshaD
        </a>
      </p>

      {isAdmin ? (
        <>
          <Link
            href="/admin"
            className="w-full flex items-center justify-center gap-2 h-10 rounded-[11px] text-[13px] font-semibold text-white transition-all hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
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
          className="w-full flex items-center justify-center gap-2 h-10 rounded-[11px] text-[13px] font-medium text-[#e4e4e7] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all"
        >
          <Lock size={13} className="text-[#a1a1aa]" />
          Admin Login
        </Link>
      )}
    </div>
  );
}
