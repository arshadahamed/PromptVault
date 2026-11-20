'use client';
import Link from 'next/link';
import { NavItems } from './NavItems';
import { Categories } from './Categories';
import { SidebarFooter } from './SidebarFooter';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LottieIcon } from '@/components/ui/LottieIcon';
import type { SiteSettings } from '@/lib/settings';

interface Props {
  settings: SiteSettings;
  tabCounts?: Record<string, number>;
  onNavigate?: () => void;
}

export function Sidebar({ settings, tabCounts, onNavigate }: Props) {
  return (
    <aside
      className="fixed inset-y-0 left-0 w-[268px] flex flex-col z-30 overflow-y-auto transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-default)',
        color: 'var(--fg-primary)',
      }}
    >
      {/* Brand header with Lottie Sparkles badge */}
      <Link
        href="/"
        onClick={onNavigate}
        className="px-4 py-4 flex items-center gap-3 shrink-0 group"
      >
        {settings.logoImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={settings.logoImageUrl}
            alt={settings.siteName || 'PromptVault'}
            width={38}
            height={38}
            className="w-[38px] h-[38px] rounded-xl object-contain"
            style={{ border: '1px solid var(--border-default)' }}
          />
        ) : (
          <div
            className="w-[38px] h-[38px] rounded-xl flex items-center justify-center shrink-0 anim-glow-pulse relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
          >
            <LottieIcon name="sparkles" size={20} primaryColor="#ffffff" secondaryColor="#a5f3fc" />
          </div>
        )}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className="text-[14.5px] font-bold leading-tight truncate transition-colors"
              style={{ fontFamily: 'var(--font-poppins)', color: 'var(--fg-primary)' }}
            >
              {settings.siteName || 'PromptVault'}
            </span>
            <span
              className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
              style={{
                backgroundColor: 'var(--accent-soft)',
                color: 'var(--accent-text)',
                border: '1px solid var(--accent-border)',
              }}
            >
              PRO
            </span>
          </div>
          <span
            className="text-[11px] font-medium truncate mt-0.5"
            style={{ color: 'var(--fg-subtle)' }}
          >
            {settings.siteTagline || 'AI Prompt & Vibe Studio'}
          </span>
        </div>
      </Link>

      <div className="mx-4 mb-3 h-px" style={{ backgroundColor: 'var(--border-default)' }} />

      <NavItems onNavigate={onNavigate} />

      <div className="mx-4 my-3.5 h-px" style={{ backgroundColor: 'var(--border-default)' }} />

      <Categories tabCounts={tabCounts} onNavigate={onNavigate} />

      <div className="flex-1 min-h-4" />

      {/* Segmented Light / Dark / System Theme Control */}
      <div className="px-3.5 pb-3">
        <div className="flex items-center justify-between px-1 mb-1.5">
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: 'var(--fg-subtle)' }}
          >
            Theme Mode
          </span>
          <span
            className="text-[10px] font-mono"
            style={{ color: 'var(--accent-text)' }}
          >
            shadcn · AntD · MUI
          </span>
        </div>
        <ThemeToggle variant="segmented" />
      </div>

      <div className="mx-4 mb-3 h-px" style={{ backgroundColor: 'var(--border-default)' }} />

      <SidebarFooter settings={settings} />
    </aside>
  );
}
