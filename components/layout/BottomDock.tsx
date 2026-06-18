'use client';
import { Home, Search, History, Heart } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { type ModalId } from '@/hooks/useModal';

const DOCK_ITEMS: Array<{
  icon: React.ElementType;
  modal?: ModalId;
  href?: string;
  label: string;
}> = [
  { icon: Home,    label: 'Home',      href: '/'          },
  { icon: Search,  label: 'Search',    modal: 'search'    },
  { icon: History, label: 'History',   modal: 'history'   },
  { icon: Heart,   label: 'Favorites', modal: 'favorites' },
];

export function BottomDock() {
  const { openModal } = useApp();
  const router = useRouter();

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
      <div className="glass flex items-center gap-0.5 px-2.5 py-2 rounded-[22px] shadow-xl">
        {DOCK_ITEMS.map(({ icon: Icon, modal, href, label }) => (
          <button
            key={label}
            aria-label={label}
            onClick={() => modal ? openModal(modal) : href ? router.push(href) : undefined}
            className="w-9 h-9 flex items-center justify-center rounded-[12px] text-[#6b7280] hover:text-[#1b1b1b] hover:bg-[#f7f4ed] transition-all duration-150 cursor-pointer"
          >
            <Icon size={16} strokeWidth={1.8} />
          </button>
        ))}
      </div>
    </div>
  );
}
