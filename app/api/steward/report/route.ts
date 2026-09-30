import { NextResponse } from 'next/server';
import { runNewsAccuracyVerification, getOrRunNewsVerification } from '@/lib/newsVerifier';
import {
  generateInspectionMarkdown,
  cacheInspectionReportInMemory,
  getLatestInspectionReportFromMemory,
  getInspectionHistoryFromMemory,
  getInspectionArchiveFromMemory,
} from '@/lib/inspectionReportGenerator';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download') === 'true';
    const force = searchParams.get('force') === 'true';

    let markdown = '';
    let reportData = null;

    if (force) {
      reportData = await runNewsAccuracyVerification();
      markdown = generateInspectionMarkdown(reportData);
      cacheInspectionReportInMemory(reportData);
    } else {
      const memoryReport = getLatestInspectionReportFromMemory();
      if (memoryReport && memoryReport.markdown) {
        markdown = memoryReport.markdown;
        reportData = memoryReport.json;
      } else {
        reportData = await getOrRunNewsVerification(false);
        markdown = generateInspectionMarkdown(reportData);
        cacheInspectionReportInMemory(reportData);
      }
    }

    if (download) {
      const fileName = `inspection_report_${new Date().toISOString().slice(0, 10)}.md`;
      return new NextResponse(markdown, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    const history = getInspectionHistoryFromMemory();
    const archive = getInspectionArchiveFromMemory();

    return NextResponse.json({
      success: true,
      data: {
        report: reportData,
        markdown,
        history,
        archive,
        storageMode: '纯内存高速缓存 (零硬盘占用)',
        generatedAt: reportData?.verifiedAtLocal || new Date().toLocaleString('zh-CN', { hour12: false }),
      },
    });
  } catch (err: any) {
    console.error('API /api/steward/report error:', err);
    return NextResponse.json(
      { success: false, error: err.message || '获取巡检报告异常' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // 强制触发一次全新全量核验并在内存中高速缓存 (零磁盘写入)
    const report = await runNewsAccuracyVerification();
    const markdown = generateInspectionMarkdown(report);
    const cached = cacheInspectionReportInMemory(report);
    const history = getInspectionHistoryFromMemory();
    const archive = getInspectionArchiveFromMemory();

    return NextResponse.json({
      success: true,
      message: '全栈巡检已完成并缓存至内存 (零硬盘占用)',
      data: {
        report,
        markdown,
        cached,
        history,
        archive,
        storageMode: '纯内存高速缓存 (零硬盘占用)',
        generatedAt: report.verifiedAtLocal,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || '触发巡检失败' },
      { status: 500 }
    );
  }
}
