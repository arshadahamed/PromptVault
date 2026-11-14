import Link from 'next/link';
import { NavItems } from './NavItems';
import { Categories } from './Categories';
import { SidebarFooter } from './SidebarFooter';
import type { SiteSettings } from '@/lib/settings';

interface Props {
  settings: SiteSettings;
  tabCounts?: Record<string, number>;
  onNavigate?: () => void;
}

export function Sidebar({ settings, tabCounts, onNavigate }: Props) {
  return (
    <aside
      className="fixed inset-y-0 left-0 w-[260px] flex flex-col z-30 overflow-y-auto"
      style={{
        background: '#0d0d11',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Brand header */}
      <Link
        href="/"
        onClick={onNavigate}
        className="px-5 py-5 flex items-center gap-3 shrink-0 group"
      >
        {settings.logoImageUrl ? (
          <img
            src={settings.logoImageUrl}
            alt={settings.siteName || 'PromptVault'}
            width={34}
            height={34}
            className="w-[34px] h-[34px] rounded-[10px] object-contain ring-1 ring-white/10"
          />
        ) : (
          <div
            className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center shrink-0 anim-glow-pulse"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
          >
            <span
              className="text-white text-xs font-bold"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              {settings.logoText || 'P'}
            </span>
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <span
            className="text-[14px] font-bold text-white leading-tight truncate group-hover:text-violet-200 transition-colors"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            {settings.siteName || 'PromptVault'}
          </span>
          <span className="text-[11px] font-medium text-[#71717a] truncate">
            {settings.siteTagline || 'AI Prompt Studio'}
          </span>
        </div>
      </Link>

      <div className="mx-4 mb-3 h-px bg-white/[0.06]" />

      <NavItems onNavigate={onNavigate} />

      <div className="mx-4 my-3.5 h-px bg-white/[0.06]" />

      <Categories tabCounts={tabCounts} onNavigate={onNavigate} />

      <div className="flex-1 min-h-4" />

      <div className="mx-4 mb-3 h-px bg-white/[0.06]" />

      <SidebarFooter settings={settings} />
    </aside>
  );
}
