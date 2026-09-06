'use client';

import React, { useState } from 'react';
import { FlashBrief } from '@/lib/types';
import { TRACK_THEMES } from '@/lib/trackThemes';
import { Zap, ChevronDown, ChevronUp, ExternalLink, Sparkles } from 'lucide-react';
import Summary5W1HView from './Summary5W1HView';

interface FlashBriefingProps {
  briefs: FlashBrief[];
}

export default function FlashBriefing({ briefs }: FlashBriefingProps) {
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  if (!briefs || briefs.length === 0) return null;

  const toggleExpand = (id: string) => {
    setExpandedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // 智能分离方括号分类前缀与纯净标题，防止狭窄折行断裂
  const parseContent = (content: string, defaultTag: string) => {
    const match = content.match(/^[【\[]([^】\]]+)[】\]]\s*(.*)$/);
    if (match) {
      return {
        tag: match[1].replace(/\/.*$/, '').trim(),
        title: match[2].trim(),
      };
    }
    return {
      tag: defaultTag,
      title: content.trim(),
    };
  };

  return (
    <section className="w-full mb-12">
      {/* 模块标题栏：大气通透 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-slate-900 text-white shadow-md flex items-center justify-center">
            <Zap className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                今日决策速递
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
                5大宏观领域核心事件
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              全景梳理今日决定性大事件 · 多彩色彩锚点区分不同领域 · 点击展开 5W1H 叙事深度小结
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 bg-slate-100 border border-slate-200 font-semibold px-3 py-1.5 rounded-xl">
            💡 领域色彩独立区分 · 点击任意卡片查看小结
          </span>
        </div>
      </div>

      {/* 5条速递列表：每条速递采用自身板块的专属色彩体系，拒绝全篇千篇一律的单调黄白 */}
      <div className="space-y-4 md:space-y-5">
        {briefs.slice(0, 5).map((brief, idx) => {
          const isExpanded = !!expandedMap[brief.id];
          const parsed = parseContent(brief.content, brief.tag);
          // 根据该条速递的赛道归属，直接调取专属视觉色彩主题（红/绿/蓝/金/紫）
          const theme = TRACK_THEMES[brief.track] || TRACK_THEMES.china_domestic;

          return (
            <div
              key={brief.id}
              className={`rounded-2xl bg-white border border-l-4 transition-all duration-200 overflow-hidden ${
                theme.borderLeft
              } ${
                isExpanded
                  ? `${theme.cardActiveBorder} shadow-lg ring-4 ${theme.cardActiveRing}`
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-md shadow-sm'
              }`}
            >
              <div className="p-5 md:p-6">
                {/* 顶部元数据行：该赛道专属色彩编号徽章、分类药丸、信源、时间、右侧单一精致按钮 */}
                <div className="flex items-center justify-between gap-4 mb-3.5 flex-wrap">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* 彩色编号徽章 */}
                    <span
                      className={`flex items-center justify-center w-7 h-7 rounded-xl text-white text-xs font-black font-mono shadow-sm ${theme.iconBg}`}
                    >
                      0{idx + 1}
                    </span>

                    {/* 赛道彩色药丸 */}
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-lg border ${theme.tagBadge}`}
                    >
                      {parsed.tag || theme.name}
                    </span>

                    <span className="text-[11px] font-bold font-mono tracking-wider text-slate-400 uppercase">
                      {theme.enTag}
                    </span>

                    <span className="text-xs text-slate-600 font-medium px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                      {brief.source}
                    </span>

                    <span className="text-xs font-mono text-slate-400">
                      {brief.time}
                    </span>
                  </div>

                  {/* 右侧唯一的操作按钮，采用该领域专属配色，视觉层次清晰 */}
                  <button
                    onClick={() => toggleExpand(brief.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none border ${
                      isExpanded ? theme.buttonActive : theme.buttonIdle
                    }`}
                  >
                    <span>{isExpanded ? '收起深度小结' : '展开 5W1H 深度小结'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* 标题：通栏大横向空间，自然排版，支持点击 */}
                <div
                  onClick={() => toggleExpand(brief.id)}
                  className="cursor-pointer group mb-3.5"
                >
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 leading-snug tracking-tight group-hover:text-blue-600 transition-colors">
                    {parsed.title}
                  </h3>
                </div>

                {/* 决策与市场传导条：带该领域背景色 */}
                <div
                  className={`flex items-start gap-2 p-3 rounded-xl border ${theme.conclusionBorder} ${theme.conclusionBg} text-xs sm:text-sm text-slate-800 leading-relaxed`}
                >
                  <span className={`font-bold ${theme.conclusionText} flex-shrink-0 flex items-center gap-1`}>
                    <Sparkles className="w-3.5 h-3.5 inline" />
                    决策传导:
                  </span>
                  <span>{brief.transmission}</span>
                </div>

                {/* 展开区域：舒展大气的 5W1H 一段深度小结 */}
                {isExpanded && (
                  <div className="mt-5 pt-5 border-t border-slate-100 animate-in fade-in duration-200">
                    <Summary5W1HView
                      summaryParagraph={brief.summaryParagraph}
                      summary={brief.summary5W1H}
                      title={parsed.title}
                      time={brief.time}
                      source={brief.source}
                    />

                    {brief.sourceUrl && (
                      <div className="flex justify-end pt-2">
                        <a
                          href={brief.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
                        >
                          <span>查看权威电讯原文</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
