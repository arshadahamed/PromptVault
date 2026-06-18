import type { Metadata } from 'next';
import './globals.css';
import { getSettings } from '@/lib/settings';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();

  const title       = s.metaTitle       || s.siteName       || 'PromptVault — Free AI Prompt Gallery';
  const description = s.metaDescription || s.siteDescription || 'Browse 1,977+ free AI prompts for ChatGPT, Midjourney, Gemini, DALL-E, Flux, and more. Copy, use, and share the best AI image & text prompts.';
  const siteUrl     = process.env.NEXT_PUBLIC_SITE_URL || 'https://prompt-vault-seven-eta.vercel.app';

  return {
    title: {
      default: title,
      template: `%s | ${s.siteName || 'PromptVault'}`,
    },
    description,
    keywords: [
      'AI prompts', 'ChatGPT prompts', 'Midjourney prompts', 'Gemini prompts',
      'DALL-E prompts', 'Flux prompts', 'free AI prompts', 'AI image prompts',
      'prompt gallery', 'AI art prompts', 'GPT Image 2 prompts',
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
      images: s.logoImageUrl
        ? [{ url: s.logoImageUrl, width: 1200, height: 630, alt: title }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: s.logoImageUrl ? [s.logoImageUrl] : [],
      creator: s.socialLinks?.twitter ? `@${s.socialLinks.twitter.split('/').pop()}` : undefined,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
    icons: s.faviconUrl
      ? { icon: s.faviconUrl, shortcut: s.faviconUrl }
      : { icon: '/icon.svg' },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
