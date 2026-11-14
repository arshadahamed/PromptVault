import Link from 'next/link';
import { Star, Lock, LayoutDashboard, Sparkles } from 'lucide-react';
import type { SiteSettings } from '@/lib/settings';
import { SidebarLogoutButton } from './SidebarLogoutButton';

interface Props {
  settings: SiteSettings;
  isLoggedIn: boolean;
}

export function SidebarFooter({ settings, isLoggedIn }: Props) {
  const footerLinks = settings.footerLinks?.length
    ? settings.footerLinks
    : [{ label: 'Terms', href: '#terms' }, { label: 'Privacy', href: '#privacy' }];

  const githubUrl = settings.socialLinks?.github || '';

  return (
    <div className="px-3 pb-4 flex flex-col gap-2.5">
      {/* Footer links */}
      <div className="flex items-center gap-1 flex-wrap">
        {footerLinks.map((link, i) => (
          <span key={link.label + i} className="flex items-center gap-1">
            {i > 0 && <span style={{ color: '#2d2d34' }} className="text-xs">·</span>}
            <a
              href={link.href}
              className="text-[11px] transition-colors hover:text-white"
              style={{ color: '#5c5c6b' }}
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
            className="ml-auto flex items-center gap-1 text-[11px] transition-colors hover:text-white"
            style={{ color: '#5c5c6b' }}
          >
            <Star size={11} fill="currentColor" />
            <span>Star</span>
          </a>
        )}
      </div>

      {/* Copyright */}
      {settings.footerCopyright && (
        <p className="text-[10px] leading-relaxed" style={{ color: '#3d3d47' }}>
          {settings.footerCopyright}
        </p>
      )}

      {/* Attribution */}
      <p className="text-[10px]" style={{ color: '#3d3d47' }}>
        Made by{' '}
        <a
          href="https://arshadahamed.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium hover:underline"
          style={{ color: '#a855f7' }}
        >
          ArshaD
        </a>
      </p>

      {isLoggedIn ? (
        <>
          <Link
            href="/admin"
            className="w-full flex items-center justify-center gap-2 h-10 rounded-[10px] text-[13px] font-semibold transition-all hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              color: '#ffffff',
              boxShadow: '0 0 20px rgba(124,58,237,0.3)',
            }}
          >
            <LayoutDashboard size={14} />
            Admin Panel
          </Link>
          <SidebarLogoutButton />
        </>
      ) : (
        <Link
          href="/login"
          className="w-full flex items-center justify-center gap-2 h-10 rounded-[10px] text-[13px] font-semibold transition-all hover:opacity-90"
          style={{
            background: 'rgba(255,255,255,0.05)',
            color: '#f0f0f2',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Lock size={13} />
          Login
        </Link>
      )}
    </div>
  );
}
