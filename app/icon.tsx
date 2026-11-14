import { ImageResponse } from 'next/og';
import { getSettings } from '@/lib/settings';
import { isSafePublicFetchUrl } from '@/lib/security';

export const size = { width: 32, height: 32 };
export const dynamic = 'force-dynamic';

export default async function Icon() {
  const s = await getSettings();

  // If admin uploaded a custom favicon, proxy it safely (SSRF-guarded)
  if (s.faviconUrl && isSafePublicFetchUrl(s.faviconUrl)) {
    try {
      const res = await fetch(s.faviconUrl, { signal: AbortSignal.timeout(4000) });
      const buf = await res.arrayBuffer();
      const ct  = res.headers.get('Content-Type') || 'image/png';
      return new Response(buf, { headers: { 'Content-Type': ct, 'Cache-Control': 'public, max-age=3600' } });
    } catch { /* fall through to default */ }
  }

  // Default: branded PV icon
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ color: 'white', fontSize: 18, fontWeight: 800, fontFamily: 'sans-serif', letterSpacing: '-1px' }}>
          PV
        </div>
      </div>
    ),
    { ...size }
  );
}
