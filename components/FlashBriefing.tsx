'use client';

import React, { useState } from 'react';
import { FlashBrief } from '@/lib/types';
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

  const getTagStyle = (tag: string) => {
    if (tag.includes('俄乌') || tag.includes('美伊') || tag.includes('防务') || tag.includes('战局')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (tag.includes('国内') || tag.includes('治理') || tag.includes('暴雷')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    if (tag.includes('美联储') || tag.includes('美股') || tag.includes('宏观')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (tag.includes('芯片') || tag.includes('算力') || tag.includes('半导体')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  };

  // 智能分离方括号标签与正文标题，消除文字换行折断问题
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
          <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-sm flex items-center justify-center">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                今日决策速递
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                5大宏观决定性事件
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              全景梳理今日决定性大事件 · 宽屏通透阅读 · 点击任意要闻展开 5W1H 深度事实叙事小结
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 bg-slate-100 border border-slate-200 font-medium px-3 py-1.5 rounded-xl">
            💡 点击标题或右侧按钮展开 5W1H 小结
          </span>
        </div>
      </div>

      {/* 5条速递列表：采用通栏宽屏层叠卡片，彻底解决挤在一起的拥挤感 */}
      <div className="space-y-4 md:space-y-5">
        {briefs.slice(0, 5).map((brief, idx) => {
          const isExpanded = !!expandedMap[brief.id];
          const parsed = parseContent(brief.content, brief.tag);

          return (
            <div
              key={brief.id}
              className={`rounded-2xl bg-white border transition-all duration-200 overflow-hidden ${
                isExpanded
                  ? 'border-2 border-amber-500 shadow-lg ring-4 ring-amber-500/10'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-md shadow-sm'
              }`}
            >
              <div className="p-5 md:p-6">
                {/* 顶部元数据行：编号徽章、分类药丸、信源、时间、右侧单一精致按钮 */}
                <div className="flex items-center justify-between gap-4 mb-3.5 flex-wrap">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-amber-500 text-white text-xs font-black font-mono shadow-sm">
                      0{idx + 1}
                    </span>

                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-lg border ${getTagStyle(
                        parsed.tag
                      )}`}
                    >
                      {parsed.tag}
                    </span>

                    <span className="text-xs text-slate-600 font-medium px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                      {brief.source}
                    </span>

                    <span className="text-xs font-mono text-slate-400">
                      {brief.time}
                    </span>
                  </div>

                  {/* 右侧唯一的操作按钮，拒绝多按钮杂乱堆叠 */}
                  <button
                    onClick={() => toggleExpand(brief.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none border ${
                      isExpanded
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border-slate-200 hover:border-amber-200'
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

                {/* 标题：通栏大横向空间，字号适中，行距自然，无生硬折行 */}
                <div
                  onClick={() => toggleExpand(brief.id)}
                  className="cursor-pointer group mb-3.5"
                >
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 leading-snug tracking-tight group-hover:text-amber-700 transition-colors">
                    {parsed.title}
                  </h3>
                </div>

                {/* 决策与市场传导轻条 */}
                <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <span className="font-bold text-amber-800 flex-shrink-0 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 inline" />
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
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3.5 py-1.5 rounded-lg border border-blue-200 transition-colors"
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
