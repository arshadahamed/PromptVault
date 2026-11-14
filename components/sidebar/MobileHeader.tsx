'use client';
import { useState } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';
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
      <div
        className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center px-4 h-12"
        style={{
          background: 'rgba(12,12,14,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <button
          onClick={() => setOpen(true)}
          className="w-8 h-8 flex items-center justify-center rounded-[8px] transition-colors cursor-pointer"
          style={{ color: '#8b8b99' }}
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        {/* Logo + Name */}
        <div className="ml-3 flex items-center gap-2 flex-1">
          <div
            className="w-6 h-6 rounded-[6px] flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
          >
            <Sparkles size={12} className="text-white" />
          </div>
          <span className="text-[13px] font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {siteName || 'PromptVault'}
          </span>
        </div>

        {isLoggedIn ? (
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 h-7 rounded-full text-[11px] font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', color: '#ffffff' }}
          >
            Admin
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3 h-7 rounded-full text-[11px] font-semibold transition-all border"
            style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#f0f0f2', background: 'rgba(255,255,255,0.05)' }}
          >
            Login
          </Link>
        )}
      </div>

      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setOpen(false)}
          />
          <div className="md:hidden fixed inset-y-0 left-0 z-50 w-[260px] shadow-2xl">
            <Sidebar settings={settings} isLoggedIn={isLoggedIn} onNavigate={() => setOpen(false)} />
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3.5 right-3 w-7 h-7 flex items-center justify-center rounded-full transition-colors cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#8b8b99' }}
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
