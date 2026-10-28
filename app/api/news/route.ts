import { NextResponse } from 'next/server';
import { fetchAggregatedNews, getFlashBriefs } from '@/lib/rssFetcher';
import { autoCorrectAllNews } from '@/lib/selfHealingEngine';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('refresh') === 'true' || searchParams.get('force') === 'true';

    if (searchParams.get('debug') === 'true') {
      const debugResults: any = {};
      const defaultHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, text/html, */*',
      };

      try {
        const zbRes = await fetch('https://www.zaobao.com.sg/realtime/china', { headers: defaultHeaders });
        const zbHtml = await zbRes.text();
        const zbMatches = Array.from(zbHtml.matchAll(/href="(\/(?:realtime|news)\/china\/story[^\"]+)"[^>]*>([\s\S]*?)<\/a>/g));
        debugResults.zaobao = {
          status: zbRes.status,
          len: zbHtml.length,
          matches: zbMatches.length,
          sample: zbMatches.slice(0, 3).map((m: any) => m[1]),
        };
      } catch (e: any) {
        debugResults.zaobao = { error: e.message };
      }

      try {
        const cxRes = await fetch('https://finance.caixin.com/', { headers: defaultHeaders });
        const cxHtml = await cxRes.text();
        const cxMatches = Array.from(cxHtml.matchAll(/<a[^>]+href="([^"]*caixin\.com\/(\d{4})-(\d{2})-(\d{2})\/(\d+)\.html)"[^>]*>([\s\S]*?)<\/a>/g));
        debugResults.caixin = {
          status: cxRes.status,
          len: cxHtml.length,
          matches: cxMatches.length,
          sample: cxMatches.slice(0, 3).map((m: any) => m[1]),
        };
      } catch (e: any) {
        debugResults.caixin = { error: e.message };
      }

      try {
        const wscnRes = await fetch('https://api-one-wscn.awtmt.com/apiv1/content/lives?channel=global-channel&limit=10', { headers: defaultHeaders });
        const wscnJson: any = await wscnRes.json();
        debugResults.wscn = {
          status: wscnRes.status,
          code: wscnJson.code,
          itemsCount: wscnJson.data?.items?.length,
          sample: wscnJson.data?.items?.slice(0, 2).map((x: any) => ({ title: x.title, time: x.display_time })),
        };
      } catch (e: any) {
        debugResults.wscn = { error: e.message };
      }

      try {
        const rawItems = await fetchAggregatedNews(true);
        debugResults.aggregatedCount = rawItems.length;
        debugResults.sampleAggregated = rawItems.slice(0, 3).map((x: any) => ({ title: x.title, publishedAt: x.publishedAt, source: x.source }));
      } catch (e: any) {
        debugResults.aggregatedError = e.message;
      }

      return NextResponse.json({ success: true, debug: debugResults });
    }

    const rawNews = await fetchAggregatedNews(force);
    const rawFlashBriefs = await getFlashBriefs(force);
    // API 出口端二次强校验与自愈纠偏
    const { news, flashBriefs } = autoCorrectAllNews(rawNews, rawFlashBriefs);

    const cacheControl = force
      ? 'no-cache, no-store, must-revalidate'
      : 'public, max-age=15, s-maxage=30, stale-while-revalidate=60';

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

    return response;
  } catch (error) {
    console.error('API /api/news error:', error);
    return NextResponse.json(
      { success: false, error: '获取最新实时新闻失败' },
      { status: 500 }
    );
  }
}
