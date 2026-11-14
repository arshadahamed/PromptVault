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
            className="fixed inset-0 bg-black/70 backdrop-blur-[4px] z-50"
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
            className="fixed top-0 right-0 h-full w-full max-w-[400px] z-50 flex flex-col shadow-2xl"
            style={{
              background: '#0d0d11',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] shrink-0">
              <div>
                <h2
                  className="text-[15px] font-semibold text-white"
                  style={{ fontFamily: 'var(--font-poppins)' }}
                >
                  {title}
                </h2>
                {subtitle && <p className="text-[11px] text-[#71717a] mt-0.5">{subtitle}</p>}
              </div>

              <div className="flex items-center gap-2">
                {headerAction}
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Close drawer"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
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
