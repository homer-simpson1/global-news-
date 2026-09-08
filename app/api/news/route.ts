import { NextResponse } from 'next/server';
import { fetchAggregatedNews, getFlashBriefs } from '@/lib/rssFetcher';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('refresh') === 'true' || searchParams.get('force') === 'true';

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

    const news = await fetchAggregatedNews(force);
    const flashBriefs = await getFlashBriefs(false);

    const cacheControl = force
      ? 'no-cache, no-store, must-revalidate'
      : 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400';

    const response = NextResponse.json(
      {
        success: true,
        data: {
          news,
          flashBriefs,
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
    console.error('API /api/news error:', error);
    return NextResponse.json(
      { success: false, error: '获取最新实时新闻失败' },
      { status: 500 }
    );
  }
}
