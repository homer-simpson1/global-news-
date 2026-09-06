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
    if (tag.includes('俄乌') || tag.includes('美伊') || tag.includes('防务')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (tag.includes('国内') || tag.includes('安全') || tag.includes('暴雷')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    if (tag.includes('美联储') || tag.includes('美股')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (tag.includes('芯片') || tag.includes('算力') || tag.includes('台韩')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    return 'bg-purple-50 text-purple-700 border-purple-200';
  };

  return (
    <section className="w-full mb-10">
      {/* 标题栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500 text-white shadow-sm">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              今日决策速递
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                5大宏观核心事件
              </span>
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              直击今日决定性大事件 · 每个标题均可点击查看 5W1H 深度事实小结与决策传导
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200 font-semibold px-2.5 py-1 rounded-full">
            💡 点击任一标题查看 5W1H 小结
          </span>
        </div>
      </div>

      {/* 5条速递列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {briefs.slice(0, 5).map((brief, idx) => {
          const isExpanded = !!expandedMap[brief.id];

          return (
            <div
              key={brief.id}
              className={`flex flex-col justify-between rounded-2xl bg-white border transition-all ${
                isExpanded
                  ? 'border-2 border-amber-500 shadow-lg ring-2 ring-amber-100'
                  : 'border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md'
              } p-5 ${
                idx === 0 && !isExpanded ? 'md:col-span-2 lg:col-span-2 bg-gradient-to-br from-white to-amber-50/20' : ''
              } ${isExpanded ? 'md:col-span-2 lg:col-span-3' : ''}`}
            >
              <div>
                {/* 头部：圆点、要闻编号、标签、交互按钮 */}
                <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 relative items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                    </span>
                    <span className="text-xs font-bold font-mono text-slate-700">
                      要闻 0{idx + 1}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getTagStyle(
                        brief.tag
                      )}`}
                    >
                      {brief.tag}
                    </span>
                  </div>

                  {/* 核心互动按钮（点击展开/收起 5W1H 总结） */}
                  <button
                    onClick={() => toggleExpand(brief.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer select-none border ${
                      isExpanded
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                    }`}
                    title="点击查看5W1H深度小结"
                  >
                    <span>{isExpanded ? '收起 5W1H' : '点击小圆点展开 5W1H'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* 标题：让人一眼看懂发生了什么，全可点击 */}
                <div
                  onClick={() => toggleExpand(brief.id)}
                  className="cursor-pointer group mb-3"
                  title="点击标题展开/收起 5W1H 详细小结"
                >
                  <h3 className="text-base md:text-lg font-bold text-slate-900 leading-snug tracking-tight group-hover:text-amber-700 transition-colors flex items-start justify-between gap-2">
                    <span className="flex-1">{brief.content}</span>
                    <span className="text-[11px] font-medium text-amber-700 bg-amber-50 group-hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">
                      {isExpanded ? '收起 ▴' : '5W1H 小结 ▾'}
                    </span>
                  </h3>
                </div>

                {/* 展开状态下呈现 5W1H 详细小结 */}
                {isExpanded && (
                  <div className="my-4 animate-in fade-in duration-200">
                    <Summary5W1HView
                      summary={brief.summary5W1H}
                      title={brief.content}
                      time={brief.time}
                      source={brief.source}
                    />

                    {brief.sourceUrl && (
                      <div className="flex justify-end pt-1">
                        <a
                          href={brief.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
                        >
                          <span>查看权威原文</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 决策与市场传导底栏 */}
              <div className="mt-2 pt-3 border-t border-slate-100 bg-slate-50 rounded-xl p-3.5">
                <div className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>💡 决策与市场传导:</span>
                </div>
                <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
                  {brief.transmission}
                </p>
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-xs text-slate-600 flex items-center justify-between font-mono">
                  <span>信源: {brief.source}</span>
                  <span>{brief.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
