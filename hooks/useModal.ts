'use client';
import { useState, useEffect, useCallback } from 'react';

export type ModalId = 'search' | 'history' | 'favorites' | 'skills' | null;

export function useModal() {
  const [open, setOpen] = useState<ModalId>(null);

  const close = useCallback(() => setOpen(null), []);
  const openModal = useCallback((id: ModalId) => setOpen(id), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [close]);

  return { open, openModal, close };
}
