'use client';
import { Home, Search, History, Heart, type LucideIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { type ModalId } from '@/hooks/useModal';
import { usePathname } from 'next/navigation';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  modal?: ModalId;
  shortcut?: string;
  color: string;
}

const items: NavItem[] = [
  { id: 'home',      label: 'Explore',   icon: Home,    href: '/',          color: '#a855f7' },
  { id: 'search',    label: 'Search',    icon: Search,  modal: 'search',    shortcut: '⌘K', color: '#22d3ee' },
  { id: 'history',   label: 'History',   icon: History, modal: 'history',   color: '#f59e0b' },
  { id: 'favorites', label: 'Favorites', icon: Heart,   modal: 'favorites', color: '#ec4899' },
];

export function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const { openModal, favorites, history, setGalleryFilter } = useApp();
  const pathname = usePathname();

  return (
    <nav aria-label="Primary navigation">
      <ul className="flex flex-col gap-1 px-2.5">
        {items.map(({ id, label, icon: Icon, shortcut, href, modal, color }) => {
          const active = href ? pathname === href : false;
          const count =
            id === 'favorites' ? favorites.length : id === 'history' ? history.length : 0;

          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => {
                  if (modal) openModal(modal);
                  else if (href === '/') setGalleryFilter({ tab: 'All', sort: 'Featured' });
                  onNavigate?.();
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[11px] text-[13px] font-medium transition-all duration-150 cursor-pointer group"
                style={
                  active
                    ? {
                        background:
                          'linear-gradient(135deg, rgba(124,58,237,0.16), rgba(6,182,212,0.06))',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                        border: '1px solid rgba(139,92,246,0.22)',
                        color: '#ffffff',
                      }
                    : {
                        color: '#a1a1aa',
                        border: '1px solid transparent',
                      }
                }
              >
                <Icon
                  size={16}
                  strokeWidth={active ? 2.1 : 1.75}
                  style={{ color: active ? color : undefined }}
                  className={!active ? 'group-hover:text-white transition-colors' : ''}
                />
                <span className={active ? 'font-semibold text-white' : 'group-hover:text-white transition-colors'}>
                  {label}
                </span>

                {shortcut && (
                  <kbd className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded-[6px] bg-white/[0.06] text-[#a1a1aa] border border-white/[0.08]">
                    {shortcut}
                  </kbd>
                )}

                {count > 0 && (
                  <span
                    className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums"
                    style={{ background: `${color}22`, color }}
                  >
                    {count}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
