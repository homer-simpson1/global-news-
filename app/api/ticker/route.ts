import { NextRequest, NextResponse } from 'next/server';
import { fetchVerifiedMarketQuotes } from '@/lib/quotesVerifier';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    const { quotes, verificationSummary } = await fetchVerifiedMarketQuotes(force);

    return NextResponse.json({
      success: true,
      data: {
        quotes,
        verificationSummary,
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
