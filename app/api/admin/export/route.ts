import { NextRequest, NextResponse } from 'next/server';
import { getAllPrompts } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

function escapeCsvCell(v: unknown): string {
  let str = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const sp = req.nextUrl.searchParams;
  const format = sp.get('format') || 'json';
  const status = sp.get('status') || 'all';
  const model = sp.get('model') || '';

  let prompts = await getAllPrompts();
  if (status === 'published') prompts = prompts.filter((p) => p.published !== false);
  else if (status === 'draft') prompts = prompts.filter((p) => p.published === false);
  else if (status === 'featured') prompts = prompts.filter((p) => p.featured === true);
  if (model) prompts = prompts.filter((p) => p.model === model);

  if (format === 'csv') {
    const cols = ['id', 'title', 'promptText', 'model', 'category', 'tab', 'codeLanguage', 'hasCode', 'previewUrl', 'authorName', 'handle', 'likes', 'views', 'featured', 'published', 'createdAt'] as const;
    const rows = [
      cols.join(','),
      ...prompts.map((p) => cols.map((c) => escapeCsvCell(p[c])).join(',')),
    ];
    return new NextResponse(rows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="prompts-${Date.now()}.csv"`,
      },
    });
  }

  const json = JSON.stringify({ prompts, exportedAt: new Date().toISOString() }, null, 2);
  return new NextResponse(json, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="prompts-backup-${Date.now()}.json"`,
    },
  });
}
