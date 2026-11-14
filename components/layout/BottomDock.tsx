'use client';
import { Home, Search, History, Heart } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { usePathname } from 'next/navigation';
import { type ModalId } from '@/hooks/useModal';

const DOCK_ITEMS: Array<{
  icon: React.ElementType;
  modal?: ModalId;
  href?: string;
  label: string;
  color: string;
}> = [
  { icon: Home,    label: 'Explore',   href: '/',          color: '#a855f7' },
  { icon: Search,  label: 'Search',    modal: 'search',    color: '#22d3ee' },
  { icon: History, label: 'History',   modal: 'history',   color: '#f59e0b' },
  { icon: Heart,   label: 'Favorites', modal: 'favorites', color: '#ec4899' },
];

export function BottomDock() {
  const { openModal, favorites, setGalleryFilter } = useApp();
  const pathname = usePathname();

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
      <div
        className="flex items-center gap-1 px-2.5 py-2 rounded-[22px]"
        style={{
          background: 'rgba(13,13,17,0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {DOCK_ITEMS.map(({ icon: Icon, modal, href, label, color }) => {
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
              className="relative w-10 h-10 flex flex-col items-center justify-center rounded-[14px] transition-all duration-200 cursor-pointer group hover:bg-white/[0.06]"
              style={
                active
                  ? {
                      background: `${color}1f`,
                      boxShadow: `0 0 16px ${color}33`,
                    }
                  : undefined
              }
            >
              <Icon
                size={17}
                strokeWidth={active ? 2.2 : 1.75}
                style={{ color: active ? color : '#a1a1aa' }}
                className="group-hover:scale-110 group-hover:text-white transition-transform"
              />
              {badge > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
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
      </div>
    </div>
  );
}
