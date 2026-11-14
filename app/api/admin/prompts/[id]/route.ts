import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getPromptById, updatePrompt, deletePrompt, type DbPrompt } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { isSafeHref, pickAllowedFields } from '@/lib/security';

const ALLOWED_PROMPT_FIELDS: readonly (keyof DbPrompt)[] = [
  'promptText', 'imageUrl', 'localImg', 'authorName', 'handle',
  'model', 'category', 'tab', 'likes', 'views',
  'gradientFrom', 'gradientTo', 'aspectRatio', 'featured', 'published',
];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  const { id }   = await params;
  const prompt   = await getPromptById(id);
  if (!prompt) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(prompt);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  let rawData: unknown;
  try {
    rawData = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const patch = pickAllowedFields<DbPrompt>(rawData, ALLOWED_PROMPT_FIELDS);
  if (typeof patch.promptText === 'string' && !patch.promptText.trim()) {
    return NextResponse.json({ error: 'Prompt text cannot be empty' }, { status: 400 });
  }
  if (patch.imageUrl && !isSafeHref(patch.imageUrl)) {
    return NextResponse.json({ error: 'Invalid imageUrl' }, { status: 400 });
  }
  if (patch.localImg && !isSafeHref(patch.localImg)) {
    return NextResponse.json({ error: 'Invalid localImg' }, { status: 400 });
  }

  const { id }  = await params;
  const updated = await updatePrompt(id, patch);
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  revalidateTag('prompts', 'max');
  revalidatePath('/');
  revalidatePath(`/prompt/${id}`);
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  const { id } = await params;
  const ok     = await deletePrompt(id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  revalidateTag('prompts', 'max');
  revalidatePath('/');
  revalidatePath(`/prompt/${id}`);
  return NextResponse.json({ ok: true });
}
