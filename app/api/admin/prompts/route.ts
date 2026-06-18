import { NextRequest, NextResponse } from 'next/server';
import { getAllPrompts, createPrompt, searchPrompts } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  const q = req.nextUrl.searchParams.get('q') || '';
  const model = req.nextUrl.searchParams.get('model') || '';
  const category = req.nextUrl.searchParams.get('category') || '';
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');

  let prompts = q ? searchPrompts(q) : getAllPrompts();
  if (model) prompts = prompts.filter((p) => p.model === model);
  if (category) prompts = prompts.filter((p) => p.category === category);

  prompts = [...prompts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const total = prompts.length;
  const items = prompts.slice((page - 1) * limit, page * limit);
  return NextResponse.json({ items, total, page, limit });
}

export async function POST(req: NextRequest) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  const data = await req.json();
  const prompt = createPrompt({
    promptText: data.promptText || '',
    imageUrl: data.imageUrl || '',
    localImg: data.localImg || '',
    authorName: data.authorName || 'User',
    handle: data.handle || '',
    model: data.model || 'GPT Image',
    category: data.category || 'ChatGPT',
    tab: data.tab || 'GPT Image',
    likes: data.likes || 0,
    views: data.views || 0,
    gradientFrom: data.gradientFrom || '#b4d4f5',
    gradientTo: data.gradientTo || '#f5d4b4',
    aspectRatio: data.aspectRatio || '4/3',
  });
  return NextResponse.json(prompt, { status: 201 });
}
