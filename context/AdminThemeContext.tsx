'use client';
import { createContext, useCallback, useContext, useSyncExternalStore } from 'react';

export type ThemeMode = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (m: ThemeMode) => void;
}

const STORAGE_KEY = 'admin-theme';
const THEME_EVENT = 'admin-theme-change';

function subscribeMode(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === STORAGE_KEY) callback();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(THEME_EVENT, callback);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(THEME_EVENT, callback);
  };
}

function getModeSnapshot(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'dark';
}

function getModeServerSnapshot(): ThemeMode {
  return 'dark';
}

function subscribeSystemDark(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

function getSystemDarkSnapshot(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getSystemDarkServerSnapshot(): boolean {
  return true;
}

const AdminThemeCtx = createContext<ThemeContextValue>({
  mode: 'dark',
  resolved: 'dark',
  setMode: () => {},
});

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useSyncExternalStore(subscribeMode, getModeSnapshot, getModeServerSnapshot);
  const systemDark = useSyncExternalStore(
    subscribeSystemDark,
    getSystemDarkSnapshot,
    getSystemDarkServerSnapshot
  );

  const resolved: ResolvedTheme = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

  const setMode = useCallback((next: ThemeMode) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  return (
    <AdminThemeCtx.Provider value={{ mode, resolved, setMode }}>
      <div className="admin-root" data-theme={resolved}>
        {children}
      </div>
    </AdminThemeCtx.Provider>
  );
}

export const useAdminTheme = () => useContext(AdminThemeCtx);

export interface ThemeTokens {
  bg: string;
  sidebar: string;
  sidebarBorder: string;
  card: string;
  cardBorder: string;
  cardHover: string;
  input: string;
  inputBorder: string;
  inputFocus: string;
  text: string;
  textMuted: string;
  textSub: string;
  divider: string;
  accent: string;
  accentMuted: string;
  accentBorder: string;
  accentText: string;
  danger: string;
  dangerBorder: string;
  dangerText: string;
  success: string;
  successText: string;
  badge: string;
  badgeText: string;
}

export const tk = (resolved: ResolvedTheme): ThemeTokens => (resolved === 'dark' ? DARK : LIGHT);

const DARK: ThemeTokens = {
  bg: '#09090b',
  sidebar: '#0d0d11',
  sidebarBorder: 'rgba(255,255,255,0.08)',
  card: '#111116',
  cardBorder: 'rgba(255,255,255,0.08)',
  cardHover: 'rgba(255,255,255,0.06)',
  input: '#14141a',
  inputBorder: 'rgba(255,255,255,0.12)',
  inputFocus: '#7c3aed',
  text: '#f4f4f5',
  textMuted: '#a1a1aa',
  textSub: '#71717a',
  divider: 'rgba(255,255,255,0.07)',
  accent: '#7c3aed',
  accentMuted: 'rgba(124,58,237,0.14)',
  accentBorder: 'rgba(124,58,237,0.35)',
  accentText: '#c4b5fd',
  danger: 'rgba(239,68,68,0.12)',
  dangerBorder: 'rgba(239,68,68,0.3)',
  dangerText: '#fca5a5',
  success: 'rgba(16,185,129,0.12)',
  successText: '#6ee7b7',
  badge: 'rgba(255,255,255,0.06)',
  badgeText: '#d4d4d8',
};

const LIGHT: ThemeTokens = {
  bg: '#f8fafc',
  sidebar: '#ffffff',
  sidebarBorder: '#e2e8f0',
  card: '#ffffff',
  cardBorder: '#e2e8f0',
  cardHover: '#f1f5f9',
  input: '#ffffff',
  inputBorder: '#cbd5e1',
  inputFocus: '#6d28d9',
  text: '#0f172a',
  textMuted: '#475569',
  textSub: '#64748b',
  divider: '#e2e8f0',
  accent: '#6d28d9',
  accentMuted: 'rgba(109,40,217,0.08)',
  accentBorder: 'rgba(109,40,217,0.24)',
  accentText: '#5b21b6',
  danger: '#fef2f2',
  dangerBorder: '#fecaca',
  dangerText: '#b91c1c',
  success: '#ecfdf5',
  successText: '#047857',
  badge: '#f1f5f9',
  badgeText: '#475569',
};
