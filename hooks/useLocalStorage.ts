'use client';
import { useState } from 'react';

export function useLocalStorage<T>(key: string, initial: T) {
  // Lazy initializer reads localStorage once on mount (client-only).
  // Guards against SSR with typeof window check.
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initial;
    } catch {
      return initial;
    }
  });

  const set = (newVal: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const next =
        typeof newVal === 'function' ? (newVal as (p: T) => T)(prev) : newVal;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // ignore quota / SSR errors
      }
      return next;
    });
  };

  return [value, set] as const;
}
