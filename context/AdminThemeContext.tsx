'use client';
import { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

interface Ctx {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (m: ThemeMode) => void;
}

const AdminThemeCtx = createContext<Ctx>({ mode: 'dark', resolved: 'dark', setMode: () => {} });

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  // Read from localStorage synchronously on first render to avoid flash
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'dark';
    return (localStorage.getItem('admin-theme') as ThemeMode) || 'dark';
  });
  const [resolved, setResolved] = useState<ResolvedTheme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = (localStorage.getItem('admin-theme') as ThemeMode) || 'dark';
    if (stored === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    return stored === 'light' ? 'light' : 'dark';
  });

  // No separate useEffect for initial load — handled in useState initializer above

  useEffect(() => {
    let actual: ResolvedTheme;
    if (mode === 'system') {
      actual = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => setResolved(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else {
      actual = mode;
    }
    setResolved(actual);
  }, [mode]);

  function setMode(m: ThemeMode) {
    setModeState(m);
    localStorage.setItem('admin-theme', m);
  }

  return (
    <AdminThemeCtx.Provider value={{ mode, resolved, setMode }}>
      {children}
    </AdminThemeCtx.Provider>
  );
}

export const useAdminTheme = () => useContext(AdminThemeCtx);

// Theme token helpers
export const tk = (resolved: ResolvedTheme) => resolved === 'dark' ? DARK : LIGHT;

const DARK = {
  bg:          '#0d0f1c',
  sidebar:     'rgba(10,11,22,0.97)',
  sidebarBorder: 'rgba(124,58,237,0.12)',
  card:        'rgba(255,255,255,0.03)',
  cardBorder:  'rgba(255,255,255,0.07)',
  cardHover:   'rgba(255,255,255,0.06)',
  input:       'rgba(255,255,255,0.05)',
  inputBorder: 'rgba(124,58,237,0.2)',
  inputFocus:  'rgba(124,58,237,0.55)',
  text:        '#f1f5f9',
  textMuted:   'rgba(255,255,255,0.4)',
  textSub:     'rgba(255,255,255,0.25)',
  divider:     'rgba(255,255,255,0.06)',
  accent:      '#7c3aed',
  accentMuted: 'rgba(124,58,237,0.15)',
  accentBorder:'rgba(124,58,237,0.25)',
  accentText:  '#c4b5fd',
  danger:      'rgba(239,68,68,0.1)',
  dangerBorder:'rgba(239,68,68,0.2)',
  dangerText:  '#fca5a5',
  success:     'rgba(16,185,129,0.1)',
  successText: '#6ee7b7',
  badge:       'rgba(255,255,255,0.06)',
  badgeText:   'rgba(255,255,255,0.5)',
};

const LIGHT = {
  bg:          '#f4f6fb',
  sidebar:     '#ffffff',
  sidebarBorder: '#e5e7eb',
  card:        '#ffffff',
  cardBorder:  '#e5e7eb',
  cardHover:   '#f9fafb',
  input:       '#f8fafc',
  inputBorder: '#d1d5db',
  inputFocus:  '#7c3aed',
  text:        '#111827',
  textMuted:   '#6b7280',
  textSub:     '#9ca3af',
  divider:     '#e5e7eb',
  accent:      '#7c3aed',
  accentMuted: 'rgba(124,58,237,0.08)',
  accentBorder:'rgba(124,58,237,0.2)',
  accentText:  '#6d28d9',
  danger:      '#fef2f2',
  dangerBorder:'#fecaca',
  dangerText:  '#dc2626',
  success:     '#f0fdf4',
  successText: '#16a34a',
  badge:       '#f3f4f6',
  badgeText:   '#6b7280',
};
