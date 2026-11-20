'use client';
import { useCallback, useRef, useSyncExternalStore } from 'react';

const LOCAL_STORAGE_EVENT = 'mg-local-storage-change';

/**
 * Hydration-safe localStorage hook powered by React 19 `useSyncExternalStore`.
 * Uses `getServerSnapshot` during SSR and initial hydration pass (zero hydration mismatch),
 * and caches parsed JSON objects by raw string value for referential stability.
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const cacheRef = useRef<{ raw: string | null; parsed: T }>({
    raw: null,
    parsed: initial,
  });

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === 'undefined') return () => {};
      const onStorage = (e: StorageEvent) => {
        if (e.key === null || e.key === key) onStoreChange();
      };
      window.addEventListener('storage', onStorage);
      window.addEventListener(LOCAL_STORAGE_EVENT, onStoreChange);
      return () => {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener(LOCAL_STORAGE_EVENT, onStoreChange);
      };
    },
    [key]
  );

  const getSnapshot = useCallback((): T => {
    if (typeof window === 'undefined') return initial;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return initial;
      if (cacheRef.current.raw === raw) {
        return cacheRef.current.parsed;
      }
      const parsed = JSON.parse(raw) as T;
      cacheRef.current = { raw, parsed };
      return parsed;
    } catch {
      return initial;
    }
  }, [key, initial]);

  const getServerSnapshot = useCallback((): T => initial, [initial]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const set = useCallback(
    (newVal: T | ((prev: T) => T)) => {
      if (typeof window === 'undefined') return;
      try {
        const current = getSnapshot();
        const next =
          typeof newVal === 'function' ? (newVal as (p: T) => T)(current) : newVal;
        const serialized = JSON.stringify(next);
        cacheRef.current = { raw: serialized, parsed: next };
        window.localStorage.setItem(key, serialized);
        window.dispatchEvent(new Event(LOCAL_STORAGE_EVENT));
      } catch {
        // ignore quota / storage errors
      }
    },
    [key, getSnapshot]
  );

  return [value, set] as const;
}
