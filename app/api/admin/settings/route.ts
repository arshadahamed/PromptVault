import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { getSettings, saveSettings, type SiteSettings } from '@/lib/settings';
import { isSafeHref, pickAllowedFields } from '@/lib/security';

const ALLOWED_SETTINGS_KEYS: readonly (keyof SiteSettings)[] = [
  'siteName', 'siteTagline', 'siteDescription', 'logoText', 'logoImageUrl',
  'faviconUrl', 'primaryColor', 'metaTitle', 'metaDescription',
  'footerCopyright', 'footerLinks', 'socialLinks', 'announcementBar',
  'adminName', 'adminTagline', 'loginBrandName', 'loginTagline',
  'promoEnabled', 'promoTitle', 'promoDescription', 'promoEmoji1',
  'promoEmoji2', 'promoGradientFrom', 'promoGradientTo',
  'promoCtaText', 'promoCtaUrl',
];

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;
  return NextResponse.json(await getSettings());
}

export async function PUT(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const patch = pickAllowedFields<SiteSettings>(rawBody, ALLOWED_SETTINGS_KEYS);

  // Validate URL-bearing fields to block javascript:/data: injection and SSRF
  if (patch.logoImageUrl && !isSafeHref(patch.logoImageUrl)) {
    return NextResponse.json({ error: 'Invalid logoImageUrl' }, { status: 400 });
  }
  if (patch.faviconUrl && !isSafeHref(patch.faviconUrl)) {
    return NextResponse.json({ error: 'Invalid faviconUrl' }, { status: 400 });
  }
  if (patch.promoCtaUrl && !isSafeHref(patch.promoCtaUrl)) {
    return NextResponse.json({ error: 'Invalid promoCtaUrl' }, { status: 400 });
  }
  if (Array.isArray(patch.footerLinks)) {
    patch.footerLinks = patch.footerLinks
      .filter((l) => l && typeof l.label === 'string' && isSafeHref(l.href))
      .slice(0, 12);
  }
  if (patch.socialLinks && typeof patch.socialLinks === 'object') {
    patch.socialLinks = {
      twitter:   isSafeHref(patch.socialLinks.twitter)   ? patch.socialLinks.twitter.trim()   : '',
      github:    isSafeHref(patch.socialLinks.github)    ? patch.socialLinks.github.trim()    : '',
      instagram: isSafeHref(patch.socialLinks.instagram) ? patch.socialLinks.instagram.trim() : '',
    };
  }

  const updated = await saveSettings(patch);
  revalidateTag('settings', 'max');
  revalidatePath('/');
  revalidatePath('/login');
  return NextResponse.json(updated);
}
