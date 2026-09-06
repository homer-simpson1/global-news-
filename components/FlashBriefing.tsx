'use client';

import React from 'react';
import { FlashBrief } from '@/lib/types';
import { Zap } from 'lucide-react';

interface FlashBriefingProps {
  briefs: FlashBrief[];
}

export default function FlashBriefing({ briefs }: FlashBriefingProps) {
  if (!briefs || briefs.length === 0) return null;

  const getTagStyle = (tag: string) => {
    if (tag.includes('俄乌') || tag.includes('美伊')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (tag.includes('国内') || tag.includes('安全') || tag.includes('暴雷')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    if (tag.includes('美联储') || tag.includes('美股')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (tag.includes('芯片') || tag.includes('台韩')) {
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
              直击今日决定性大事件 · 直连股市、汇率、大宗与社会决策传导
            </p>
          </div>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          3分钟读完核心传导
        </span>
      </div>

      {/* 5条速递列表：清爽白底卡片、黑字大排版 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {briefs.slice(0, 5).map((brief, idx) => (
          <div
            key={brief.id}
            className={`flex flex-col justify-between rounded-2xl bg-white border border-slate-200 hover:border-slate-300 p-5 shadow-sm hover:shadow-md transition-all ${
              idx === 0 ? 'md:col-span-2 lg:col-span-2 bg-gradient-to-br from-white to-amber-50/30' : ''
            }`}
          >
            <div>
              {/* 头部圆点与标签 */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 relative items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                  </span>
                  <span className="text-xs font-bold font-mono text-slate-700">
                    要闻 0{idx + 1}
                  </span>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getTagStyle(
                    brief.tag
                  )}`}
                >
                  {brief.tag}
                </span>
              </div>

              {/* 核心事实：大字号 16px，清晰锐利 */}
              <p className="text-base font-semibold text-slate-900 leading-relaxed mb-4">
                {brief.content}
              </p>
            </div>

            {/* 决策传导框 */}
            <div className="mt-2 pt-3 border-t border-slate-100 bg-slate-50 rounded-xl p-3.5">
              <div className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1.5">
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
        ))}
      </div>
    </section>
  );
}
