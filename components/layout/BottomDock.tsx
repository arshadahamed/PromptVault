'use client';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/AdminThemeContext';
import { usePathname } from 'next/navigation';
import { type ModalId } from '@/hooks/useModal';
import { LottieIcon, type LottieIconName } from '@/components/ui/LottieIcon';

const DOCK_ITEMS: Array<{
  lottie: LottieIconName;
  modal?: ModalId;
  href?: string;
  label: string;
  color: string;
}> = [
  { lottie: 'sparkles', label: 'Explore',   href: '/',          color: '#a855f7' },
  { lottie: 'search',   label: 'Search',    modal: 'search',    color: '#06b6d4' },
  { lottie: 'clock',    label: 'History',   modal: 'history',   color: '#f59e0b' },
  { lottie: 'heart',    label: 'Favorites', modal: 'favorites', color: '#ec4899' },
];

export function BottomDock() {
  const { openModal, favorites, setGalleryFilter } = useApp();
  const { resolved, toggleTheme } = useTheme();
  const pathname = usePathname();
  const isDark = resolved === 'dark';

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
      <div
        className="flex items-center gap-1.5 px-3 py-2 rounded-2xl transition-colors duration-200"
        style={{
          backgroundColor: 'var(--bg-glass-strong)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-elevated)',
        }}
      >
        {DOCK_ITEMS.map(({ lottie, modal, href, label, color }) => {
          const active = href ? pathname === href : false;
          const badge = label === 'Favorites' ? favorites.length : 0;

          return (
            <button
              key={label}
              type="button"
              aria-label={label}
              title={label}
              onClick={() => {
                if (modal) openModal(modal);
                else if (href === '/') setGalleryFilter({ tab: 'All', sort: 'Featured' });
              }}
              className="relative w-10 h-10 flex flex-col items-center justify-center rounded-xl transition-all duration-200 cursor-pointer group hover:scale-105"
              style={
                active
                  ? {
                      backgroundColor: `${color}1f`,
                      border: `1px solid ${color}44`,
                      boxShadow: `0 0 16px ${color}28`,
                    }
                  : {
                      backgroundColor: 'transparent',
                    }
              }
            >
              <LottieIcon name={lottie} size={18} />
              {badge > 0 && (
                <span
                  className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                  style={{ background: '#ec4899' }}
                >
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
              {active && (
                <span
                  className="absolute bottom-1 w-1 h-1 rounded-full"
                  style={{ background: color, boxShadow: `0 0 4px ${color}` }}
                />
              )}
            </button>
          );
        })}

        {/* Vertical divider */}
        <div
          className="w-px h-6 mx-0.5"
          style={{ backgroundColor: 'var(--border-strong)' }}
          aria-hidden="true"
        />

        {/* Quick Light / Dark Theme Toggle in Dock */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="relative w-10 h-10 flex flex-col items-center justify-center rounded-xl transition-all duration-200 cursor-pointer hover:scale-105"
          style={{
            backgroundColor: 'var(--bg-muted)',
            border: '1px solid var(--border-default)',
          }}
        >
          <LottieIcon name={isDark ? 'sun' : 'moon'} size={18} />
        </button>
      </div>
    </div>
  );
}
