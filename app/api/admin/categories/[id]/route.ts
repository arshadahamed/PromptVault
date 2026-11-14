import { NextRequest, NextResponse } from 'next/server';
import { getAllCategories, updateCategory, deleteCategory } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  const { id } = await params;
  let body: { name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return NextResponse.json({ error: 'Category name is required.' }, { status: 400 });
  if (name.length > 80) return NextResponse.json({ error: 'Category name must be 80 characters or fewer.' }, { status: 400 });

  const existing = await getAllCategories();
  if (existing.some((c) => c.id !== id && c.name.trim().toLowerCase() === name.toLowerCase())) {
    return NextResponse.json({ error: `Category "${name}" already exists.` }, { status: 409 });
  }

  const cat = await updateCategory(id, name);
  if (!cat) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(cat);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  const { id } = await params;
  const ok     = await deleteCategory(id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
