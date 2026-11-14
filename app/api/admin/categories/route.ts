import { NextRequest, NextResponse } from 'next/server';
import { getAllCategories, createCategory, getCategoryPromptCounts } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  const withCounts = req.nextUrl.searchParams.get('withCounts') === '1';
  const categories = await getAllCategories();

  if (!withCounts) {
    return NextResponse.json(categories);
  }

  const counts = await getCategoryPromptCounts();
  return NextResponse.json(
    categories.map((cat) => ({
      ...cat,
      promptCount: counts[cat.name] ?? 0,
    }))
  );
}

export async function POST(req: NextRequest) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

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
  if (existing.some((c) => c.name.trim().toLowerCase() === name.toLowerCase())) {
    return NextResponse.json({ error: `Category "${name}" already exists.` }, { status: 409 });
  }

  const cat = await createCategory(name);
  return NextResponse.json(cat, { status: 201 });
}
