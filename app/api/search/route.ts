import { NextRequest, NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').trim();
  if (!q) return NextResponse.json([]);

  const pct = `%${q}%`;
  const { data, error } = await supabasePublic
    .from('prompts')
    .select('id, prompt_text, model, gradient_from, gradient_to, local_img, author_name, handle, category')
    .eq('published', true)
    .or(`prompt_text.ilike.${pct},model.ilike.${pct},category.ilike.${pct},author_name.ilike.${pct}`)
    .limit(10);

  if (error) return NextResponse.json([]);
  return NextResponse.json(data ?? []);
}
