import { NextRequest, NextResponse } from 'next/server';
import { bulkDeletePrompts } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function DELETE(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0)
    return NextResponse.json({ error: 'ids array required' }, { status: 400 });

  const removed = bulkDeletePrompts(ids);
  return NextResponse.json({ removed });
}
