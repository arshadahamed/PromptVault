import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/settings';

export async function GET() {
  const s = getSettings();
  return NextResponse.json({
    logoText:          s.logoText,
    loginBrandName:    s.loginBrandName,
    loginTagline:      s.loginTagline,
    promoEnabled:      s.promoEnabled,
    promoTitle:        s.promoTitle,
    promoDescription:  s.promoDescription,
    promoEmoji1:       s.promoEmoji1,
    promoEmoji2:       s.promoEmoji2,
    promoGradientFrom: s.promoGradientFrom,
    promoGradientTo:   s.promoGradientTo,
    promoCtaText:      s.promoCtaText,
    promoCtaUrl:       s.promoCtaUrl,
  });
}
