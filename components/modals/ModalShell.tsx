'use client';
import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface Props {
  title: string;
  open: boolean;
  children: ReactNode;
}

export function ModalShell({ title, open, children }: Props) {
  const { closeModal } = useApp();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/25 backdrop-blur-[3px] z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeModal}
          />

          {/* Drawer panel */}
          <motion.div
            className="fixed top-0 right-0 h-full w-full max-w-[360px] bg-white shadow-2xl z-50 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb] shrink-0">
              <h2 className="text-[14px] font-semibold text-[#1b1b1b]">{title}</h2>
              <button
                onClick={closeModal}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#f7f4ed] text-[#9ca3af] hover:text-[#1b1b1b] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
