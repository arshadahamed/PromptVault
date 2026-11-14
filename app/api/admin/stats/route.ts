import { NextRequest, NextResponse } from 'next/server';
import { getAdminDashboardStats } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  try {
    const stats = await getAdminDashboardStats();
    return NextResponse.json(stats, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load dashboard stats';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
