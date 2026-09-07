'use client';

import React, { useState } from 'react';
import { NewsItem } from '@/lib/types';
import { TrackVisualTheme, TRACK_THEMES } from '@/lib/trackThemes';
import { ExternalLink, BookOpen, Sparkles, ChevronDown, ChevronUp, Award, Search } from 'lucide-react';
import Summary5W1HView from './Summary5W1HView';
import { extractSearchKeywords, getSearchUrl } from '@/lib/keywordExtractor';

interface NewsCardProps {
  item: NewsItem;
  trackTheme?: TrackVisualTheme;
  isLead?: boolean;
}

export default function NewsCard({ item, trackTheme, isLead = false }: NewsCardProps) {
  const [expanded, setExpanded] = useState(false);
  const theme = trackTheme || TRACK_THEMES[item.track] || TRACK_THEMES.us_macro;

  // 分离方括号分类前缀与纯净标题，防止狭窄折行断裂
  const parseTitle = (rawTitle: string) => {
    const match = rawTitle.match(/^[【\[]([^】\]]+)[】\]]\s*(.*)$/);
    if (match) {
      return {
        tag: match[1].replace(/\/.*$/, '').trim(),
        cleanTitle: match[2].trim(),
      };
    }
    return {
      tag: '',
      cleanTitle: rawTitle.trim(),
    };
  };

  const { tag, cleanTitle } = parseTitle(item.title);
  const keywords = extractSearchKeywords(cleanTitle || item.title, item.source);
  const bingSearchUrl = getSearchUrl(keywords, 'bing');
  const googleSearchUrl = getSearchUrl(keywords, 'google');
  const baiduSearchUrl = getSearchUrl(keywords, 'baidu');

  return (
    <div
      className={`rounded-2xl transition-all duration-200 overflow-hidden border-l-8 ${theme.borderLeft} ${theme.cardBg} border ${theme.cardBorder} ${
        isLead ? 'shadow-md ring-1 ring-black/5' : 'hover:shadow-md shadow-sm'
      } ${
        expanded
          ? `${theme.cardActiveBorder} shadow-xl ring-4 ${theme.cardActiveRing}`
          : ''
      }`}
    >
      <div className="p-5 md:p-6">
        {/* 顶部元数据行：分类标签、信源、时间、头条徽章、右侧一键查错与展开按钮 */}
        <div className="flex items-center justify-between gap-4 mb-3.5 flex-wrap">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* 头条要闻专属标记 */}
            {isLead && (
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-lg ${theme.leadBadge} shadow-sm`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>板块头条</span>
              </span>
            )}

            {tag && (
              <span
                className={`text-xs font-bold px-3 py-1 rounded-lg border ${theme.tagBadge}`}
              >
                {tag}
              </span>
            )}

            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              {item.source}
            </span>

            {/* 多源交叉印证 / 官方通报 / 辟谣警示 徽章 */}
            {item.hasClarification ? (
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                ⚠️ 官方澄清
              </span>
            ) : item.verificationLevel === 'OFFICIAL_DECREE' ? (
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1" title="主权官方部委/央行权威公报">
                🏛️ 官方通报
              </span>
            ) : item.verificationLevel === 'CROSS_VERIFIED' ? (
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1" title={`已在 ${item.crossSourceCount || 2} 个独立电讯渠道交叉印证`}>
                ✓ 多源印证 ({item.crossSourceCount || 2}源)
              </span>
            ) : (
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200" title="实时一手电讯直发">
                ⚡ 一手速递
              </span>
            )}

            <span className="text-xs text-slate-500 font-mono">
              {item.publishedAt}
            </span>

            {item.impactLevel === 1 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                重大关注
              </span>
            )}
          </div>

          {/* 右侧操作区：一键搜索查错与展开深度小结按钮 */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <a
              href={bingSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`自动抓取关键词并在必应搜索核实: "${keywords}"`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-600 bg-white hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 shadow-sm transition-all cursor-pointer select-none"
            >
              <Search className="w-3.5 h-3.5 text-blue-500" />
              <span>一键查错</span>
            </a>

            <button
              onClick={() => setExpanded(!expanded)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none border ${
                expanded ? theme.buttonActive : theme.buttonIdle
              }`}
            >
              <span>{expanded ? '收起深度小结' : '展开 5W1H 深度小结'}</span>
              {expanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* 报道大标题：头条大黑体突出，自然排版，支持点击 */}
        <div
          onClick={() => setExpanded(!expanded)}
          className="cursor-pointer group mb-4"
        >
          <h3
            className={`font-bold text-slate-900 leading-snug tracking-tight transition-colors ${
              isLead
                ? 'text-xl md:text-2xl font-black text-slate-950 group-hover:text-amber-700'
                : 'text-lg md:text-xl group-hover:text-blue-600'
            }`}
          >
            {cleanTitle}
          </h3>
        </div>

        {/* 核心结论与传导：具备呼吸感的通透卡片 */}
        <div className="space-y-2.5">
          <div
            className={`p-3.5 rounded-xl border-l-4 ${theme.conclusionBorder} ${theme.conclusionBg} text-sm md:text-base text-slate-800 leading-relaxed`}
          >
            <div className={`flex items-center gap-1.5 text-xs font-bold ${theme.conclusionText} mb-1`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>核心结论</span>
            </div>
            <p className="font-medium text-slate-900">{item.oneLineTakeaway}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border-l-4 border-slate-400 text-sm md:text-base text-slate-800 leading-relaxed">
            <div className="text-xs font-bold text-slate-700 mb-1">
              🎯 市场投资与战略传导
            </div>
            <p className="text-slate-700">{item.transmissionImpact}</p>
          </div>

          {item.chinaPolicyAngle && (
            <div className="p-3.5 rounded-xl bg-amber-50/60 border-l-4 border-amber-500 text-sm md:text-base text-slate-800 leading-relaxed">
              <div className="text-xs font-bold text-amber-800 mb-1">
                🇨🇳 治理与政策分析
              </div>
              <p className="text-slate-700">{item.chinaPolicyAngle}</p>
            </div>
          )}
        </div>

        {/* 点击展开的 5W1H 深度叙事总结 */}
        {expanded && (
          <div className="mt-5 pt-5 border-t border-slate-200 space-y-4 animate-in fade-in duration-150">
            {/* 5W1H 一段深度小结 */}
            <Summary5W1HView
              summaryParagraph={item.summaryParagraph}
              summary={item.summary5W1H}
              title={cleanTitle}
              time={item.publishedAt}
              source={item.source}
              verificationBadge={item.verificationBadge}
              hasClarification={item.hasClarification}
              clarificationNote={item.clarificationNote}
            />

            {/* 事实细节备查 */}
            <div className="mt-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-slate-700" />
                <span>电讯事实要点纪要</span>
              </div>
              <div className="space-y-2 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                {item.bulletPoints.map((bp, bIdx) => (
                  <div key={bIdx} className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-slate-800 text-[11px] font-bold mt-0.5">
                      {bIdx + 1}
                    </span>
                    <p className="text-xs md:text-sm text-slate-800 leading-relaxed">
                      {bp}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 交叉查错与权威出处直达 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <Search className="w-3.5 h-3.5 text-blue-500" />
                  <span>交叉搜索查错:</span>
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 max-w-[260px] truncate" title={`抓取的核查关键词: ${keywords}`}>
                  {keywords}
                </span>
                <div className="inline-flex items-center gap-1.5 ml-1">
                  <a
                    href={bingSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="国内直连无障碍（推荐）"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                  >
                    <span>必应 Bing</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href={googleSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="谷歌全球资讯交叉索引"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                  >
                    <span>谷歌</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href={baiduSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="百度中文资讯索引"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                  >
                    <span>百度</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-auto">
                <span className="text-xs text-slate-500">
                  出处：{item.source}
                </span>
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs md:text-sm font-semibold shadow-sm transition-colors"
                >
                  <span>阅读报道原文</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
