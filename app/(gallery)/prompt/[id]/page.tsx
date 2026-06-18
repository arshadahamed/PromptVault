import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { DbPrompt } from '@/lib/db';
import type { Prompt } from '@/lib/types';
import { PromptDetail } from '@/components/prompt/PromptDetail';

export const dynamic = 'force-dynamic';

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
