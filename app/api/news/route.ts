import { NextResponse } from 'next/server';
import { fetchAggregatedNews, getFlashBriefs } from '@/lib/rssFetcher';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('refresh') === 'true' || searchParams.get('force') === 'true';
    const [news, flashBriefs] = await Promise.all([
      fetchAggregatedNews(force),
      getFlashBriefs(force),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        news,
        flashBriefs,
        updatedAt: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      },
    });
  } catch (error) {
    console.error('API /api/news error:', error);
    return NextResponse.json(
      { success: false, error: '获取最新实时新闻失败' },
      { status: 500 }
    );
  }
}
