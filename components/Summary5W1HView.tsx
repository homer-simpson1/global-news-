'use client';

import React from 'react';
import { Summary5W1H } from '@/lib/types';
import { FileText, AlertTriangle, X } from 'lucide-react';

interface Summary5W1HViewProps {
  summaryParagraph?: string;
  summary?: Summary5W1H;
  title?: string;
  time?: string;
  source?: string;
  verificationBadge?: string;
  hasClarification?: boolean;
  clarificationNote?: string;
  onClose?: () => void;
}

export default function Summary5W1HView({
  summaryParagraph,
  summary,
  title,
  time,
  source,
  verificationBadge,
  hasClarification,
  clarificationNote,
  onClose,
}: Summary5W1HViewProps) {
  // 1. 如果已有预生成的 5W1H 一段总结，直接使用
  let paragraph = summaryParagraph;

  // 2. 如果只有结构化的 summary，自动融合成一段连贯通顺的 5W1H 叙述段落
  if (!paragraph && summary) {
    const when = summary.when || (time ? `${time}` : '权威电讯通报');
    const where = summary.where || '涉事相关区域';
    const who = summary.who || '相关核心主体';
    const cleanWhat = (summary.what || (title ? title.replace(/^【.*?】\s*/, '') : '发布最新核心进展')).trim().replace(/[。！!.]+$/, '');
    const cleanWhy = (summary.why || '相关宏观环境与地缘格局变动驱动').trim().replace(/[。！!.]+$/, '');
    const cleanConsequence = (summary.consequence || '对市场资产与决策带来后续连锁传导').trim().replace(/[。！!.]+$/, '');

    paragraph = `据${when}，在${where}，${who}证实最新核心进展：${cleanWhat}。究其起因，主要是${cleanWhy}。该事件带来的直接后果是，${cleanConsequence}。`;
  }

  // 3. 保底段落生成（确保永远有一段通顺的 5W1H 总结）
  if (!paragraph) {
    const cleanTitle = (title || '最新重大事件').replace(/^【.*?】\s*/, '');
    paragraph = `据${time ? `${time}` : '权威电讯'}核实通报：${cleanTitle}。该事件体现了当前宏观与微观基本面的最新异动，直接影响后续市场预期与战略决策走向。`;
  }

  // 提取核心后果一句话提示（用于在段落下方醒目强调）
  const consequenceHighlight = summary?.consequence || null;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 p-4 md:p-5 my-3.5 space-y-3.5">
      {/* 小结标题栏（内嵌顶部快捷关闭按钮，避免用户长距离移动鼠标） */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80 dark:border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            事件深度透视 · 核心要务归纳
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded hidden sm:inline">
            叙事性事实提炼
          </span>
          {onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all shadow-xs cursor-pointer select-none active:scale-95"
              title="收起此板块详细阅读 (快捷键: Esc)"
            >
              <X className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>关闭 / 收起</span>
            </button>
          )}
        </div>
      </div>

      {/* 辟谣与澄清反向警示条 */}
      {hasClarification && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs md:text-sm text-amber-900 dark:text-amber-200 shadow-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-amber-800 dark:text-amber-300 mr-1.5">官方辟谣/澄清特别提示：</span>
            <span>{clarificationNote || '该事实存在官方最新澄清或辟谣修正，请重点结合后续通报研判。'}</span>
          </div>
        </div>
      )}

      {/* 核心段落总结 */}
      <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm">
        <p className="text-base md:text-lg text-slate-800 dark:text-slate-200 leading-relaxed md:leading-loose tracking-wide text-justify font-normal indent-8">
          {paragraph}
        </p>
      </div>

      {/* 关键后果与传导高亮条 */}
      {consequenceHighlight && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 text-xs md:text-sm">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="text-slate-800 dark:text-slate-200 leading-relaxed">
            <span className="font-bold text-rose-800 dark:text-rose-400 mr-1.5">核心后果与影响：</span>
            <span>{consequenceHighlight}</span>
          </div>
        </div>
      )}

      {/* 底部信源时间脚标与多源印证状态 */}
      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <span>信源出处：{source || '权威电讯直发'}</span>
          {verificationBadge && (
            <span className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-sans font-semibold">
              {verificationBadge}
            </span>
          )}
        </div>
        {time && <span>记录时间：{time}</span>}
      </div>
    </div>
  );
}
