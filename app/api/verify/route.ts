import { NextResponse } from 'next/server';
import { getOrRunNewsVerification, runNewsAccuracyVerification } from '@/lib/newsVerifier';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    const report = await getOrRunNewsVerification(force);

    return NextResponse.json(
      {
        success: true,
        data: report,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error: any) {
    console.error('API /api/verify error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '自动化核验异常' },
      { status: 500 }
    );
  }
}
