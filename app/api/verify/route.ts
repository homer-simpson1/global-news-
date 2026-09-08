import { NextResponse } from 'next/server';
import { getOrRunNewsVerification, runNewsAccuracyVerification } from '@/lib/newsVerifier';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // Cloudflare Edge Cache API: 极速边缘机房毫秒级响应 (5-20ms)
    // @ts-ignore
    const edgeCache = typeof caches !== 'undefined' ? (caches.default || null) : null;
    const cacheUrl = new URL(request.url);
    cacheUrl.search = '';
    const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' });

    if (!force && edgeCache) {
      try {
        const cachedRes = await edgeCache.match(cacheKey);
        if (cachedRes) {
          return cachedRes;
        }
      } catch (err) {
        // silent
      }
    }

    const report = await getOrRunNewsVerification(force);

    const response = NextResponse.json(
      {
        success: true,
        data: report,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );

    if (!force && edgeCache) {
      try {
        await edgeCache.put(cacheKey, response.clone());
      } catch (err) {
        // silent
      }
    }

    return response;
  } catch (error: any) {
    console.error('API /api/verify error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '自动化核验异常' },
      { status: 500 }
    );
  }
}
