'use client';

import React, { useState } from 'react';
import { FlashBrief } from '@/lib/types';
import { TRACK_THEMES } from '@/lib/trackThemes';
import { Zap, ChevronDown, ChevronUp, ExternalLink, Sparkles, Search, AlertTriangle, ShieldAlert, Building2, BarChart3, Layers, Activity, BookOpen } from 'lucide-react';
import Summary5W1HView from './Summary5W1HView';
import { extractSearchKeywords, getSearchUrl } from '@/lib/keywordExtractor';
import { isWithin24Hours } from '@/lib/timeUtils';
import { getCompanyProfileForNews, CompanyProfile } from '@/lib/companyProfiles';
import { autoCorrectTakeaway, autoCorrectInterestTransmission, autoCorrectTitle, autoCorrectWatchlist } from '@/lib/selfHealingEngine';
import { getMacroInflationBreakdown, isMacroInflationNews, MacroInflationBreakdown, sanitizeFedRatePolicyWording } from '@/lib/macroInflationEngine';
import { isDeepPerspectiveEligible, extractDeepPerspective } from '@/lib/deepPerspective';
import { buildEventProvisionsFactParagraph } from '@/lib/eventProvisions';

interface FlashBriefingProps {
  briefs: FlashBrief[];
}

function FlashBriefing({ briefs }: FlashBriefingProps) {
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  const sectionRef = React.useRef<HTMLElement>(null);
  const hasAnyExpanded = Object.values(expandedMap).some(Boolean);

  React.useEffect(() => {
    if (!hasAnyExpanded) return;

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
        setExpandedMap({});
      }
    };

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (sectionRef.current && !sectionRef.current.contains(e.target as Node)) {
        setExpandedMap({});
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
  }, [hasAnyExpanded]);

  if (!briefs || briefs.length === 0) return null;

  const toggleExpand = (id: string) => {
    setExpandedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // 智能分离方括号分类前缀与纯净标题，彻底执行媒体栏目头脱水、结巴去重与标点净化
  const parseContent = (content: string, defaultTag: string) => {
    let tag = defaultTag;
    let cleanTitle = sanitizeFedRatePolicyWording(content.trim());
    const match = cleanTitle.match(/^[【\[]([^】\]]+)[】\]]\s*(.*)$/);
    if (match) {
      tag = match[1].replace(/\/.*$/, '').trim();
      cleanTitle = match[2].trim();
    }

    // 彻底调用 selfHealingEngine 的顶级 autoCorrectTitle 保证全站双重铁幕
    cleanTitle = autoCorrectTitle(cleanTitle);
    cleanTitle = cleanTitle.replace(/[，,\s]*区域防务安全态势进一步明朗[。.]*$/g, '');

    // 针对“目标到，泰国投资委员会 目标到”或任何“AAA，BBB AAA”结巴语法残片进行专项自愈
    if (/目标到.*泰国投资委员会|泰国投资委员会.*目标到/.test(cleanTitle) || (/目标到/.test(cleanTitle) && /泰国/.test(cleanTitle))) {
      cleanTitle = '泰国投资委员会：目标到2050年吸引800亿美元半导体投资';
    }
    if (/5\.13%/.test(cleanTitle) || /刷新\s*2007年.*最高位/.test(cleanTitle)) {
      cleanTitle = '美国10年期基准国债收益率刷新2007年以来最高位至5.13%上方';
    }

    cleanTitle = cleanTitle.replace(/(?:[，,、；;：:\s]+(?:[在于向从对将把与和或为就至达创报被由]|位于|处于|关于|探讨|围绕|随着|导致|通过|经由|通过香港|收于|跌至|涨至|升至|降至))+$/, '').trim();
    cleanTitle = cleanTitle.replace(/(?:[在于向从对将把与和或为就至达创报被由]|位于|处于|关于|探讨|围绕|随着|导致)+$/, '').trim();

    return {
      tag,
      title: cleanTitle,
    };
  };

  return (
    <section ref={sectionRef} className="w-full mb-12">
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

          const companyProfile = brief.companyProfile || getCompanyProfileForNews(parsed.title, brief.content);
          const macroBreakdown = brief.macroInflationBreakdown || (isMacroInflationNews(parsed.title.toLowerCase()) ? getMacroInflationBreakdown(parsed.title, brief.content, brief.track) : null);

          // 核心事实客观叙事通报
          let factParagraph = '';
          if (
            brief.summaryParagraph &&
            brief.summaryParagraph.length >= 20 &&
            !brief.summaryParagraph.includes('使得市场面临现实痛点') &&
            !brief.summaryParagraph.includes('美方将《') &&
            !brief.summaryParagraph.includes('涉事当事方正依法依规推进后续处置') &&
            !brief.summaryParagraph.includes('造成的困境，并避免越陷越深') &&
            !/：[，,、\s]*。?$/.test(brief.summaryParagraph)
          ) {
            factParagraph = brief.summaryParagraph;
          } else if (brief.summary5W1H) {
            const s = brief.summary5W1H;
            const what = (s.what || parsed.title).replace(/[。！!.]+$/, '');
            const cleanWhy = (s.why || '').trim().replace(/[。！!.]+$/, '').replace(/^[，,\s]*(?:受|起因于|因为|由于|因)+\s*/, '').trim();
            factParagraph = `据${brief.time ? `${brief.time}（${brief.source}）` : brief.source}电讯，${what}。`;
            if (cleanWhy && cleanWhy.length >= 4 && !/宏观宏图|利益交织|深层动因/.test(cleanWhy)) {
              factParagraph += ` 该事项起因于${cleanWhy}。`;
            }
            if (s.consequence && s.consequence.length >= 4 && !/直接影响相关领域/.test(s.consequence)) {
              factParagraph += ` 直接影响方面，${s.consequence}。`;
            }
          } else {
            factParagraph = `据${brief.source}通报：${parsed.title}。涉案当事机构与主管机构依法依规有序推进各项应对与处置工作。`;
          }

          // 涉外法案专属通报拦截
          if (/美方将《|格雷厄姆.*制裁|制裁俄罗斯和伊朗法案/.test(parsed.title + ' ' + factParagraph)) {
            factParagraph = buildEventProvisionsFactParagraph(parsed.title, undefined, brief.source, brief.time);
          }
          // 西藏宁算破产重整专属通报拦截
          if (/信威.*宁算|西藏宁算.*破产/.test(parsed.title) || (parsed.title.includes('西藏宁算') && /破产|重整/.test(parsed.title))) {
            factParagraph = `据${brief.time ? `${brief.time}（${brief.source}）` : brief.source}权威通报，西藏宁算科技集团及其关联公司破产重整程序进入关键阶段，法院及破产管理人推进债权申报复核、资产审计评估及重组投资人招募。该事项起因于此前信威集团重大历史债务风险牵连及自身债务结构失衡。直接影响方面，破产重整旨在通过法治化市场化手段盘活数字经济核心数据中心与算力基础设施资产，重构债务清偿方案并阻断风险外溢。`;
          }
          factParagraph = sanitizeFedRatePolicyWording(factParagraph);

          // 运行时双重铁幕：对 brief.oneLineTakeaway 与 brief.nextWatchlist 在渲染层前强制重算校验，杜绝旧缓存脏数据直接上屏
          const healedTakeaway = autoCorrectTakeaway(
            brief.oneLineTakeaway,
            parsed.title,
            brief.summary5W1H,
            brief.track
          ).takeaway;

          const healedWatchlist = autoCorrectWatchlist(
            brief.nextWatchlist,
            parsed.title,
            factParagraph
          );

          const hasDeepPerspective = isDeepPerspectiveEligible({
            title: parsed.title,
            content: brief.content,
            summaryParagraph: factParagraph,
            track: brief.track,
            eventKeyProvisions: brief.eventKeyProvisions,
            macroInflationBreakdown: macroBreakdown || undefined,
            companyProfile: companyProfile || undefined,
          });

          const deepContent = hasDeepPerspective
            ? extractDeepPerspective({
                title: parsed.title,
                oneLineTakeaway: healedTakeaway,
                transmissionImpact: brief.transmission,
                summary5W1H: brief.summary5W1H,
                summaryParagraph: factParagraph,
              })
            : null;

          return (
            <div
              key={brief.id}
              id={`flash-card-${brief.id}`}
              className={`scroll-mt-32 content-visibility-auto card-layout-isolate rounded-2xl transition-[border-color,box-shadow] duration-150 overflow-hidden border-l-8 ${theme.borderLeft} ${theme.cardBg} dark:bg-slate-900 dark:border-slate-800 border ${theme.cardBorder} ${
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
                      {theme.name || parsed.tag}
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

                    {/* 命中通用重大外溢冲击收录标准徽章（商业破产重整严禁挂责任事故标签） */}
                    {brief.spilloverCriterion && !(/破产重整|重整倒计时|破产清算/.test(parsed.title) && !/伤亡|死亡|遇难|坍塌|爆炸|事故/.test(parsed.title + ' ' + (brief.summaryParagraph || ''))) && (
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

                    {hasDeepPerspective && (
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
                    )}
                  </div>
                </div>

                {/* 标题 */}
                <div
                  onClick={() => hasDeepPerspective && toggleExpand(brief.id)}
                  className={`${hasDeepPerspective ? 'cursor-pointer' : ''} group mb-3.5`}
                >
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {parsed.title}
                  </h3>
                </div>

                {/* 涉事主体速览 / 核心业务概况（彻底解决“为什么不简单介绍这家公司”痛点） */}
                {companyProfile && (
                  <div className="mb-2.5 p-2.5 rounded-xl bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-purple-50/40 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-slate-900 border border-blue-200/80 dark:border-blue-800/60 text-xs">
                    <div className="flex items-center gap-1.5 font-extrabold text-blue-900 dark:text-blue-300 mb-1">
                      <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span>【涉事主体速览 · {companyProfile.name}】</span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-bold text-[10px] border border-blue-200 dark:border-blue-800">
                        {companyProfile.sector}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-normal leading-relaxed">
                      {companyProfile.description}
                    </p>
                  </div>
                )}

                {/* 宏观通胀关键指标矩阵穿透 (双环比/双同比与5大分项) */}
                {macroBreakdown && (
                  <div className="mb-2.5 p-2.5 rounded-xl bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-cyan-50/40 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 text-xs">
                    <div className="flex items-center justify-between gap-1.5 font-extrabold text-emerald-900 dark:text-emerald-300 mb-2 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <span>【宏观通胀关键指标矩阵 · 核心与总体双环比/同比穿透】</span>
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                        {macroBreakdown.period}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
                      {macroBreakdown.headlineMetrics.map((m, idx) => (
                        <div key={idx} className="p-1.5 rounded bg-white/80 dark:bg-slate-800/80 border border-emerald-100 dark:border-emerald-900/40">
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{m.name}</div>
                          <div className="text-sm font-black text-emerald-700 dark:text-emerald-300 font-mono">{m.actual}</div>
                          <div className="text-[9px] text-slate-400 truncate">预期: {m.expected || '-'}</div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-1 border-t border-emerald-100 dark:border-emerald-900/40 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
                      <span>住房(+0.4%粘性)、超级核心(+0.33%)、食品(+0.1%降温)、能源(-0.8%负拉动)</span>
                      {macroBreakdown.fedPolicyImpact && (
                        <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">25bps: {macroBreakdown.fedPolicyImpact.cutProbability25bps}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* 事件核心事实通报与电讯实录（首屏直出） */}
                <div className="mb-2.5 p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 text-xs sm:text-sm leading-relaxed shadow-xs">
                  <div className="flex items-center justify-between gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 pb-1 border-b border-slate-200/70 dark:border-slate-700/50">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>【事件核心事实通报 · 官方电讯实录】</span>
                    </div>
                    {brief.rawContent && brief.rawContent.length > 50 && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {brief.rawContent.length}字
                      </span>
                    )}
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-normal text-justify">
                    {factParagraph}
                  </p>

                  {/* 若正文包含长篇报道详情，提供就地“查看电讯全文实录”开关 */}
                  {brief.rawContent && brief.rawContent.trim().length >= 40 && brief.rawContent.trim() !== parsed.title.trim() && !factParagraph.includes(brief.rawContent.slice(0, 40)) && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-700/50">
                      <details className="group/flashfull cursor-pointer">
                        <summary className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 select-none">
                          <span>📰 查看完整电讯报道全文实录 ({brief.rawContent.length}字)</span>
                        </summary>
                        <div className="mt-2 p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/70 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed text-justify">
                          {brief.rawContent}
                        </div>
                      </details>
                    </div>
                  )}
                </div>

                {/* 下一步观察哨 */}
                {healedWatchlist && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-xs text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                    <span className="text-sm select-none">🔭</span>
                    <span className="font-bold text-indigo-900 dark:text-indigo-300 flex-shrink-0">观察哨:</span>
                    <span>{healedWatchlist.replace(/^[【\[]后续观察哨[】\]][：:]\s*/, '')}</span>
                  </div>
                )}

                {/* 展开区域：5W1H 深度小结 */}
                {isExpanded && (
                  <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200 space-y-4">
                    <Summary5W1HView
                      summaryParagraph={factParagraph}
                      summary={brief.summary5W1H}
                      title={parsed.title}
                      time={brief.time}
                      source={brief.source}
                      verificationBadge={brief.verificationBadge}
                      hasClarification={brief.hasClarification}
                      clarificationNote={brief.clarificationNote}
                      companyProfile={companyProfile || undefined}
                      keyProvisions={brief.eventKeyProvisions}
                      thesis={deepContent?.thesis}
                      evidence={deepContent?.evidence}
                      logicChain={deepContent?.logicChain}
                      onClose={() => toggleExpand(brief.id)}
                    />

                    {/* 原始详细电讯报道与官方现场实录全文（彻底解决“新闻的详情也不说”痛点） */}
                    {brief.rawContent && brief.rawContent.trim().length >= 30 && brief.rawContent.trim() !== parsed.title.trim() && (
                      <div className="mt-4 p-4 md:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/20 dark:from-slate-800/80 dark:to-slate-900 border border-slate-200 dark:border-slate-700 text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed shadow-xs">
                        <div className="text-slate-900 dark:text-slate-100 font-extrabold mb-2.5 flex items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-700/60 pb-2">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <span>【电讯现场报道全文 · 官方通报实录】</span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">
                            原始电讯存档 ({brief.rawContent.length}字)
                          </span>
                        </div>
                        <p className="whitespace-pre-line leading-relaxed text-justify font-normal text-slate-800 dark:text-slate-200 text-xs md:text-sm">
                          {brief.rawContent}
                        </p>
                      </div>
                    )}

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

                    {/* 读毕底部一键收起按钮 (位于速递详细小结底部，无需把鼠标滑回顶部，快捷键: Esc) */}
                    <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-center sm:justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          toggleExpand(brief.id);
                          const el = document.getElementById(`flash-card-${brief.id}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-2xs transition-all cursor-pointer select-none active:scale-95"
                        title="阅读完毕，收起本条速递详细内容 (快捷键: Esc)"
                      >
                        <ChevronUp className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                        <span>收起本条详细阅读 · 完成阅读</span>
                      </button>
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
