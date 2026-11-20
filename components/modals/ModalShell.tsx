'use client';
import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface Props {
  title: string;
  subtitle?: string;
  open: boolean;
  headerAction?: ReactNode;
  children: ReactNode;
}

export function ModalShell({ title, subtitle, open, headerAction, children }: Props) {
  const { closeModal } = useApp();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/65 backdrop-blur-[4px] z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={closeModal}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="fixed top-0 right-0 h-full w-full max-w-[410px] z-50 flex flex-col shadow-2xl transition-colors duration-200"
            style={{
              backgroundColor: 'var(--bg-sidebar)',
              borderLeft: '1px solid var(--border-strong)',
              color: 'var(--fg-primary)',
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{ borderBottom: '1px solid var(--border-default)' }}
            >
              <div>
                <h2
                  className="text-[15px] font-semibold"
                  style={{ fontFamily: 'var(--font-poppins)', color: 'var(--fg-primary)' }}
                >
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--fg-subtle)' }}>
                    {subtitle}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {headerAction}
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Close drawer"
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer theme-surface theme-surface-hover"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
