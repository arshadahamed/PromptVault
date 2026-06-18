'use client';
import { Home, Search, History, Heart, type LucideIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { type ModalId } from '@/hooks/useModal';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  modal?: ModalId;
  badge?: string;
}

const items: NavItem[] = [
  { id: 'home',      label: 'Home',      icon: Home,    href: '/' },
  { id: 'search',   label: 'Search',    icon: Search,  modal: 'search'    },
  { id: 'history',  label: 'History',   icon: History, modal: 'history'   },
{ id: 'favorites',label: 'Favorites', icon: Heart,   modal: 'favorites' },
];

export function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const { openModal } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <ul className="flex flex-col gap-0.5 px-2">
      {items.map(({ id, label, icon: Icon, badge, href, modal }) => {
        const active = href ? pathname === href : false;
        return (
          <li key={id}>
            <button
              onClick={() => {
                if (modal) openModal(modal);
                else if (href) router.push(href);
                onNavigate?.();
              }}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2 rounded-[10px] text-sm font-medium transition-colors cursor-pointer',
                active
                  ? 'bg-[#ebe8e1] text-[#1b1b1b]'
                  : 'text-[#1b1b1b] hover:bg-[#f7f4ed]'
              )}
            >
              <Icon size={16} strokeWidth={1.8} />
              <span>{label}</span>
              {badge && (
                <span className="ml-auto text-[10px] font-semibold bg-[#1b1b1b] text-white px-1.5 py-0.5 rounded-full">
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
