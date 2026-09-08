import { NextRequest, NextResponse } from 'next/server';
import { fetchVerifiedMarketQuotes } from '@/lib/quotesVerifier';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: NextRequest) {
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

    const { quotes, verificationSummary } = await fetchVerifiedMarketQuotes(force);

    const cacheControl = force
      ? 'no-cache, no-store, must-revalidate'
      : 'public, max-age=15, s-maxage=30, stale-while-revalidate=60';

    const response = NextResponse.json(
      {
        success: true,
        data: {
          quotes,
          verificationSummary,
          updatedAt: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        },
      },
      {
        headers: {
          'Cache-Control': cacheControl,
          'Content-Type': 'application/json; charset=utf-8',
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
  } catch (error) {
    console.error('API /api/ticker error:', error);
    return NextResponse.json(
      { success: false, error: '获取行情失败' },
      { status: 500 }
    );
  }
}
