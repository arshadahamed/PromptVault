import type { Metadata } from 'next';
import './globals.css';
import { getSettings } from '@/lib/settings';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title:       s.metaTitle       || s.siteName || 'PromptVault',
    description: s.metaDescription || s.siteDescription || 'Browse free AI prompts.',
    icons:       s.faviconUrl ? { icon: s.faviconUrl } : undefined,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
