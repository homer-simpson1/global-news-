'use client';

import React, { useState } from 'react';
import { NewsItem } from '@/lib/types';
import { TrackVisualTheme, TRACK_THEMES } from '@/lib/trackThemes';
import { ExternalLink, BookOpen, Sparkles, ChevronDown, ChevronUp, Award, Search, AlertTriangle, ShieldAlert } from 'lucide-react';
import Summary5W1HView from './Summary5W1HView';
import DisasterTrackerView from './DisasterTrackerView';
import { extractSearchKeywords, getSearchUrl } from '@/lib/keywordExtractor';
import { isWithin24Hours, calculateTrackedDays } from '@/lib/timeUtils';

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

  // 1. 核心事实客观叙事通报（直接讲清具体是怎么样的，前因后果与最新进展，彻底消除没头没尾）
  const factParagraph = React.useMemo(() => {
    // A. 优先使用已清洗合规的 summaryParagraph
    if (
      item.summaryParagraph &&
      item.summaryParagraph.length >= 20 &&
      !item.summaryParagraph.includes('使得市场面临现实痛点') &&
      !/：[，,、\s]*。?$/.test(item.summaryParagraph)
    ) {
      return item.summaryParagraph;
    }

    // B. 根据 5W1H 动态拼装连贯叙事闭环
    if (item.summary5W1H) {
      const s = item.summary5W1H;
      const what = (s.what || cleanTitle).replace(/[。！!.]+$/, '');
      let text = `据${item.publishedAt ? `${item.publishedAt}（${item.source}）` : `${item.source}`}电讯，${what}。`;
      if (s.why && s.why.length >= 4 && !/宏观宏图|利益交织|深层动因/.test(s.why)) {
        text += ` 该事项起因于${s.why}。`;
      } else if (/退市.*造假|造假.*退市/.test(cleanTitle)) {
        text += ` 该事项起因于此前监管部门对涉事企业财务造假违规行为通报点名并实施立案稽查与顶格处罚。`;
      }
      if (s.consequence && s.consequence.length >= 4 && !/直接影响相关领域/.test(s.consequence)) {
        text += ` 直接影响方面，${s.consequence}。`;
      } else if (/退市/.test(cleanTitle)) {
        text += ` 直接影响方面，涉案企业将依法进入退市出清程序并被终止上市。`;
      }
      return text;
    }

    // C. 提取首条备查纪要
    if (item.bulletPoints && item.bulletPoints.length > 0 && item.bulletPoints[0].length >= 15) {
      return item.bulletPoints[0];
    }

    return `据${item.source}通报：${cleanTitle}。涉事机构与监管部门正依法依规推进后续处置与风险应对。`;
  }, [item.summaryParagraph, item.summary5W1H, item.bulletPoints, cleanTitle, item.publishedAt, item.source]);

  // 2. 核心结论安全容灾（防止出现 "【重大治理现实透视】：，使得市场面临现实痛点：。" 等旧缓存残句）
  const displayTakeaway = React.useMemo(() => {
    let t = (item.oneLineTakeaway || '').trim();
    if (
      !t ||
      t.length < 12 ||
      t.includes('使得市场面临现实痛点') ||
      /【.*?】[：:]*\s*$/.test(t) ||
      /【.*?】[：:]*[，,、。.\s]+$/.test(t) ||
      /：[，,、\s]*。?$/.test(t) ||
      t === '【重大治理现实透视】。' ||
      t === '【商业现实透视】。'
    ) {
      if (/退市.*造假|造假.*退市/.test(cleanTitle)) {
        return `【监管合规与强制退市出清】：${cleanTitle}，标志着监管对重大财务造假零容忍常态化执行，劣质标的依法加速出清。`;
      }
      return `【重大治理现实透视】：${cleanTitle}，相关责任主体正推进后续处置与合规应对。`;
    }
    return t;
  }, [item.oneLineTakeaway, cleanTitle]);

  const cardRef = React.useRef<HTMLDivElement>(null);
  const [isNavHighlighted, setIsNavHighlighted] = React.useState(false);
  const highlightTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // 跨组件导航与卡片自动展开监听 (自检弹窗/全站直达触发)
  React.useEffect(() => {
    const handleExpandCard = (e: Event) => {
      const ce = e as CustomEvent<{ id?: string; cardId?: string }>;
      const targetId = ce.detail?.id || ce.detail?.cardId;
      if (targetId && targetId === item.id) {
        setExpanded(true);
        setIsNavHighlighted(true);
        if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = setTimeout(() => {
          setIsNavHighlighted(false);
        }, 3000);

        requestAnimationFrame(() => {
          if (cardRef.current) {
            cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
      }
    };

    window.addEventListener('git-expand-card', handleExpandCard);
    window.addEventListener('git-navigate-to-card', handleExpandCard);
    return () => {
      window.removeEventListener('git-expand-card', handleExpandCard);
      window.removeEventListener('git-navigate-to-card', handleExpandCard);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, [item.id]);

  React.useEffect(() => {
    if (!expanded) return;

    // 1. 键盘 ESC 捕获优先监听
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' ||
        e.key === 'Esc' ||
        e.code === 'Escape' ||
        e.keyCode === 27 ||
        e.which === 27
      ) {
        e.preventDefault();
        e.stopPropagation();
        setExpanded(false);
      }
    };

    // 2. 点击空白处自动收起（Click Outside）
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keydown', handleKeyDown, true);

    const clickTimer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 80);

    return () => {
      clearTimeout(clickTimer);
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [expanded]);

  return (
    <div
      ref={cardRef}
      id={`news-card-${item.id}`}
      data-disaster-card={item.isOngoingDisaster || item.disasterTracker || item.id === 'GID-JILONG-PORT-DISASTER' ? 'true' : undefined}
      className={`scroll-mt-32 content-visibility-auto card-layout-isolate relative rounded-2xl transition-all duration-300 overflow-hidden border-l-8 ${theme.borderLeft} ${theme.cardBg} dark:bg-slate-900 dark:border-slate-800 border ${theme.cardBorder} ${
        isLead ? 'shadow-md ring-1 ring-black/5 dark:ring-white/10' : 'hover:shadow-md shadow-sm'
      } ${
        isNavHighlighted
          ? 'ring-4 ring-amber-400 dark:ring-amber-400 shadow-2xl scale-[1.006]'
          : expanded
          ? `${theme.cardActiveBorder} shadow-xl ring-4 ${theme.cardActiveRing}`
          : ''
      }`}
    >
      {/* 特大灾害全生命周期绝对锚点，保证任何渠道跳转均精准命中此卡片 */}
      {(item.isOngoingDisaster || item.disasterTracker || item.id === 'GID-JILONG-PORT-DISASTER') && (
        <>
          <span id="disaster-full-lifecycle-card" className="absolute -top-28 pointer-events-none" />
          <span id="news-card-GID-JILONG-PORT-DISASTER" className="absolute -top-28 pointer-events-none" />
          <span id="news-card-TRK-GYIRONG-PORT-2026" className="absolute -top-28 pointer-events-none" />
        </>
      )}
      <div className="p-4 sm:p-5 md:p-6">
        {/* 顶部元数据行：分类标签、信源、时间、头条徽章、右侧一键查错与展开按钮 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 mb-3.5">
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
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
            ) : isWithin24Hours(item.publishedAt, item.timeWindow) ? (
              <span className="inline-flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 border border-amber-500 shadow-xs" title="24小时内一手电讯直发">
                ⚡ 一手速递
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700" title="超过24小时发布窗口，持续重点追踪">
                {item.impactLevel === 1 ? '🔍 重点追踪' : '📌 持续发酵'}
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
            {item.disasterTracker && (() => {
              const displayTrackedDays = calculateTrackedDays(item.disasterTracker.startDate) || item.disasterTracker.trackedDays || 1;
              return (
                <span className="inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-0.5 rounded-md bg-rose-600 text-white shadow-xs animate-pulse" title={`始发于 ${item.disasterTracker.startDate}，已连续追踪 ${displayTrackedDays} 天，直到恢复通关正式结案`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>持续追踪 · 第 {displayTrackedDays} 天</span>
                </span>
              );
            })()}

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

          {/* 右侧操作区：一键搜索查错与展开深度小结按钮（规范拇指安全热区 >= 36px 即 h-9） */}
          <div className="flex items-center gap-2 justify-end sm:justify-start flex-shrink-0 w-full sm:w-auto">
            <a
              href={bingSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`提取核心实体词在必应搜索核实: "${keywords}"`}
              className="h-9 min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-slate-800 hover:bg-blue-50/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-blue-300 shadow-xs transition-all cursor-pointer select-none active:scale-95"
            >
              <Search className="w-3.5 h-3.5 text-blue-500" />
              <span>实体查错</span>
            </a>

            <button
              onClick={() => setExpanded(!expanded)}
              className={`h-9 min-h-[36px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none border active:scale-95 ${
                expanded ? theme.buttonActive : theme.buttonIdle
              }`}
            >
              <span>{expanded ? '收起透视' : '展开深度透视'}</span>
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

        {/* 事件客观事实通报：完整交代事情来龙去脉（具体谁、做了什么、起因背景与当前进展），彻底消除没头没尾 */}
        <div className="mb-3.5 p-3.5 md:p-4 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 text-sm md:text-base leading-relaxed shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>事件核心事实通报</span>
          </div>
          <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-normal text-justify">
            {factParagraph}
          </p>
        </div>

        {/* 核心结论与深度归因：写出底层投研定性与本质逻辑 */}
        <div className="space-y-2.5">
          <div
            className={`p-3.5 md:p-4 rounded-xl border-l-4 ${theme.conclusionBorder} ${theme.conclusionBg} dark:bg-slate-800/80 dark:border-l-blue-500 text-sm md:text-base leading-relaxed shadow-xs`}
          >
            <div className={`flex items-center gap-1.5 text-xs font-extrabold ${theme.conclusionText} dark:text-blue-400 mb-1.5`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>核心结论 · 底层动因与本质归纳</span>
            </div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{displayTakeaway}</p>
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
              onClose={() => setExpanded(false)}
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

            {/* 读毕底部一键收起透视按钮 (读至底部直接收起，无需把鼠标滑回顶部，快捷键: Esc) */}
            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-center sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setExpanded(false);
                  const el = document.getElementById(`news-card-${item.id}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-2xs transition-all cursor-pointer select-none active:scale-95"
                title="阅读完毕，收起本篇详细内容并平滑归位 (快捷键: Esc)"
              >
                <ChevronUp className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span>收起本篇详细阅读 · 完成阅读</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(NewsCard);
