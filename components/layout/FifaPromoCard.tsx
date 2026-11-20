'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SiteSettings } from '@/lib/settings';
import { isSafeHref, safeHref } from '@/lib/security';
import { LottieIcon } from '@/components/ui/LottieIcon';

export function FifaPromoCard({ settings }: { settings: SiteSettings }) {
  const [dismissed, setDismissed] = useState(false);

  if (!settings.promoEnabled) return null;

  const gradient = `linear-gradient(135deg, ${settings.promoGradientFrom || '#064e3b'}, ${settings.promoGradientTo || '#d97706'})`;
  const ctaUrl = safeHref(settings.promoCtaUrl, '#');
  const hasExternalLink = ctaUrl !== '#' && isSafeHref(ctaUrl);

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          className="fixed bottom-5 right-5 z-30 w-[264px] rounded-2xl overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-strong)',
            boxShadow: 'var(--shadow-elevated)',
            color: 'var(--fg-primary)',
          }}
          initial={{ opacity: 0, y: 24, scale: 0.93 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.93 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="p-3.5 relative">
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center rounded-full bg-black/40 text-white/85 hover:text-white hover:bg-black/60 transition-colors cursor-pointer z-10"
              aria-label="Dismiss"
            >
              <X size={12} />
            </button>

            <div
              className="w-full h-[88px] rounded-xl mb-3 overflow-hidden relative"
              style={{ background: gradient }}
            >
              <div className="absolute inset-0 flex items-center justify-center gap-3">
                <span className="text-4xl drop-shadow-lg">{settings.promoEmoji1}</span>
                <span className="text-4xl drop-shadow-lg">{settings.promoEmoji2}</span>
              </div>
              <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/45 backdrop-blur-md text-[10px] font-semibold text-white">
                <LottieIcon name="rocket" size={12} primaryColor="#ffffff" secondaryColor="#fde047" />
                <span>Featured Pack</span>
              </div>
            </div>

            <h3 className="text-[13px] font-semibold leading-tight mb-1" style={{ color: 'var(--fg-primary)' }}>
              {settings.promoTitle}
            </h3>
            <p className="text-[11.5px] leading-snug mb-3" style={{ color: 'var(--fg-muted)' }}>
              {settings.promoDescription}
            </p>

            {hasExternalLink ? (
              <a
                href={ctaUrl}
                target={ctaUrl.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="block w-full text-white text-[12px] font-semibold py-2 rounded-xl hover:opacity-95 transition-opacity text-center"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                }}
              >
                {settings.promoCtaText}
              </a>
            ) : (
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="w-full text-white text-[12px] font-semibold py-2 rounded-xl hover:opacity-95 transition-opacity cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                }}
              >
                {settings.promoCtaText}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
