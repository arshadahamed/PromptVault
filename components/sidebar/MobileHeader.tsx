'use client';
import { useState } from 'react';
import { Menu, X, Search, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from './Sidebar';
import type { SiteSettings } from '@/lib/settings';
import { useApp } from '@/context/AppContext';

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
        className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center gap-2 px-3.5 h-14"
        style={{
          background: 'rgba(9,9,11,0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-[10px] text-[#a1a1aa] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          aria-label="Open menu"
        >
          <Menu size={19} />
        </button>

        <Link href="/" className="flex items-center gap-2 flex-1 min-w-0">
          {settings.logoImageUrl ? (
            <img
              src={settings.logoImageUrl}
              alt={siteName || 'PromptVault'}
              width={26}
              height={26}
              className="w-[26px] h-[26px] rounded-[7px] object-contain shrink-0"
            />
          ) : (
            <div
              className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
            >
              <Sparkles size={13} className="text-white" />
            </div>
          )}
          <span
            className="text-[14px] font-bold text-white truncate"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            {siteName || 'PromptVault'}
          </span>
        </Link>

        <button
          type="button"
          onClick={() => openModal('search')}
          aria-label="Search prompts"
          className="w-9 h-9 flex items-center justify-center rounded-[10px] text-[#a1a1aa] hover:text-white bg-white/[0.04] border border-white/[0.08] cursor-pointer"
        >
          <Search size={16} />
        </button>

        {isAdmin ? (
          <Link
            href="/admin"
            className="flex items-center px-3 h-8 rounded-full text-[11px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
          >
            Admin
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex items-center px-3 h-8 rounded-full text-[11px] font-semibold text-[#e4e4e7] bg-white/[0.05] border border-white/[0.09]"
          >
            Login
          </Link>
        )}
      </header>

      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="md:hidden fixed inset-y-0 left-0 z-50 w-[260px] shadow-2xl">
            <Sidebar
              settings={settings}
              tabCounts={tabCounts}
              onNavigate={() => setOpen(false)}
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-3.5 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.08] text-[#a1a1aa] hover:text-white cursor-pointer"
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
