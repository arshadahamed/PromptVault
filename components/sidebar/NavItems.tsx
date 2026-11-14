'use client';
import { Home, Search, History, Heart, type LucideIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { type ModalId } from '@/hooks/useModal';
import { usePathname, useRouter } from 'next/navigation';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  modal?: ModalId;
  badge?: string;
  color?: string;
}

const items: NavItem[] = [
  { id: 'home',      label: 'Home',      icon: Home,    href: '/',         color: '#a855f7' },
  { id: 'search',   label: 'Search',    icon: Search,  modal: 'search',   color: '#06b6d4' },
  { id: 'history',  label: 'History',   icon: History, modal: 'history',  color: '#f59e0b' },
  { id: 'favorites',label: 'Favorites', icon: Heart,   modal: 'favorites',color: '#ec4899' },
];

export function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const { openModal } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <ul className="flex flex-col gap-0.5 px-2">
      {items.map(({ id, label, icon: Icon, badge, href, modal, color }) => {
        const active = href ? pathname === href : false;
        return (
          <li key={id}>
            <button
              onClick={() => {
                if (modal) openModal(modal);
                else if (href) router.push(href);
                onNavigate?.();
              }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[10px] text-sm font-medium transition-all duration-200 cursor-pointer group"
              style={active ? {
                background: `linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.08))`,
                borderLeft: `2px solid ${color}`,
                color: '#f0f0f2',
                paddingLeft: '10px',
              } : {
                color: '#8b8b99',
                borderLeft: '2px solid transparent',
              }}
            >
              <Icon
                size={16}
                strokeWidth={active ? 2 : 1.8}
                style={{ color: active ? color : undefined, transition: 'color 0.2s' }}
                className={!active ? 'group-hover:text-white transition-colors' : ''}
              />
              <span className={active ? 'text-white font-semibold' : 'group-hover:text-white transition-colors'}>
                {label}
              </span>
              {badge && (
                <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: color, color: '#fff' }}>
                  {badge}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
