import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import type { DbPrompt } from '@/lib/db';
import type { Prompt } from '@/lib/types';
import { PromptDetail } from '@/components/prompt/PromptDetail';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [{ data: row }, s] = await Promise.all([
    supabase.from('prompts').select('prompt_text,local_img,model,category').eq('id', id).eq('published', true).maybeSingle(),
    getSettings(),
  ]);
  if (!row) return {};
  const title       = `${(row.prompt_text as string).slice(0, 60).trimEnd()}… — ${s.siteName || 'PromptVault'}`;
  const description = `${row.model} prompt in ${row.category}: ${(row.prompt_text as string).slice(0, 140)}`;
  const image       = (row.local_img as string) || undefined;
  const siteUrl     = process.env.NEXT_PUBLIC_SITE_URL || 'https://prompt-vault-seven-eta.vercel.app';
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/prompt/${id}`,
      images: image ? [{ url: image, alt: title }] : [],
    },
    twitter: { card: 'summary_large_image', title, description, images: image ? [image] : [] },
  };
}

function toPrompt(p: DbPrompt): Prompt {
  const name   = p.authorName || 'Admin';
  const handle = p.handle.startsWith('@') ? p.handle : '@' + p.handle;
  const words  = name.split(/\s+/);
  const initials = words.map((w) => w[0] || '').join('').toUpperCase().slice(0, 2) || 'U';
  const colors   = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6'];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return {
    id:           p.id,
    author:       { name, handle, initials, avatarColor: colors[h] },
    model:        p.model    as any,
    category:     p.category as any,
    tab:          p.tab      as any,
    likes:        p.likes,
    views:        p.views,
    promptText:   p.promptText,
    aspectRatio:  p.aspectRatio,
    gradientFrom: p.gradientFrom,
    gradientTo:   p.gradientTo,
    localImg:     p.localImg,
    relatedIds:   [],
    createdAt:    p.createdAt.slice(0, 10),
  };
}

export default async function PromptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: row } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', id)
    .eq('published', true)
    .maybeSingle();

  if (!row) notFound();

  const { data: relatedRows } = await supabase
    .from('prompts')
    .select('*')
    .eq('category', row.category)
    .eq('published', true)
    .neq('id', id)
    .order('featured', { ascending: false })
    .limit(3);

  const prompt  = toPrompt(row as DbPrompt);
  const related = (relatedRows ?? []).map((r) => toPrompt(r as DbPrompt));

  return <PromptDetail prompt={prompt} related={related} />;
}
