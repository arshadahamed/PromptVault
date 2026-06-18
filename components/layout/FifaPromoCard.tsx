'use client';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PromoSettings {
  promoEnabled: boolean;
  promoTitle: string;
  promoDescription: string;
  promoEmoji1: string;
  promoEmoji2: string;
  promoGradientFrom: string;
  promoGradientTo: string;
  promoCtaText: string;
  promoCtaUrl: string;
}

const DEFAULTS: PromoSettings = {
  promoEnabled: true,
  promoTitle: 'FIFA World Cup 2026 ⚽',
  promoDescription: 'Ronaldo, Messi & epic football art — explore the World Cup collection',
  promoEmoji1: '⚽',
  promoEmoji2: '🏆',
  promoGradientFrom: '#064e3b',
  promoGradientTo: '#d97706',
  promoCtaText: 'Explore now',
  promoCtaUrl: '#',
};

export function FifaPromoCard() {
  const [dismissed, setDismissed] = useState(false);
  const [promo, setPromo] = useState<PromoSettings>(DEFAULTS);

  useEffect(() => {
    fetch('/api/promo')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setPromo(d); })
      .catch(() => {});
  }, []);

  if (!promo.promoEnabled) return null;

  const gradient = `linear-gradient(135deg, ${promo.promoGradientFrom}, ${promo.promoGradientTo})`;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          className="fixed bottom-5 right-5 z-40 w-[260px] rounded-[16px] overflow-hidden shadow-2xl"
          initial={{ opacity: 0, y: 24, scale: 0.93 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.93 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="bg-[#0f0f11] text-white p-3.5 relative">
            <button
              onClick={() => setDismissed(true)}
              className="absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Dismiss"
            >
              <X size={12} />
            </button>

            {/* Image strip */}
            <div
              className="w-full h-[88px] rounded-[10px] mb-3 overflow-hidden relative"
              style={{ background: gradient }}
            >
              <div className="absolute inset-0 flex items-center justify-center gap-3">
                <span className="text-4xl drop-shadow-lg">{promo.promoEmoji1}</span>
                <span className="text-4xl drop-shadow-lg">{promo.promoEmoji2}</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f11]/40 to-transparent" />
            </div>

            <h3 className="text-[13px] font-semibold leading-tight mb-1">{promo.promoTitle}</h3>
            <p className="text-[11px] text-white/55 leading-snug mb-3">{promo.promoDescription}</p>

            {promo.promoCtaUrl && promo.promoCtaUrl !== '#' ? (
              <a
                href={promo.promoCtaUrl}
                target={promo.promoCtaUrl.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="block w-full bg-white text-[#0f0f11] text-[12px] font-semibold py-2 rounded-[8px] hover:bg-[#f7f4ed] transition-colors text-center"
              >
                {promo.promoCtaText}
              </a>
            ) : (
              <button
                onClick={() => setDismissed(true)}
                className="w-full bg-white text-[#0f0f11] text-[12px] font-semibold py-2 rounded-[8px] hover:bg-[#f7f4ed] transition-colors cursor-pointer"
              >
                {promo.promoCtaText}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
