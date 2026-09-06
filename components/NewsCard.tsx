'use client';

import React, { useState } from 'react';
import { NewsItem } from '@/lib/types';
import { ExternalLink, BookOpen, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import Summary5W1HView from './Summary5W1HView';

interface NewsCardProps {
  item: NewsItem;
}

export default function NewsCard({ item }: NewsCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-2xl transition-all duration-200 ${
        expanded
          ? 'bg-white border-2 border-blue-500 shadow-xl ring-2 ring-blue-100'
          : 'bg-white hover:bg-slate-50/60 border border-slate-200 shadow-sm hover:shadow-md'
      }`}
    >
      <div className="p-5 md:p-6">
        {/* 顶部元数据行：信源、时间与核心互动小圆点 */}
        <div className="flex items-center justify-between gap-3 mb-3.5 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            {/* 核心互动小圆点按钮（点击展开/收起 5W1H 详细总结） */}
            <button
              onClick={() => setExpanded(!expanded)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all cursor-pointer select-none ${
                expanded
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
              }`}
              title="点击小圆点展开详细 5W1H 事实总结"
            >
              <span className="relative flex h-3 w-3 items-center justify-center">
                {expanded ? (
                  <span className="h-2 w-2 rounded-full bg-white" />
                ) : (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
                  </>
                )}
              </span>
              <span className="text-xs font-bold">
                {expanded ? '收起 5W1H 详细小结 ▴' : '点击小圆点展开 5W1H 总结 ▾'}
              </span>
            </button>

            {/* 信源标签 */}
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              {item.source}
            </span>

            {/* 发布时间 */}
            <span className="text-xs text-slate-600 font-mono">
              {item.publishedAt}
            </span>
          </div>

          {/* 重大影响标签 */}
          {item.impactLevel === 1 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
              重大关注
            </span>
          )}
        </div>

        {/* 报道大标题：让人一眼看清发生了什么，高对比度黑字，点击展开 5W1H */}
        <div
          onClick={() => setExpanded(!expanded)}
          className="cursor-pointer group mb-4"
          title="点击标题展开/收起 5W1H 详细小结"
        >
          <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-snug tracking-tight group-hover:text-blue-600 transition-colors flex items-start justify-between gap-3">
            <span className="flex-1">{item.title}</span>
            <span className="text-xs text-blue-700 bg-blue-50 group-hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-full flex-shrink-0 mt-0.5 font-semibold">
              {expanded ? '收起 5W1H ▴' : '5W1H 详情 ▾'}
            </span>
          </h3>
        </div>

        {/* 核心结论大卡片：清爽、高可读性 */}
        <div className="mb-3.5 p-4 rounded-xl bg-slate-50 border-l-4 border-blue-600 text-sm md:text-base text-slate-800 leading-relaxed">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>核心结论</span>
          </div>
          <p className="font-medium text-slate-900">{item.oneLineTakeaway}</p>
        </div>

        {/* 决策与市场传导 */}
        <div className="mb-3 p-4 rounded-xl bg-emerald-50/70 border-l-4 border-emerald-600 text-sm md:text-base text-slate-800 leading-relaxed">
          <div className="text-xs font-bold text-emerald-800 mb-1">
            🎯 市场投资与战略传导
          </div>
          <p className="text-slate-700">{item.transmissionImpact}</p>
        </div>

        {/* 对华与社会治理视点（如有） */}
        {item.chinaPolicyAngle && (
          <div className="mb-3 p-4 rounded-xl bg-amber-50/70 border-l-4 border-amber-500 text-sm md:text-base text-slate-800 leading-relaxed">
            <div className="text-xs font-bold text-amber-800 mb-1">
              🇨🇳 治理与政策分析
            </div>
            <p className="text-slate-700">{item.chinaPolicyAngle}</p>
          </div>
        )}

        {/* 点击标题或圆点展开的详细 5W1H 报道事实总结 */}
        {expanded && (
          <div className="mt-5 pt-5 border-t border-slate-200 space-y-4 animate-in fade-in duration-150">
            {/* 核心 5W1H 深度事实小结 */}
            <Summary5W1HView
              summaryParagraph={item.summaryParagraph}
              summary={item.summary5W1H}
              title={item.title}
              time={item.publishedAt}
              source={item.source}
            />

            {/* 3条结构化事实点 */}
            <div className="mt-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>电讯事实细节纪要</span>
              </div>
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                {item.bulletPoints.map((bp, bIdx) => (
                  <div key={bIdx} className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold mt-0.5">
                      {bIdx + 1}
                    </span>
                    <p className="text-xs md:text-sm text-slate-800 leading-relaxed">
                      {bp}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 原文权威出处直达 */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                信源渠道：{item.source} 官方快讯
              </span>
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs md:text-sm font-semibold transition-colors"
              >
                <span>阅读报道原文</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
