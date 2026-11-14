'use client';
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useModal, type ModalId } from '@/hooks/useModal';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Tab, Sort } from '@/lib/types';

interface AppCtx {
  openModal: (id: ModalId) => void;
  closeModal: () => void;
  activeModal: ModalId;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  clearFavorites: () => void;
  history: string[];
  addToHistory: (id: string) => void;
  clearHistory: () => void;
  activeTab: Tab;
  activeSort: Sort;
  setGalleryFilter: (next: { tab?: Tab; sort?: Sort }) => void;
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
}

const VALID_TABS = new Set<Tab>([
  'All', 'Vibe Coding', 'ChatGPT', 'Nanobanana', 'Midjourney', 'Flux', 'Seedance', 'Gemini', 'Adobe Firefly',
]);
const VALID_SORTS = new Set<Sort>(['Featured', 'Newest', 'Popular']);

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { open: activeModal, openModal, close: closeModal } = useModal();
  const [favorites, setFavorites] = useLocalStorage<string[]>('mg_favorites', []);
  const [history, setHistory] = useLocalStorage<string[]>('mg_history', []);
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [activeSort, setActiveSort] = useState<Sort>('Featured');
  const [isAdmin, setIsAdmin] = useState(false);

  // Sync URL filters (?tab=...&sort=...) after hydration & on navigation without blocking ISR
  useEffect(() => {
    let active = true;
    const syncFromUrl = () => {
      if (!active) return;
      const params = new URLSearchParams(window.location.search);
      const t = params.get('tab') as Tab | null;
      const s = params.get('sort') as Sort | null;
      setActiveTab(t && VALID_TABS.has(t) ? t : 'All');
      setActiveSort(s && VALID_SORTS.has(s) ? s : 'Featured');
    };
    Promise.resolve().then(syncFromUrl);
    window.addEventListener('popstate', syncFromUrl);
    return () => {
      active = false;
      window.removeEventListener('popstate', syncFromUrl);
    };
  }, [pathname]);

  // Global Cmd+K / Ctrl+K shortcut for instant search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openModal(activeModal === 'search' ? null : 'search');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeModal, openModal]);

  // Check admin session once client-side so GalleryLayout stays ISR-cacheable
  useEffect(() => {
    let active = true;
    fetch('/api/auth/session')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d && typeof d.authenticated === 'boolean') {
          setIsAdmin(d.authenticated);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const setGalleryFilter = useCallback(
    ({ tab, sort }: { tab?: Tab; sort?: Sort }) => {
      const nextTab  = tab  && VALID_TABS.has(tab)   ? tab  : activeTab;
      const nextSort = sort && VALID_SORTS.has(sort) ? sort : activeSort;
      setActiveTab(nextTab);
      setActiveSort(nextSort);

      const params = new URLSearchParams();
      if (nextTab !== 'All')       params.set('tab', nextTab);
      if (nextSort !== 'Featured') params.set('sort', nextSort);
      const qs = params.toString();
      const target = qs ? `/?${qs}` : '/';

      if (pathname !== '/') {
        router.push(target);
      } else {
        window.history.replaceState(null, '', target);
      }
    },
    [activeTab, activeSort, pathname, router]
  );

  const toggleFavorite = useCallback(
    (id: string) =>
      setFavorites((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]
      ),
    [setFavorites]
  );

  const clearFavorites = useCallback(() => setFavorites([]), [setFavorites]);

  const addToHistory = useCallback(
    (id: string) =>
      setHistory((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 50)),
    [setHistory]
  );

  const clearHistory = useCallback(() => setHistory([]), [setHistory]);

  return (
    <Ctx.Provider
      value={{
        openModal,
        closeModal,
        activeModal,
        favorites,
        toggleFavorite,
        clearFavorites,
        history,
        addToHistory,
        clearHistory,
        activeTab,
        activeSort,
        setGalleryFilter,
        isAdmin,
        setIsAdmin,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
