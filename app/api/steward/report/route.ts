import { NextResponse } from 'next/server';
import { runNewsAccuracyVerification, getOrRunNewsVerification } from '@/lib/newsVerifier';
import {
  generateInspectionMarkdown,
  saveInspectionReportToDisk,
  getLatestInspectionReportFromDisk,
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
      saveInspectionReportToDisk(reportData);
    } else {
      const diskReport = getLatestInspectionReportFromDisk();
      if (diskReport && diskReport.markdown) {
        markdown = diskReport.markdown;
        reportData = diskReport.json;
      } else {
        reportData = await getOrRunNewsVerification(false);
        markdown = generateInspectionMarkdown(reportData);
        saveInspectionReportToDisk(reportData);
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

    return NextResponse.json({
      success: true,
      data: {
        report: reportData,
        markdown,
        reportPath: 'D:\\GEMINI\\global-intelligence-terminal\\reports\\latest_inspection_report.md',
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
    // 强制触发一次全新全量核验并就地持久化
    const report = await runNewsAccuracyVerification();
    const markdown = generateInspectionMarkdown(report);
    const diskSaved = saveInspectionReportToDisk(report);

    return NextResponse.json({
      success: true,
      message: '全栈巡检已完成并生成最新报告',
      data: {
        report,
        markdown,
        diskSaved,
        reportPath: 'D:\\GEMINI\\global-intelligence-terminal\\reports\\latest_inspection_report.md',
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
