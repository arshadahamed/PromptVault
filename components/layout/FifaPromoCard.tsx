'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SiteSettings } from '@/lib/settings';
import { isSafeHref, safeHref } from '@/lib/security';

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
          className="fixed bottom-5 right-5 z-30 w-[260px] rounded-[16px] overflow-hidden shadow-2xl border border-white/10"
          initial={{ opacity: 0, y: 24, scale: 0.93 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.93 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="bg-[#111115] text-white p-3.5 relative">
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors cursor-pointer z-10"
              aria-label="Dismiss"
            >
              <X size={12} />
            </button>

            <div
              className="w-full h-[88px] rounded-[10px] mb-3 overflow-hidden relative"
              style={{ background: gradient }}
            >
              <div className="absolute inset-0 flex items-center justify-center gap-3">
                <span className="text-4xl drop-shadow-lg">{settings.promoEmoji1}</span>
                <span className="text-4xl drop-shadow-lg">{settings.promoEmoji2}</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#111115]/50 to-transparent" />
            </div>

            <h3 className="text-[13px] font-semibold leading-tight mb-1">{settings.promoTitle}</h3>
            <p className="text-[11px] text-zinc-400 leading-snug mb-3">{settings.promoDescription}</p>

            {hasExternalLink ? (
              <a
                href={ctaUrl}
                target={ctaUrl.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="block w-full bg-white text-[#09090b] text-[12px] font-semibold py-2 rounded-[9px] hover:bg-zinc-200 transition-colors text-center"
              >
                {settings.promoCtaText}
              </a>
            ) : (
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="w-full bg-white text-[#09090b] text-[12px] font-semibold py-2 rounded-[9px] hover:bg-zinc-200 transition-colors cursor-pointer"
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
