import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { bulkDeletePrompts, bulkUpdatePrompts } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

type BulkAction = 'publish' | 'unpublish' | 'feature' | 'unfeature' | 'setCategory';

function sanitizeIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((id): id is string => typeof id === 'string' && id.trim().length > 0 && id.length <= 64))];
}

export async function PATCH(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const ids = sanitizeIds(body.ids);
  if (ids.length === 0) {
    return NextResponse.json({ error: 'ids array required' }, { status: 400 });
  }

  const action = body.action as BulkAction;
  let updated = 0;

  if (action === 'publish') updated = await bulkUpdatePrompts(ids, { published: true });
  else if (action === 'unpublish') updated = await bulkUpdatePrompts(ids, { published: false });
  else if (action === 'feature') updated = await bulkUpdatePrompts(ids, { featured: true });
  else if (action === 'unfeature') updated = await bulkUpdatePrompts(ids, { featured: false });
  else if (action === 'setCategory') {
    const category = typeof body.category === 'string' ? body.category.trim() : '';
    if (!category) return NextResponse.json({ error: 'category required' }, { status: 400 });
    updated = await bulkUpdatePrompts(ids, { category });
  } else {
    return NextResponse.json({ error: 'Unsupported bulk action' }, { status: 400 });
  }

  revalidateTag('prompts', 'max');
  revalidatePath('/');
  return NextResponse.json({ updated });
}

export async function DELETE(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const ids = sanitizeIds(body.ids);
  if (ids.length === 0) {
    return NextResponse.json({ error: 'ids array required' }, { status: 400 });
  }

  const removed = await bulkDeletePrompts(ids);
  revalidateTag('prompts', 'max');
  revalidatePath('/');
  return NextResponse.json({ removed });
}
