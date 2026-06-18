import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get('ids') || '';
  if (!idsParam.trim()) return NextResponse.json([]);
  const ids = idsParam.split(',').filter(Boolean).slice(0, 50);
  const { data, error } = await supabase
    .from('prompts')
    .select('id, prompt_text, model, gradient_from, gradient_to, local_img, author_name, handle, category')
    .in('id', ids)
    .eq('published', true);
  if (error) return NextResponse.json([]);
  // Preserve caller's order (history/favorites are ordered)
  const map = new Map((data ?? []).map((r) => [r.id, r]));
  return NextResponse.json(ids.map((id) => map.get(id)).filter(Boolean));
}
