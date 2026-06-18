import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '@/lib/admin-auth';
import { checkCredentials } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 });
  }

  const adminUser = process.env.ADMIN_USERNAME ?? 'admin';
  if (!(await checkCredentials(adminUser, currentPassword))) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 403 });
  }

  const hash = await bcrypt.hash(newPassword, 12);
  const { error } = await supabase
    .from('admin_credentials')
    .upsert({ id: 1, password_hash: hash, updated_at: new Date().toISOString() });

  if (error) return NextResponse.json({ error: 'Failed to save password.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
