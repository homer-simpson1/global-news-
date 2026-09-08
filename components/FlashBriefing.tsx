'use client';

import React, { useState } from 'react';
import { FlashBrief } from '@/lib/types';
import { TRACK_THEMES } from '@/lib/trackThemes';
import { Zap, ChevronDown, ChevronUp, ExternalLink, Sparkles, Search, AlertTriangle, ShieldAlert } from 'lucide-react';
import Summary5W1HView from './Summary5W1HView';
import { extractSearchKeywords, getSearchUrl } from '@/lib/keywordExtractor';
import { isWithin24Hours } from '@/lib/timeUtils';

interface FlashBriefingProps {
  briefs: FlashBrief[];
}

function FlashBriefing({ briefs }: FlashBriefingProps) {
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
      {/* 模块标题栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-slate-900 dark:bg-amber-500 text-white shadow-md flex items-center justify-center">
            <Zap className="w-5 h-5 fill-amber-400 dark:fill-slate-950 text-amber-400 dark:text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                今日决策速递
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-900 dark:bg-blue-600 text-white">
                全球核心事件速览
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
              全景梳理今日关键大事件 · 独立赛道色彩锚点 · 情绪温度定性 · 5W1H 决策传导小结
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold px-3 py-1.5 rounded-xl">
            💡 领域色彩独立区分 · 点击任意卡片查看小结
          </span>
        </div>
      </div>

      {/* 5条速递列表 */}
      <div className="space-y-4 md:space-y-5">
        {briefs.slice(0, 5).map((brief, idx) => {
          const isExpanded = !!expandedMap[brief.id];
          const parsed = parseContent(brief.content, brief.tag);
          const theme = TRACK_THEMES[brief.track] || TRACK_THEMES.china_domestic;
          const keywords = extractSearchKeywords(parsed.title || brief.content, brief.source);
          const bingSearchUrl = getSearchUrl(keywords, 'bing');
          const googleSearchUrl = getSearchUrl(keywords, 'google');
          const baiduSearchUrl = getSearchUrl(keywords, 'baidu');

          return (
            <div
              key={brief.id}
              className={`content-visibility-auto card-layout-isolate rounded-2xl transition-[border-color,box-shadow] duration-150 overflow-hidden border-l-8 ${theme.borderLeft} ${theme.cardBg} dark:bg-slate-900 dark:border-slate-800 border ${theme.cardBorder} ${
                isExpanded
                  ? `${theme.cardActiveBorder} shadow-xl ring-4 ${theme.cardActiveRing}`
                  : 'hover:shadow-md shadow-sm'
              }`}
            >
              <div className="p-5 md:p-6">
                {/* 顶部元数据行 */}
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

                    <span className="text-[11px] font-bold font-mono tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                      {theme.enTag}
                    </span>

                    <span className="text-xs text-slate-600 dark:text-slate-300 font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {brief.source}
                    </span>

                    {/* 多空情绪色彩胶囊 */}
                    {brief.sentiment === 'BULLISH' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>利多 · 偏暖</span>
                      </span>
                    )}
                    {brief.sentiment === 'BEARISH' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-0.5 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        <span>利空 · 承压</span>
                      </span>
                    )}
                    {brief.sentiment === 'NEUTRAL' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span>中性 · 观望</span>
                      </span>
                    )}

                    {/* 多源交叉印证 / 官方通报 / 辟谣警示 / 单方通报·待验证 徽章 */}
                    {brief.verificationLevel === 'UNILATERAL_CLAIM' || brief.isUnilateralClaim ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700" title="凡属单方面自宣的重大突破或单方面非正式辟谣，卡片强制标注【单方通报·待验证】">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>单方通报 · 待验证</span>
                      </span>
                    ) : brief.hasClarification ? (
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                        ⚠️ 官方澄清
                      </span>
                    ) : brief.verificationLevel === 'OFFICIAL_DECREE' ? (
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800" title="国家部委/官方公报直发">
                        🏛️ 官方通报
                      </span>
                    ) : brief.verificationLevel === 'CROSS_VERIFIED' ? (
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800" title={`已在 ${brief.crossSourceCount || 2} 个独立电讯渠道交叉印证`}>
                        ✓ 多源印证 ({brief.crossSourceCount || 2}源)
                      </span>
                    ) : isWithin24Hours(brief.time) ? (
                      <span className="inline-flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded bg-amber-400 text-slate-950 border border-amber-500 shadow-xs" title="24小时内一手电讯直发">
                        ⚡ 一手速递
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700" title="超过24小时发布窗口，持续重点追踪">
                        {brief.impactLevel === 1 ? '🔍 重点追踪' : '📌 持续发酵'}
                      </span>
                    )}

                    {/* 命中通用重大外溢冲击收录标准徽章 */}
                    {brief.spilloverCriterion && (
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-700" title={`命中通用重大外溢冲击指标：${brief.spilloverCriterion}，强制收录`}>
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        <span>{brief.spilloverCriterion}</span>
                      </span>
                    )}

                    <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                      {brief.time}
                    </span>
                  </div>

                  {/* 右侧操作区 */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <a
                      href={bingSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`自动抓取关键词并在必应搜索核实: "${keywords}"`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-slate-800 hover:bg-blue-50/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-blue-300 shadow-xs transition-all cursor-pointer select-none"
                    >
                      <Search className="w-3.5 h-3.5 text-blue-500" />
                      <span>实体查错</span>
                    </a>

                    <button
                      onClick={() => toggleExpand(brief.id)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none border ${
                        isExpanded ? theme.buttonActive : theme.buttonIdle
                      }`}
                    >
                      <span>{isExpanded ? '收起深度透视' : '展开深度透视'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 标题 */}
                <div
                  onClick={() => toggleExpand(brief.id)}
                  className="cursor-pointer group mb-3.5"
                >
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {parsed.title}
                  </h3>
                </div>

                {/* 核心结论 / 底层本质透视 */}
                {brief.oneLineTakeaway && (
                  <div className="mb-2.5 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-xs sm:text-sm text-amber-950 dark:text-amber-200 leading-relaxed flex items-start gap-2">
                    <span className="font-bold text-amber-800 dark:text-amber-300 flex-shrink-0 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 inline text-amber-600 dark:text-amber-400" />
                      核心结论:
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{brief.oneLineTakeaway}</span>
                  </div>
                )}

                {/* 决策与市场传导条 */}
                <div
                  className={`flex items-start gap-2 p-3 rounded-xl border ${theme.conclusionBorder} ${theme.conclusionBg} dark:bg-slate-800/80 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed`}
                >
                  <span className={`font-bold ${theme.conclusionText} dark:text-blue-400 flex-shrink-0 flex items-center gap-1`}>
                    <Sparkles className="w-3.5 h-3.5 inline" />
                    利益链传导:
                  </span>
                  <span>{brief.transmission}</span>
                </div>

                {/* 下一步观察哨 */}
                {brief.nextWatchlist && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-xs text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                    <span className="text-sm select-none">🔭</span>
                    <span className="font-bold text-indigo-900 dark:text-indigo-300 flex-shrink-0">观察哨:</span>
                    <span>{brief.nextWatchlist.replace(/^[【\[]后续观察哨[】\]][：:]\s*/, '')}</span>
                  </div>
                )}

                {/* 展开区域：5W1H 深度小结 */}
                {isExpanded && (
                  <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200 space-y-4">
                    <Summary5W1HView
                      summaryParagraph={brief.summaryParagraph}
                      summary={brief.summary5W1H}
                      title={parsed.title}
                      time={brief.time}
                      source={brief.source}
                      verificationBadge={brief.verificationBadge}
                      hasClarification={brief.hasClarification}
                      clarificationNote={brief.clarificationNote}
                    />

                    {/* 交叉查错与权威出处直达 */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <Search className="w-3.5 h-3.5 text-blue-500" />
                          <span>交叉搜索查错:</span>
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 max-w-[260px] truncate" title={`抓取的核查关键词: ${keywords}`}>
                          {keywords}
                        </span>
                        <div className="inline-flex items-center gap-1.5 ml-1">
                          <a
                            href={bingSearchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="国内直连无障碍（推荐）"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors"
                          >
                            <span>必应 Bing</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <a
                            href={googleSearchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="谷歌全球资讯交叉索引"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                          >
                            <span>谷歌</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <a
                            href={baiduSearchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="百度中文资讯索引"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                          >
                            <span>百度</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      {brief.sourceUrl && (
                        <a
                          href={brief.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors self-end md:self-auto"
                        >
                          <span>查看权威电讯原文</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
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

export default React.memo(FlashBriefing);
