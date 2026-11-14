import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublishedPromptWithRelated } from '@/lib/db';
import { toPrompt } from '@/lib/prompts';
import { isSafeHref } from '@/lib/security';
import { PromptDetail } from '@/components/prompt/PromptDetail';
import { getSettings } from '@/lib/settings';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [{ prompt }, s] = await Promise.all([
    getPublishedPromptWithRelated(id),
    getSettings(),
  ]);

  if (!prompt) return {};

  const siteName    = s.siteName || 'PromptVault';
  const snippet     = prompt.promptText.slice(0, 60).trimEnd();
  const baseTitle   = prompt.title?.trim() ? prompt.title.trim() : `${snippet}…`;
  const title       = `${baseTitle} — ${siteName}`;
  const description = `${prompt.model} prompt in ${prompt.category}: ${prompt.promptText.slice(0, 140)}`;
  const rawImg      = prompt.localImg || prompt.galleryImages?.[0] || '';
  const image       = isSafeHref(rawImg) ? rawImg : undefined;
  const siteUrl     = process.env.NEXT_PUBLIC_SITE_URL || 'https://prompt-vault-seven-eta.vercel.app';

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/prompt/${prompt.id}` },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/prompt/${prompt.id}`,
      images: image ? [{ url: image, alt: title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function PromptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { prompt: dbPrompt, related: dbRelated } = await getPublishedPromptWithRelated(id);

  if (!dbPrompt) notFound();

  const prompt  = toPrompt(dbPrompt);
  const related = dbRelated.map(toPrompt);

  return <PromptDetail prompt={prompt} related={related} />;
}
