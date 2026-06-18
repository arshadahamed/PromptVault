import { NextRequest, NextResponse } from 'next/server';
import { getAllPrompts } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const format = req.nextUrl.searchParams.get('format') || 'json';
  const prompts = getAllPrompts();

  if (format === 'csv') {
    const cols = ['id','promptText','model','category','tab','authorName','handle','likes','views','featured','published','createdAt'];
    const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [
      cols.join(','),
      ...prompts.map((p: any) => cols.map((c) => escape(p[c])).join(',')),
    ];
    return new NextResponse(rows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="prompts-${Date.now()}.csv"`,
      },
    });
  }

  const json = JSON.stringify({ prompts, exportedAt: new Date().toISOString() }, null, 2);
  return new NextResponse(json, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="prompts-backup-${Date.now()}.json"`,
    },
  });
}
