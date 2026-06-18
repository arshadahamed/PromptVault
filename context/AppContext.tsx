'use client';
import { createContext, useContext, ReactNode } from 'react';
import { useModal, type ModalId } from '@/hooks/useModal';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface AppCtx {
  openModal: (id: ModalId) => void;
  closeModal: () => void;
  activeModal: ModalId;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  history: string[];
  addToHistory: (id: string) => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { open: activeModal, openModal, close: closeModal } = useModal();
  const [favorites, setFavorites] = useLocalStorage<string[]>('mg_favorites', []);
  const [history, setHistory] = useLocalStorage<string[]>('mg_history', []);

  const toggleFavorite = (id: string) =>
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]
    );

  const addToHistory = (id: string) =>
    setHistory((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 50));

  return (
    <Ctx.Provider value={{ openModal, closeModal, activeModal, favorites, toggleFavorite, history, addToHistory }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
