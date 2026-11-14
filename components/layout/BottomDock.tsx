'use client';
import { Home, Search, History, Heart } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useRouter, usePathname } from 'next/navigation';
import { type ModalId } from '@/hooks/useModal';

const DOCK_ITEMS: Array<{
  icon: React.ElementType;
  modal?: ModalId;
  href?: string;
  label: string;
  color: string;
}> = [
  { icon: Home,    label: 'Home',      href: '/',          color: '#a855f7' },
  { icon: Search,  label: 'Search',    modal: 'search',    color: '#06b6d4' },
  { icon: History, label: 'History',   modal: 'history',   color: '#f59e0b' },
  { icon: Heart,   label: 'Favorites', modal: 'favorites', color: '#ec4899' },
];

export function BottomDock() {
  const { openModal } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
      <div
        className="flex items-center gap-1 px-2.5 py-2 rounded-[22px] shadow-2xl"
        style={{
          background: 'rgba(15,15,18,0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        {DOCK_ITEMS.map(({ icon: Icon, modal, href, label, color }) => {
          const active = href ? pathname === href : false;
          return (
            <button
              key={label}
              aria-label={label}
              onClick={() => modal ? openModal(modal) : href ? router.push(href) : undefined}
              className="relative w-10 h-10 flex flex-col items-center justify-center rounded-[14px] transition-all duration-200 cursor-pointer group"
              style={active ? {
                background: `${color}18`,
                boxShadow: `0 0 14px ${color}44`,
              } : {}}
              title={label}
            >
              <Icon
                size={17}
                strokeWidth={active ? 2.2 : 1.7}
                style={{
                  color: active ? color : '#5c5c6b',
                  transition: 'color 0.2s, transform 0.2s',
                  transform: 'scale(1)',
                }}
                className="group-hover:scale-110 transition-transform"
              />
              {active && (
                <span
                  className="absolute bottom-1.5 w-1 h-1 rounded-full"
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
