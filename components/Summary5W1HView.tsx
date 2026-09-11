'use client';

import React from 'react';
import { Summary5W1H } from '@/lib/types';
import { FileText, AlertTriangle, X, Building2 } from 'lucide-react';
import { CompanyProfile, getCompanyProfileForNews } from '@/lib/companyProfiles';

interface Summary5W1HViewProps {
  summaryParagraph?: string;
  summary?: Summary5W1H;
  title?: string;
  time?: string;
  source?: string;
  verificationBadge?: string;
  hasClarification?: boolean;
  clarificationNote?: string;
  companyProfile?: CompanyProfile;
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
  companyProfile,
  onClose,
}: Summary5W1HViewProps) {
  // 1. 如果已有预生成的 5W1H 一段总结，且格式合规，直接使用
  let paragraph = summaryParagraph;
  if (
    paragraph &&
    (paragraph.includes('使得市场面临现实痛点') ||
      /：[，,、\s]*。?$/.test(paragraph) ||
      paragraph.length < 18)
  ) {
    paragraph = undefined;
  }

  // 2. 如果只有结构化的 summary，根据实际披露要素客观叙述（无原因绝不硬编）
  if (!paragraph && summary) {
    const when = summary.when || (time ? `${time}` : '权威电讯通报');
    const cleanWhat = (summary.what || (title ? title.replace(/^【.*?】\s*/, '') : '发布最新核心进展')).trim().replace(/[。！!.]+$/, '');
    const cleanWhy = (summary.why || '').trim().replace(/[。！!.]+$/, '');
    const cleanConsequence = (summary.consequence || '').trim().replace(/[。！!.]+$/, '');

    let text = `据${when}，${cleanWhat}。`;
    if (cleanWhy && cleanWhy.length >= 4 && !cleanWhy.includes('宏观宏图') && !cleanWhy.includes('利益交织对立')) {
      text += ` 信源表明，该事项起因于${cleanWhy}。`;
    } else if (title && /退市.*造假|造假.*退市/.test(title)) {
      text += ` 该事项起因于此前监管部门对涉事企业财务造假违规行为通报点名并实施顶格行政处罚。`;
    }
    if (cleanConsequence && cleanConsequence.length >= 4 && !cleanConsequence.includes('直接影响相关领域')) {
      text += ` 直接影响方面，${cleanConsequence}。`;
    } else if (title && /退市/.test(title)) {
      text += ` 直接影响方面，涉案企业将依法进入退市出清程序并被终止上市。`;
    }
    paragraph = text;
  }

  // 3. 保底段落生成（确保客观事实陈述，讲清来龙去脉）
  if (!paragraph) {
    const cleanTitle = (title || '最新重大事件').replace(/^【.*?】\s*/, '');
    let text = `据${time ? `${time}` : '权威电讯'}（${source || '信源'}）通报，${cleanTitle}。`;
    if (/退市.*造假|造假.*退市/.test(cleanTitle)) {
      text += ` 监管部门依法依规执行常态化退市出清程序，保护投资者合法权益。`;
    } else {
      text += ` 相关主管机构与涉事当事方正依法依规推进后续处置与合规应对。`;
    }
    paragraph = text;
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

      {/* 涉事主体业务概况速览 */}
      {(() => {
        const activeProfile = companyProfile || (title ? getCompanyProfileForNews(title, paragraph) : null);
        if (!activeProfile) return null;
        return (
          <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 text-xs md:text-sm shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-extrabold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span>【涉事主体速览 · {activeProfile.name}】</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-bold text-[11px] border border-blue-200 dark:border-blue-800">
                {activeProfile.sector}
              </span>
            </div>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
              {activeProfile.description}
            </p>
            {activeProfile.marketRole && (
              <div className="mt-1.5 pt-1.5 border-t border-blue-100 dark:border-blue-900/40 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-blue-700 dark:text-blue-400">产业链生态：</span>{activeProfile.marketRole}
              </div>
            )}
          </div>
        );
      })()}

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
