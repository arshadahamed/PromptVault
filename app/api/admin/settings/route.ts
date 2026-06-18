import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getSettings, saveSettings } from '@/lib/settings';

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;
  return NextResponse.json(getSettings());
}

export async function PUT(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;
  const body = await req.json();
  const updated = saveSettings(body);
  return NextResponse.json(updated);
}
