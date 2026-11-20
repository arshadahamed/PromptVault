import type { Metadata, Viewport } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { getSettings } from '@/lib/settings';
import { isSafeHref } from '@/lib/security';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const revalidate = 3600;

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
  width: 'device-width',
  initialScale: 1,
};

function getR2Origin(): string | null {
  const raw = process.env.R2_PUBLIC_URL;
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();

  const title       = s.metaTitle       || s.siteName       || 'PromptVault — Free AI Prompt Gallery';
  const description = s.metaDescription || s.siteDescription || 'Browse 8,700+ curated free AI prompts for ChatGPT, Midjourney, Nanobanana, Flux, and more.';
  const siteUrl     = process.env.NEXT_PUBLIC_SITE_URL || 'https://prompt-vault-seven-eta.vercel.app';
  const safeLogo    = isSafeHref(s.logoImageUrl) ? s.logoImageUrl : '';

  return {
    title: {
      default: title,
      template: `%s | ${s.siteName || 'PromptVault'}`,
    },
    description,
    keywords: [
      'AI prompts', 'ChatGPT prompts', 'Midjourney prompts', 'Nanobanana prompts',
      'Flux prompts', 'Seedance prompts', 'free AI prompts', 'AI image prompts',
      'prompt gallery', 'AI art prompts', 'GPT Image prompts',
    ],
    authors: [{ name: s.siteName || 'PromptVault' }],
    creator: s.siteName || 'PromptVault',
    metadataBase: new URL(siteUrl),
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: siteUrl,
      siteName: s.siteName || 'PromptVault',
      title,
      description,
      images: safeLogo ? [{ url: safeLogo, width: 1200, height: 630, alt: title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: safeLogo ? [safeLogo] : [],
      creator: s.socialLinks?.twitter ? `@${s.socialLinks.twitter.split('/').pop()}` : undefined,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  const siteUrl  = process.env.NEXT_PUBLIC_SITE_URL || 'https://prompt-vault-seven-eta.vercel.app';
  const siteName = s.siteName || 'PromptVault';
  const description = s.metaDescription || s.siteDescription || 'Browse 8,700+ curated free AI prompts for ChatGPT, Midjourney, Nanobanana, Flux, and more.';
  const safeLogo = isSafeHref(s.logoImageUrl) ? s.logoImageUrl : '';
  const r2Origin = getR2Origin();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: siteName,
        description,
        inLanguage: 'en-US',
      },
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: siteName,
        url: siteUrl,
        logo: safeLogo ? { '@type': 'ImageObject', url: safeLogo } : undefined,
        sameAs: [
          s.socialLinks?.twitter   ? `https://twitter.com/${s.socialLinks.twitter.split('/').pop()}` : undefined,
          s.socialLinks?.github && isSafeHref(s.socialLinks.github) ? s.socialLinks.github : undefined,
          s.socialLinks?.instagram ? `https://instagram.com/${s.socialLinks.instagram.split('/').pop()}` : undefined,
        ].filter(Boolean),
      },
    ],
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      data-theme="dark"
      className={`${inter.variable} ${poppins.variable}`}
    >
      <head>
        {r2Origin && (
          <>
            <link rel="preconnect" href={r2Origin} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={r2Origin} />
          </>
        )}
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="antialiased selection:bg-violet-500/30">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
        {children}
      </body>
    </html>
  );
}
