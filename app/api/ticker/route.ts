import { NextResponse } from 'next/server';
import { getMarketQuotes } from '@/lib/rssFetcher';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const quotes = await getMarketQuotes();
    return NextResponse.json({
      success: true,
      data: {
        quotes,
        updatedAt: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      },
    });
  } catch (error) {
    console.error('API /api/ticker error:', error);
    return NextResponse.json(
      { success: false, error: '获取行情失败' },
      { status: 500 }
    );
  }
}
