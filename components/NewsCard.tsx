'use client';

import React, { useState } from 'react';
import { NewsItem } from '@/lib/types';
import { TrackVisualTheme, TRACK_THEMES } from '@/lib/trackThemes';
import { ExternalLink, BookOpen, Sparkles, ChevronDown, ChevronUp, Award, Search, AlertTriangle, ShieldAlert } from 'lucide-react';
import Summary5W1HView from './Summary5W1HView';
import DisasterTrackerView from './DisasterTrackerView';
import { extractSearchKeywords, getSearchUrl } from '@/lib/keywordExtractor';

interface NewsCardProps {
  item: NewsItem;
  trackTheme?: TrackVisualTheme;
  isLead?: boolean;
}

function NewsCard({ item, trackTheme, isLead = false }: NewsCardProps) {
  const [expanded, setExpanded] = useState(false);
  const theme = trackTheme || TRACK_THEMES[item.track] || TRACK_THEMES.us_macro;

  // 分离方括号分类前缀与纯净标题，防止狭窄折行断裂（使用 useMemo 避免倒计时每秒触发重算）
  const { tag, cleanTitle, keywords, bingSearchUrl, googleSearchUrl, baiduSearchUrl } = React.useMemo(() => {
    let tag = '';
    let cleanTitle = item.title.trim();
    const match = item.title.match(/^[【\[]([^】\]]+)[】\]]\s*(.*)$/);
    if (match) {
      tag = match[1].replace(/\/.*$/, '').trim();
      cleanTitle = match[2].trim();
    }
    const keywords = extractSearchKeywords(cleanTitle || item.title, item.source);
    return {
      tag,
      cleanTitle,
      keywords,
      bingSearchUrl: getSearchUrl(keywords, 'bing'),
      googleSearchUrl: getSearchUrl(keywords, 'google'),
      baiduSearchUrl: getSearchUrl(keywords, 'baidu'),
    };
  }, [item.id, item.title, item.source]);

  return (
    <div
      id={`news-card-${item.id}`}
      className={`content-visibility-auto card-layout-isolate rounded-2xl transition-[border-color,box-shadow] duration-150 overflow-hidden border-l-8 ${theme.borderLeft} ${theme.cardBg} dark:bg-slate-900 dark:border-slate-800 border ${theme.cardBorder} ${
        isLead ? 'shadow-md ring-1 ring-black/5 dark:ring-white/10' : 'hover:shadow-md shadow-sm'
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

            {/* 多源交叉印证 / 官方通报 / 辟谣警示 / 单方通报·待验证 徽章 */}
            {item.verificationLevel === 'UNILATERAL_CLAIM' || item.isUnilateralClaim ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700" title="凡属单方面自宣的重大突破或单方面非正式辟谣，卡片强制标注【单方通报·待验证】">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>单方通报 · 待验证</span>
              </span>
            ) : item.hasClarification ? (
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

            {/* 命中通用重大外溢冲击收录标准徽章 */}
            {item.spilloverCriterion && (
              <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-700" title={`命中通用重大外溢冲击指标：${item.spilloverCriterion}，强制收录`}>
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>{item.spilloverCriterion}</span>
              </span>
            )}

            {/* 特大灾害全生命周期持续追踪徽章 */}
            {item.disasterTracker && (
              <span className="inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-0.5 rounded-md bg-rose-600 text-white shadow-xs animate-pulse" title={`始发于 ${item.disasterTracker.startDate}，已连续追踪 ${item.disasterTracker.trackedDays} 天，直到恢复通关正式结案`}>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>持续追踪 · 第 {item.disasterTracker.trackedDays} 天</span>
              </span>
            )}

            {/* 多空倾向 / 情绪温度色彩标签 */}
            {item.sentiment === 'BULLISH' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-xs" title="事件定性：偏暖扩张 / 市场利多">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>利多 · 偏暖</span>
              </span>
            )}
            {item.sentiment === 'BEARISH' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 shadow-xs" title="事件定性：承压收缩 / 市场利空">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span>利空 · 承压</span>
              </span>
            )}
            {item.sentiment === 'NEUTRAL' && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700" title="事件定性：中性观望">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>中性 · 观望</span>
              </span>
            )}

            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {item.publishedAt}
            </span>

            {item.impactLevel === 1 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
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
              title={`提取核心实体词在必应搜索核实: "${keywords}"`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-slate-800 hover:bg-blue-50/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-blue-300 shadow-xs transition-all cursor-pointer select-none"
            >
              <Search className="w-3.5 h-3.5 text-blue-500" />
              <span>实体查错</span>
            </a>

            <button
              onClick={() => setExpanded(!expanded)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none border ${
                expanded ? theme.buttonActive : theme.buttonIdle
              }`}
            >
              <span>{expanded ? '收起研报细节' : '展开投研视角'}</span>
              {expanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* 报道大标题：主旨提炼式，头条突出，自然排版 */}
        <div
          onClick={() => setExpanded(!expanded)}
          className="cursor-pointer group mb-3.5"
        >
          <h3
            className={`font-bold text-slate-900 dark:text-slate-100 leading-snug tracking-tight transition-colors ${
              isLead
                ? 'text-xl md:text-2xl font-black text-slate-950 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400'
                : 'text-lg md:text-xl group-hover:text-blue-600 dark:group-hover:text-blue-400'
            }`}
          >
            {cleanTitle}
          </h3>
        </div>

        {/* 核心结论与深度归因：严禁复述事实，写出底层原因与本质 */}
        <div className="space-y-2.5">
          <div
            className={`p-3.5 md:p-4 rounded-xl border-l-4 ${theme.conclusionBorder} ${theme.conclusionBg} dark:bg-slate-800/80 dark:border-l-blue-500 text-sm md:text-base leading-relaxed shadow-xs`}
          >
            <div className={`flex items-center gap-1.5 text-xs font-extrabold ${theme.conclusionText} dark:text-blue-400 mb-1.5`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>核心结论 · 底层动因与本质归纳</span>
            </div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{item.oneLineTakeaway}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/50 border-l-4 border-slate-400 dark:border-slate-600 text-sm md:text-base leading-relaxed">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              🎯 市场传导与资产定价
            </div>
            <p className="text-slate-700 dark:text-slate-300">{item.transmissionImpact}</p>
          </div>

          {/* 下一步观察哨（关键时间窗口 / 待验证指标） */}
          {item.nextWatchlist && (
            <div className="p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/90 dark:border-indigo-800/60 text-xs md:text-sm text-indigo-950 dark:text-indigo-200 flex items-start gap-2 shadow-xs">
              <span className="text-base select-none mt-0.5">🔭</span>
              <div>
                <span className="font-extrabold text-indigo-900 dark:text-indigo-300 mr-1">【后续观察哨】：</span>
                <span className="font-medium text-indigo-800 dark:text-indigo-200">{item.nextWatchlist.replace(/^[【\[]后续观察哨[】\]][：:]\s*/, '')}</span>
              </div>
            </div>
          )}

          {/* 市场多空分歧焦点 (Consensus vs Divergence) */}
          {item.bullBearDivergence && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50">
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>多方 · 乐观共识逻辑（押注点）</span>
                </div>
                <p className="text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed font-medium">
                  {item.bullBearDivergence.bullConsensus}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/50">
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-rose-800 dark:text-rose-300 mb-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>空方 · 风险分歧逻辑（担忧点）</span>
                </div>
                <p className="text-xs text-rose-950 dark:text-rose-200 leading-relaxed font-medium">
                  {item.bullBearDivergence.bearDivergence}
                </p>
              </div>
            </div>
          )}

          {item.chinaPolicyAngle && (
            <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border-l-4 border-amber-500 text-sm md:text-base leading-relaxed">
              <div className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">
                🇨🇳 治理与政策视角
              </div>
              <p className="text-slate-700 dark:text-slate-300">{item.chinaPolicyAngle}</p>
            </div>
          )}

          {/* 特大灾害全生命周期持续追踪看板 (五阶阶梯与动态演进时间线) */}
          {item.disasterTracker && (
            <DisasterTrackerView tracker={item.disasterTracker} />
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

export default React.memo(NewsCard);
