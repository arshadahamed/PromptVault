'use client';
import { useApp } from '@/context/AppContext';
import { type ModalId } from '@/hooks/useModal';
import { usePathname } from 'next/navigation';
import { LottieIcon, type LottieIconName } from '@/components/ui/LottieIcon';

interface NavItem {
  id: string;
  label: string;
  lottie: LottieIconName;
  href?: string;
  modal?: ModalId;
  shortcut?: string;
  color: string;
}

const items: NavItem[] = [
  { id: 'home',      label: 'Explore Studio', lottie: 'sparkles', href: '/',          color: '#a855f7' },
  { id: 'search',    label: 'Quick Search',   lottie: 'search',   modal: 'search',    shortcut: '⌘K', color: '#06b6d4' },
  { id: 'history',   label: 'History',        lottie: 'clock',    modal: 'history',   color: '#f59e0b' },
  { id: 'favorites', label: 'Saved Vault',    lottie: 'heart',    modal: 'favorites', color: '#ec4899' },
];

export function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const { openModal, favorites, history, setGalleryFilter } = useApp();
  const pathname = usePathname();

  return (
    <nav aria-label="Primary navigation">
      <p
        className="px-5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: 'var(--fg-subtle)' }}
      >
        Workspace
      </p>
      <ul className="flex flex-col gap-1 px-2.5">
        {items.map(({ id, label, lottie, shortcut, href, modal, color }) => {
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
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer group"
                style={
                  active
                    ? {
                        background:
                          'linear-gradient(135deg, rgba(124,58,237,0.16), rgba(6,182,212,0.08))',
                        border: '1px solid var(--accent-border)',
                        color: 'var(--fg-primary)',
                        boxShadow: 'var(--adm-shadow-sm)',
                      }
                    : {
                        color: 'var(--fg-muted)',
                        border: '1px solid transparent',
                      }
                }
              >
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                  style={{
                    backgroundColor: active ? `${color}22` : 'var(--bg-muted)',
                    border: `1px solid ${active ? `${color}44` : 'var(--border-default)'}`,
                  }}
                >
                  <LottieIcon name={lottie} size={15} />
                </span>
                <span
                  className={active ? 'font-semibold' : 'group-hover:opacity-100 transition-opacity'}
                  style={{ color: active ? 'var(--fg-primary)' : undefined }}
                >
                  {label}
                </span>

                {shortcut && (
                  <kbd
                    className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded-md"
                    style={{
                      backgroundColor: 'var(--bg-muted)',
                      color: 'var(--fg-muted)',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    {shortcut}
                  </kbd>
                )}

                {count > 0 && (
                  <span
                    className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums"
                    style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
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
