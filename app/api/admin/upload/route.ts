import { NextRequest, NextResponse } from 'next/server';
import { saveUploadedImage } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const MAGIC: Array<{ mime: string; ext: string; check: (b: Buffer) => boolean }> = [
  { mime: 'image/png',  ext: 'png',  check: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mime: 'image/jpeg', ext: 'jpg',  check: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/gif',  ext: 'gif',  check: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 },
  { mime: 'image/webp', ext: 'webp', check: (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 },
];

export async function POST(req: NextRequest) {
  const authErr = await requireAdmin(req);
  if (authErr) return authErr;

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const detected = MAGIC.find((m) => m.check(buffer));
  if (!detected) {
    return NextResponse.json({ error: 'Unsupported file type. Upload PNG, JPEG, GIF, or WebP.' }, { status: 400 });
  }

  const localImg = saveUploadedImage(buffer, detected.ext);
  return NextResponse.json({ localImg });
}
