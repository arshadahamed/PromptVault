'use client';
import { useState } from 'react';
import { Menu, X, Search } from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from './Sidebar';
import type { SiteSettings } from '@/lib/settings';
import { useApp } from '@/context/AppContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LottieIcon } from '@/components/ui/LottieIcon';

interface Props {
  siteName: string;
  settings: SiteSettings;
  tabCounts?: Record<string, number>;
}

export function MobileHeader({ siteName, settings, tabCounts }: Props) {
  const [open, setOpen] = useState(false);
  const { isAdmin, openModal } = useApp();

  return (
    <>
      <header
        className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center gap-2 px-3.5 h-14 transition-colors duration-200"
        style={{
          backgroundColor: 'var(--bg-topbar)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors cursor-pointer theme-surface theme-surface-hover"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        <Link href="/" className="flex items-center gap-2 flex-1 min-w-0">
          {settings.logoImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logoImageUrl}
              alt={siteName || 'PromptVault'}
              width={28}
              height={28}
              className="w-[28px] h-[28px] rounded-lg object-contain shrink-0"
            />
          ) : (
            <div
              className="w-[28px] h-[28px] rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
            >
              <LottieIcon name="sparkles" size={16} primaryColor="#ffffff" secondaryColor="#a5f3fc" />
            </div>
          )}
          <span
            className="text-[14px] font-bold truncate"
            style={{ fontFamily: 'var(--font-poppins)', color: 'var(--fg-primary)' }}
          >
            {siteName || 'PromptVault'}
          </span>
        </Link>

        <button
          type="button"
          onClick={() => openModal('search')}
          aria-label="Search prompts"
          className="w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer theme-surface theme-surface-hover"
        >
          <Search size={15} />
        </button>

        <ThemeToggle variant="icon" />

        {isAdmin ? (
          <Link
            href="/admin"
            className="flex items-center px-3 h-8 rounded-full text-[11px] font-semibold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
          >
            Admin
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex items-center px-3 h-8 rounded-full text-[11px] font-semibold shrink-0 theme-surface theme-surface-hover"
          >
            Login
          </Link>
        )}
      </header>

      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/65 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="md:hidden fixed inset-y-0 left-0 z-50 w-[268px] shadow-2xl">
            <Sidebar
              settings={settings}
              tabCounts={tabCounts}
              onNavigate={() => setOpen(false)}
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-3.5 right-3 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer theme-surface"
              aria-label="Close menu"
            >
              <X size={15} />
            </button>
          </div>
        </>
      )}
    </>
  );
}
