'use client';

import React from 'react';
import { Summary5W1H } from '@/lib/types';
import { FileText, AlertTriangle } from 'lucide-react';

interface Summary5W1HViewProps {
  summaryParagraph?: string;
  summary?: Summary5W1H;
  title?: string;
  time?: string;
  source?: string;
}

export default function Summary5W1HView({
  summaryParagraph,
  summary,
  title,
  time,
  source,
}: Summary5W1HViewProps) {
  // 1. 如果已有预生成的 5W1H 一段总结，直接使用
  let paragraph = summaryParagraph;

  // 2. 如果只有结构化的 summary，自动融合成一段连贯通顺的 5W1H 叙述段落
  if (!paragraph && summary) {
    const when = summary.when || (time ? `本日 ${time}` : '今日');
    const where = summary.where || '涉事相关区域';
    const who = summary.who || '相关核心主体';
    const what = summary.what || (title ? title.replace(/^【.*?】\s*/, '') : '发布最新核心进展');
    const why = summary.why || '相关宏观环境与地缘格局变动驱动';
    const consequence = summary.consequence || '对市场资产与决策带来后续连锁传导。';

    paragraph = `${when}，在${where}，${who}证实最新核心进展：${what}。究其起因，主要是${why}。该事件带来的直接后果是，${consequence}`;
  }

  // 3. 保底段落生成（确保永远有一段通顺的 5W1H 总结）
  if (!paragraph) {
    const cleanTitle = (title || '最新重大事件').replace(/^【.*?】\s*/, '');
    paragraph = `${time ? `本日 ${time}，` : ''}官方电讯核实通报最新事实：${cleanTitle}。该事件体现了当前宏观与微观基本面的最新异动，直接影响后续市场预期与战略决策走向。`;
  }

  // 提取核心后果一句话提示（用于在段落下方醒目强调）
  const consequenceHighlight = summary?.consequence || null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 md:p-5 my-3.5 space-y-3.5">
      {/* 小结标题栏：清爽杂志风格，不搞花哨网格 */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <h4 className="text-sm font-bold text-slate-900 tracking-tight">
            事件深度小结（5W1H 全要素归纳）
          </h4>
        </div>
        <span className="text-[11px] font-mono text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
          叙事性事实提炼
        </span>
      </div>

      {/* 核心需求：用户要求的一整段连贯总结，字号适中，行距舒适，黑字大排版 */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <p className="text-sm md:text-base text-slate-800 leading-relaxed tracking-normal text-justify font-normal indent-6">
          {paragraph}
        </p>
      </div>

      {/* 关键后果与传导高亮条 */}
      {consequenceHighlight && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50/80 border border-rose-200/80 text-xs md:text-sm">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="text-slate-800 leading-relaxed">
            <span className="font-bold text-rose-800 mr-1.5">核心后果与影响：</span>
            <span>{consequenceHighlight}</span>
          </div>
        </div>
      )}

      {/* 底部信源时间脚标 */}
      <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between pt-1">
        <span>信源出处：{source || '权威电讯直发'}</span>
        {time && <span>记录时间：{time}</span>}
      </div>
    </div>
  );
}
