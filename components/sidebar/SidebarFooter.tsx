import Link from 'next/link';
import { Star, Lock, LayoutDashboard } from 'lucide-react';
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
      {/* Footer links + GitHub */}
      <div className="flex items-center gap-1 flex-wrap">
        {footerLinks.map((link, i) => (
          <span key={link.label + i} className="flex items-center gap-1">
            {i > 0 && <span className="text-[#d6d3cc] text-xs">·</span>}
            <a
              href={link.href}
              className="text-[11px] text-[#6b7280] hover:text-[#1b1b1b] transition-colors"
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
            className="ml-auto flex items-center gap-1 text-[11px] text-[#6b7280] hover:text-[#1b1b1b] transition-colors"
          >
            <Star size={11} fill="currentColor" />
            <span>Star</span>
          </a>
        )}
      </div>

      {/* Copyright */}
      {settings.footerCopyright && (
        <p className="text-[10px] text-[#9ca3af] leading-relaxed">
          {settings.footerCopyright}
        </p>
      )}

      {isLoggedIn ? (
        <>
          {/* Admin Panel button */}
          <Link
            href="/admin"
            className="w-full flex items-center justify-center gap-2 h-10 rounded-[10px] text-[13px] font-semibold transition-colors"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              color: '#ffffff',
            }}
          >
            <LayoutDashboard size={14} />
            Admin Panel
          </Link>

          {/* Logout */}
          <SidebarLogoutButton />
        </>
      ) : (
        /* Login button */
        <Link
          href="/login"
          className="w-full flex items-center justify-center gap-2 h-10 rounded-[10px] text-[13px] font-semibold transition-colors"
          style={{
            background: 'linear-gradient(135deg, #1b1b1b, #3d3d3d)',
            color: '#ffffff',
          }}
        >
          <Lock size={13} />
          Login
        </Link>
      )}
    </div>
  );
}
