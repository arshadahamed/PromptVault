'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, LayoutDashboard, Images, Plus, Tag, ArrowLeftRight, Settings,
  ExternalLink, Sun, Moon, Monitor, Loader2, ArrowRight,
} from 'lucide-react';
import { useAdminTheme, type ThemeMode } from '@/context/AdminThemeContext';
import type { DbPrompt } from '@/lib/db';

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  group: 'Navigation' | 'Quick Actions' | 'Appearance' | 'Prompts';
  icon: React.ComponentType<{ size?: number }>;
  onSelect: () => void;
}

export function AdminCommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { setMode } = useAdminTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DbPrompt[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleClose = useCallback(() => {
    setQuery('');
    setResults([]);
    setSearching(false);
    setActiveIndex(0);
    onClose();
  }, [onClose]);

  function handleQueryChange(nextVal: string) {
    setQuery(nextVal);
    setActiveIndex(0);
    if (nextVal.trim().length < 2) {
      setResults([]);
      setSearching(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    const controller = new AbortController();

    const timer = setTimeout(() => {
      setSearching(true);
      fetch(`/api/admin/prompts?q=${encodeURIComponent(trimmed)}&limit=6`, {
        signal: controller.signal,
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.items)) {
            setResults(data.items);
          } else {
            setResults([]);
          }
        })
        .catch((err) => {
          if (err?.name !== 'AbortError') setResults([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

  const staticItems: CommandItem[] = useMemo(() => {
    const go = (href: string) => () => {
      handleClose();
      router.push(href);
    };
    const theme = (m: ThemeMode) => () => {
      setMode(m);
      handleClose();
    };

    return [
      { id: 'nav-dashboard', label: 'Dashboard', hint: 'Overview & analytics', group: 'Navigation', icon: LayoutDashboard, onSelect: go('/admin') },
      { id: 'nav-prompts', label: 'Manage Prompts', hint: 'Search, filter & bulk edit', group: 'Navigation', icon: Images, onSelect: go('/admin/prompts') },
      { id: 'nav-categories', label: 'Categories', hint: 'Manage prompt categories', group: 'Navigation', icon: Tag, onSelect: go('/admin/categories') },
      { id: 'nav-import-export', label: 'Import & Export', hint: 'JSON backup & CSV export', group: 'Navigation', icon: ArrowLeftRight, onSelect: go('/admin/import-export') },
      { id: 'nav-settings', label: 'Site Settings', hint: 'Branding, SEO, promo & security', group: 'Navigation', icon: Settings, onSelect: go('/admin/settings') },
      { id: 'act-new', label: 'Create New Prompt', hint: 'Add prompt & upload media', group: 'Quick Actions', icon: Plus, onSelect: go('/admin/prompts/new') },
      {
        id: 'act-gallery',
        label: 'Open Public Gallery',
        hint: 'Opens in a new tab',
        group: 'Quick Actions',
        icon: ExternalLink,
        onSelect: () => {
          handleClose();
          window.open('/', '_blank', 'noopener,noreferrer');
        },
      },
      { id: 'theme-light', label: 'Theme: Light Mode', group: 'Appearance', icon: Sun, onSelect: theme('light') },
      { id: 'theme-dark', label: 'Theme: Dark Mode', group: 'Appearance', icon: Moon, onSelect: theme('dark') },
      { id: 'theme-system', label: 'Theme: System Preference', group: 'Appearance', icon: Monitor, onSelect: theme('system') },
    ];
  }, [handleClose, router, setMode]);

  const filteredStatic = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staticItems;
    return staticItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.hint && item.hint.toLowerCase().includes(q)) ||
        item.group.toLowerCase().includes(q)
    );
  }, [query, staticItems]);

  const promptItems: CommandItem[] = useMemo(
    () =>
      results.map((p) => ({
        id: `prompt-${p.id}`,
        label: p.promptText.slice(0, 72) + (p.promptText.length > 72 ? '…' : ''),
        hint: `${p.model} · ${p.published === false ? 'Draft' : 'Published'}`,
        group: 'Prompts',
        icon: Images,
        onSelect: () => {
          handleClose();
          router.push(`/admin/prompts/${p.id}/edit`);
        },
      })),
    [results, handleClose, router]
  );

  const allItems = useMemo(() => [...promptItems, ...filteredStatic], [promptItems, filteredStatic]);
  const safeActiveIndex = allItems.length > 0 ? Math.min(activeIndex, allItems.length - 1) : 0;

  if (!open) return null;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (allItems.length ? (i + 1) % allItems.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (allItems.length ? (i - 1 + allItems.length) % allItems.length : 0));
    } else if (e.key === 'Enter' && allItems[safeActiveIndex]) {
      e.preventDefault();
      allItems[safeActiveIndex].onSelect();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center pt-[12vh] px-4"
      onKeyDown={handleKeyDown}
    >
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-[3px]"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Admin command palette"
        className="relative z-10 w-full max-w-xl rounded-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: 'var(--adm-surface-elevated)',
          border: '1px solid var(--adm-border-strong)',
          boxShadow: 'var(--adm-shadow-lg)',
          color: 'var(--adm-text)',
        }}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4 h-13"
          style={{ borderBottom: '1px solid var(--adm-border)' }}
        >
          <Search size={16} style={{ color: 'var(--adm-text-muted)' }} className="shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Jump to page, action, or search prompts…"
            aria-label="Search admin pages and prompts"
            className="flex-1 bg-transparent text-[13.5px] outline-none"
            style={{ color: 'var(--adm-text)' }}
          />
          {searching && (
            <Loader2 size={15} className="animate-spin shrink-0" style={{ color: 'var(--adm-accent-text)' }} />
          )}
          <kbd
            className="text-[10.5px] font-mono px-1.5 py-0.5 rounded-md"
            style={{
              backgroundColor: 'var(--adm-surface-muted)',
              border: '1px solid var(--adm-border)',
              color: 'var(--adm-text-muted)',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[55vh] overflow-y-auto p-2">
          {allItems.length === 0 ? (
            <div className="py-10 text-center text-[13px]" style={{ color: 'var(--adm-text-muted)' }}>
              No matching commands or prompts found.
            </div>
          ) : (
            <ul role="listbox" className="flex flex-col gap-0.5">
              {allItems.map((item, idx) => {
                const Icon = item.icon;
                const active = idx === safeActiveIndex;
                const prevGroup = idx > 0 ? allItems[idx - 1].group : null;
                return (
                  <li key={item.id}>
                    {item.group !== prevGroup && (
                      <p
                        className="px-3 pt-2.5 pb-1 text-[10.5px] font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--adm-text-subtle)' }}
                      >
                        {item.group}
                      </p>
                    )}
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={item.onSelect}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer"
                      style={{
                        backgroundColor: active ? 'var(--adm-accent-soft)' : 'transparent',
                        color: active ? 'var(--adm-text)' : 'var(--adm-text-secondary)',
                      }}
                    >
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: active ? 'var(--adm-accent)' : 'var(--adm-surface-muted)',
                          color: active ? '#ffffff' : 'var(--adm-text-muted)',
                        }}
                      >
                        <Icon size={14} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium truncate">{item.label}</span>
                        {item.hint && (
                          <span className="block text-[11px] truncate" style={{ color: 'var(--adm-text-subtle)' }}>
                            {item.hint}
                          </span>
                        )}
                      </span>
                      {active && (
                        <ArrowRight size={13} className="shrink-0" style={{ color: 'var(--adm-accent-text)' }} />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer hints */}
        <div
          className="px-4 py-2 flex items-center justify-between text-[11px]"
          style={{
            borderTop: '1px solid var(--adm-border)',
            backgroundColor: 'var(--adm-surface-muted)',
            color: 'var(--adm-text-subtle)',
          }}
        >
          <span>Use ↑↓ to navigate · Enter to select</span>
          {query.trim().length >= 2 && (
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push(`/admin/prompts?q=${encodeURIComponent(query.trim())}`);
              }}
              className="font-medium hover:underline cursor-pointer"
              style={{ color: 'var(--adm-accent-text)' }}
            >
              View all prompt results →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
