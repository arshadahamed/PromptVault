'use client';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from './Sidebar';
import type { SiteSettings } from '@/lib/settings';

interface Props {
  siteName: string;
  settings: SiteSettings;
  isLoggedIn: boolean;
}

export function MobileHeader({ siteName, settings, isLoggedIn }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-b border-[#e5e7eb] flex items-center px-4 h-12">
        <button
          onClick={() => setOpen(true)}
          className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-[#f7f4ed] transition-colors text-[#1b1b1b] cursor-pointer"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <span
          className="ml-3 text-sm font-semibold text-[#1b1b1b] flex-1"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          {siteName || 'PromptVault'}
        </span>
        {isLoggedIn ? (
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 h-7 rounded-full text-[11px] font-semibold transition-colors"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              color: '#ffffff',
            }}
          >
            Admin
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3 h-7 rounded-full text-[11px] font-semibold transition-colors"
            style={{
              background: 'linear-gradient(135deg, #1b1b1b, #3d3d3d)',
              color: '#ffffff',
            }}
          >
            Login
          </Link>
        )}
      </div>

      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={() => setOpen(false)}
          />
          <div className="md:hidden fixed inset-y-0 left-0 z-50 w-[260px] shadow-2xl">
            <Sidebar settings={settings} isLoggedIn={isLoggedIn} onNavigate={() => setOpen(false)} />
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-[#f7f4ed] text-[#6b7280] hover:text-[#1b1b1b] transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X size={14} />
            </button>
          </div>
        </>
      )}
    </>
  );
}
