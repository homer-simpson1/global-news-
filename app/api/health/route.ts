import { NextResponse } from 'next/server';
import { checkAllLiveSources } from '@/lib/rssFetcher';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET() {
  try {
    const report = await checkAllLiveSources();
    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error('API /api/health error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '健康检查异常' },
      { status: 500 }
    );
  }
}
