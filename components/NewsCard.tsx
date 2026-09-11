'use client';

import React, { useState } from 'react';
import { NewsItem } from '@/lib/types';
import { TrackVisualTheme, TRACK_THEMES } from '@/lib/trackThemes';
import { ExternalLink, BookOpen, Sparkles, ChevronDown, ChevronUp, Award, Search, AlertTriangle, ShieldAlert, Building2, BarChart3, TrendingDown, TrendingUp, Layers, Activity } from 'lucide-react';
import Summary5W1HView from './Summary5W1HView';
import DisasterTrackerView from './DisasterTrackerView';
import { extractSearchKeywords, getSearchUrl } from '@/lib/keywordExtractor';
import { isWithin24Hours, calculateTrackedDays } from '@/lib/timeUtils';
import { getCompanyProfileForNews, CompanyProfile } from '@/lib/companyProfiles';
import { isHeadlineEcho } from '@/lib/selfHealingEngine';
import {
  getMacroInflationBreakdown,
  isMacroInflationNews,
  getMacroInflationTakeaway,
  getMacroInflationTransmission,
  buildMacroInflationFactParagraph,
  MacroInflationBreakdown,
} from '@/lib/macroInflationEngine';

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

  // 涉事主体/企业背景速览检索 (解答“为什么不简单介绍这家公司”)
  const companyProfile: CompanyProfile | null = React.useMemo(() => {
    return (
      item.companyProfile ||
      getCompanyProfileForNews(cleanTitle, item.summaryParagraph || (item.bulletPoints && item.bulletPoints.join(' ')))
    );
  }, [item.companyProfile, cleanTitle, item.summaryParagraph, item.bulletPoints]);

  // 宏观通胀关键分项矩阵穿透检索 (解决“环比不说、核心/服务/食品分项不说”)
  const macroBreakdown: MacroInflationBreakdown | null = React.useMemo(() => {
    return (
      item.macroInflationBreakdown ||
      getMacroInflationBreakdown(cleanTitle, item.summaryParagraph || (item.bulletPoints && item.bulletPoints.join(' ')), item.track)
    );
  }, [item.macroInflationBreakdown, cleanTitle, item.summaryParagraph, item.bulletPoints, item.track]);

  // 1. 核心事实客观叙事通报（直接讲清具体是怎么样的，前因后果与最新进展，彻底消除没头没尾）
  const factParagraph = React.useMemo(() => {
    // A. 优先使用已清洗合规的 summaryParagraph
    let text = '';
    if (
      item.summaryParagraph &&
      item.summaryParagraph.length >= 20 &&
      !item.summaryParagraph.includes('使得市场面临现实痛点') &&
      !/：[，,、\s]*。?$/.test(item.summaryParagraph)
    ) {
      text = item.summaryParagraph;
    } else if (item.summary5W1H) {
      // B. 根据 5W1H 动态拼装连贯叙事闭环
      const s = item.summary5W1H;
      const what = (s.what || cleanTitle).replace(/[。！!.]+$/, '');
      text = `据${item.publishedAt ? `${item.publishedAt}（${item.source}）` : `${item.source}`}电讯，${what}。`;
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
    } else if (item.bulletPoints && item.bulletPoints.length > 0 && item.bulletPoints[0].length >= 15) {
      // C. 提取首条备查纪要
      text = item.bulletPoints[0];
    } else {
      text = `据${item.source}通报：${cleanTitle}。涉事机构与监管部门正依法依规推进后续处置与风险应对。`;
    }

    // 若属于宏观通胀数据且信息过于单薄缺乏环比/分项，执行事实强化补全
    if (isMacroInflationNews(cleanTitle.toLowerCase()) && (!text.includes('环比') || !text.includes('分项') || (!text.includes('能源') && !text.includes('食品')))) {
      text = buildMacroInflationFactParagraph(cleanTitle, text, item.source, item.publishedAt);
    }

    // 若本卡片未独立展示【涉事主体速览】展位，且事实文本尚未介绍企业背景，无缝融入企业业务定位
    // 若已独立展示【涉事主体速览】展位，则客观事实通报专注叙述5W1H客观事件本身，杜绝上下相邻两栏机械复读
    if (!companyProfile && !macroBreakdown && !text.includes('核心业务概况方面')) {
      const fallbackProfile = getCompanyProfileForNews(cleanTitle, text);
      if (fallbackProfile && !text.includes(fallbackProfile.description.slice(0, 10)) && !text.includes(fallbackProfile.sector)) {
        text += ` 核心业务概况方面，${fallbackProfile.name}系${fallbackProfile.description}`;
      }
    }

    return text;
  }, [item.summaryParagraph, item.summary5W1H, item.bulletPoints, cleanTitle, item.publishedAt, item.source, companyProfile, macroBreakdown]);

  // 2. 核心结论安全容灾（坚决铲除标题机械复读与八股破损）
  const displayTakeaway = React.useMemo(() => {
    let t = (item.oneLineTakeaway || '').trim();
    const cleanT = cleanTitle.toLowerCase();
    const isEcho = isHeadlineEcho(t, cleanTitle);

    if (
      !t ||
      t.length < 12 ||
      isEcho ||
      /涉事主体推进核心战略部署|根据市场信号与制度合规框架重构/.test(t) ||
      t.includes('使得市场面临现实痛点') ||
      /【.*?】[：:]*\s*$/.test(t) ||
      /【.*?】[：:]*[，,、。.\s]+$/.test(t) ||
      /：[，,、\s]*。?$/.test(t) ||
      t === '【重大治理现实透视】。' ||
      t === '【商业现实透视】。' ||
      t === '【AI算力架构演进】。'
    ) {
      if (isMacroInflationNews(cleanT) || /cpi|通胀|ppi|pce/.test(cleanT)) {
        return getMacroInflationTakeaway(cleanTitle, factParagraph);
      }
      if (/上市|ipo|挂牌|首日|开盘涨|市值约|科创板|港交所/.test(cleanT)) {
        const sector = (companyProfile?.sector || '').toLowerCase();
        if (/存储|dram|nand|长鑫|长存|海力士|美光|兆易/.test(cleanT) || /存储|dram|nand/.test(sector)) {
          return '【存储芯片资本重估与扩产】：自主先进制程存储芯片获资本市场流动性赋能，加速高密度DRAM/3D NAND与高带宽内存产线扩产与终端客户导入。';
        }
        if (/晶圆|代工|中芯|华虹|台积电/.test(cleanT) || /晶圆代工/.test(sector)) {
          return '【晶圆代工产能重构与资本支持】：纯晶圆制造龙头依托二级市场融资扩充先进制程与特色工艺晶圆产能，筑牢半导体全产业链硬件制造底座。';
        }
        if (/设备|刻蚀|薄膜|清洗|北方华创|中微|拓荆|盛美|光刻|asml/.test(cleanT) || /设备|装备/.test(sector)) {
          return '【半导体关键设备国产化加速】：核心半导体设备与关键零组件龙头资本化提速，攻坚前道制程卡脖子环节并推动客户产线全流程验证交付。';
        }
        if (/芯片|算力|gpu|半导体|燧原|沐曦|摩尔线程|壁仞|寒武纪|天数智芯|昆仑芯|地平线/.test(cleanT) || /算力|gpu|ai芯片/.test(sector)) {
          return '【国产算力资本化重估】：国产云端AI芯片迎来资本市场高溢价定价，资金高度聚焦自主全栈大模型集群算力底座，加速先进制程流片与商业化交付。';
        }
        if (/新能源|锂电|电池|储能|光伏|宁德时代|比亚迪/.test(cleanT) || /新能源|电池/.test(sector)) {
          return '【绿色能源资本重估】：先进电池与储能龙头登陆资本市场获取高流动性支持，助推产业规模效应释放与全球化出海交付。';
        }
        return '【资本市场定价与流动性溢价】：标的企业完成上市并获二级市场流动性重估，募集资金直接扩充资本实力并加速核心业务扩张交付。';
      }
      if (/利润|营收|反超|财报|业绩|超预期|净利润|毛利率/.test(cleanT)) {
        return '【行业盈利格局重塑】：细分赛道龙头在成本管控、技术溢价与市场份额维度展现分化优势，机构资金向具备确定性现金流韧性的标的集中。';
      }
      if (/退市.*造假|造假.*退市/.test(cleanTitle)) {
        return `【监管合规与强制退市出清】：监管部门对重大财务造假零容忍常态化执行，劣质标的依法加速出清，全面夯实法治监管基石。`;
      }
      if (isMacroInflationNews(cleanT) || /cpi|通胀|ppi|pce/.test(cleanT)) {
        return getMacroInflationTakeaway(cleanTitle, factParagraph);
      }
      return `【产业格局深度透视】：标的主体推进核心业务调整，产业链上下游关联方根据市场供求信号重构资产估值中枢。`;
    }
    return t;
  }, [item.oneLineTakeaway, cleanTitle, companyProfile, factParagraph]);

  // 3. 利益链传导安全容灾（坚决铲除机械式敷衍免责套话与张冠李戴）
  const displayTransmission = React.useMemo(() => {
    let trans = (item.transmissionImpact || '').trim();
    const cleanT = cleanTitle.toLowerCase();
    if (isMacroInflationNews(cleanT) || /cpi|通胀|ppi|pce/.test(cleanT)) {
      if (/短端利率中枢变动直接传导至商业借贷与货币市场融资成本|高杠杆资产面临估值重构|信源仅陈述单一动作/.test(trans) || trans.length < 20) {
        return getMacroInflationTransmission(cleanTitle, factParagraph);
      }
    }
    if (/信源仅陈述单一动作|未披露上下游合同与转嫁细节|不做无依据推测/.test(trans)) {
      const sector = (companyProfile?.sector || '').toLowerCase();

      if (/上市|ipo|挂牌|首日|开盘涨|市值约|科创板|港交所|纳斯达克/.test(cleanT)) {
        if (/存储|dram|nand|长鑫|长存|海力士|美光|兆易/.test(cleanT) || /存储|dram|nand/.test(sector)) {
          return '① 资本运作募集资金直接支持先进制程存储晶圆厂扩产与研发开支 ➔ ② 下游服务器、智能终端与汽车电子客户加速导入国产高密度存储颗粒 ➔ ③ 提升高带宽与主流存储器自主供给自给率与供应链安全。';
        }
        if (/晶圆|代工|中芯|华虹|台积电/.test(cleanT) || /晶圆代工/.test(sector)) {
          return '① 募集资金直接投入先进制程与特色工艺晶圆代生产线建设 ➔ ② 芯片设计厂商获得稳定代工产能保障并压缩新产品流片周期 ➔ ③ 夯实国内集成电路物理微缩制造与自主代工中枢。';
        }
        if (/设备|刻蚀|薄膜|清洗|北方华创|中微|拓荆|盛美|光刻|asml/.test(cleanT) || /设备|装备/.test(sector)) {
          return '① 融资资金直达前道制程装备研发与关键核心零部件自研验证 ➔ ② 境内晶圆制造厂加快对国产刻蚀、薄膜与清洗设备的产线验证与采购 ➔ ③ 半导体上游硬核装备与基础底座国产化率稳步提升。';
        }
        if (/芯片|算力|gpu|半导体|燧原|沐曦|摩尔线程|壁仞|寒武纪|天数智芯|昆仑芯|地平线/.test(cleanT) || /算力|gpu|ai芯片/.test(sector)) {
          return '① IPO募集资金直接支持先进制程芯片研发与流片开支 ➔ ② 下游数据中心与云厂商加大国产算力卡采购与适配验证 ➔ ③ 推动国内AI大模型硬件基础设施供应链生态自主可控。';
        }
        if (/新能源|锂电|光伏|电池|储能|宁德时代|比亚迪/.test(cleanT) || /新能源|电池/.test(sector)) {
          return '① IPO与资本增量注入直接扩充企业先进产能与研发投入 ➔ ② 整车厂与储能运营商获得高质量多元化核心部件供应保障 ➔ ③ 推动绿色新能源产业链降本增效与自主配套。';
        }
        return '① IPO募集资金直接扩充企业资本公积并强化核心研发与运营实力 ➔ ② 产业链上下游合作伙伴增强长协合作信心与协同采购 ➔ ③ 细分赛道龙头竞争壁垒与市场份额进一步稳固。';
      }
      if (/芯片|算力|半导体|晶圆|代工|hbm/.test(cleanT)) {
        return '① 核心芯片技术突破与先进制程供给扩容直接缓解下游采购瓶颈 ➔ ② 云厂商与智能终端加速软硬件协同适配以降低综合运营成本 ➔ ③ 自主可控硬件供应链生态整体成熟度与交付韧性提升。';
      }
      return '① 事件冲击直接影响核心当事方的资产与负债结构 ➔ ② 产业链与合作方依据合同与市场规则传导成本收益 ➔ ③ 边际供求关系与资产风险溢价完成动态重定价。';
    }
    return trans;
  }, [item.transmissionImpact, cleanTitle, companyProfile, factParagraph]);

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

        {/* 涉事主体速览 / 企业核心业务概况（彻底解决“为什么不简单介绍这家公司”核心痛点） */}
        {companyProfile && (
          <div className="mb-3.5 p-3.5 md:p-4 rounded-xl bg-gradient-to-r from-blue-50/95 via-indigo-50/60 to-purple-50/40 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-slate-900 border border-blue-200/90 dark:border-blue-800/60 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-blue-950 dark:text-blue-300 flex items-center gap-1.5 text-xs md:text-sm">
                  <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span>【涉事主体速览 · {companyProfile.name}】</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-bold text-[11px] border border-blue-200 dark:border-blue-800">
                  {companyProfile.sector}
                </span>
              </div>
              {companyProfile.marketRole && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
                  产业链生态定位
                </span>
              )}
            </div>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-xs md:text-sm font-normal">
              {companyProfile.description}
            </p>
            {companyProfile.marketRole && (
              <div className="mt-2 pt-2 border-t border-blue-100/90 dark:border-blue-900/40 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1">
                <span className="font-semibold text-blue-700 dark:text-blue-400 flex-shrink-0">生态定位：</span>
                <span>{companyProfile.marketRole}</span>
              </div>
            )}
          </div>
        )}

        {/* 宏观通胀深度透视 · 核心与总体双环比/双同比与5大分项穿透矩阵（彻底解决“CPI解析太少、环比不说、核心/服务/食品分项不说”痛点） */}
        {macroBreakdown && (
          <div className="mb-3.5 p-3.5 md:p-4 rounded-xl bg-gradient-to-r from-emerald-50/95 via-teal-50/60 to-cyan-50/40 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-slate-900 border border-emerald-200/90 dark:border-emerald-800/60 shadow-xs">
            {/* 顶栏标题与信源时间 */}
            <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-emerald-950 dark:text-emerald-300 flex items-center gap-1.5 text-xs md:text-sm">
                  <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>【宏观通胀关键指标矩阵 · 核心与总体双环比/同比穿透】</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800">
                  {macroBreakdown.period}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                信源：{macroBreakdown.dataSource}
              </span>
            </div>

            {/* 核心数据 4 宫格矩阵（核心同比/环比 + 总体同比/环比，预期与前值差额全面显性化） */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {macroBreakdown.headlineMetrics.map((m, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-800/80 border border-emerald-100 dark:border-emerald-900/40 shadow-2xs"
                >
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mb-0.5">
                    {m.name}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg md:text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                      {m.actual}
                    </span>
                    {m.expected && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        预期 {m.expected}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    前值: {m.prior || '-'} {m.note ? `· ${m.note.slice(0, 10)}` : ''}
                  </div>
                </div>
              ))}
            </div>

            {/* 5大核心分项穿透列表（住房/超级核心/食品/能源/商品） */}
            <div className="space-y-1.5 mb-2.5">
              <div className="text-xs font-bold text-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>关键细分项深度穿透（权重与动能结构拆解）：</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {macroBreakdown.components.map((comp) => (
                  <div
                    key={comp.id}
                    className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-800/50 border border-emerald-100/80 dark:border-emerald-900/30 text-xs"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                        {comp.category === 'SHELTER' && '🏠'}
                        {comp.category === 'SUPERCORE_SERVICES' && '⚡'}
                        {comp.category === 'FOOD' && '🥗'}
                        {comp.category === 'ENERGY' && '⛽'}
                        {comp.category === 'CORE_GOODS' && '🚗'}
                        <span>{comp.name}</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-mono">
                        {comp.weight}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mb-1 text-[11px] font-mono">
                      <span className="text-emerald-800 dark:text-emerald-300 font-bold">
                        读数：{comp.reading}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                        comp.stickiness === 'STICKY' ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' :
                        comp.stickiness === 'VOLATILE' ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300' :
                        'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      }`}>
                        {comp.tagLabel}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                      {comp.analysis}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 美联储货币政策降息概率与资产定价 */}
            {macroBreakdown.fedPolicyImpact && (
              <div className="pt-2 border-t border-emerald-100/90 dark:border-emerald-900/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>9月 FOMC 降息概率定价：</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold font-mono text-[11px]">
                    25 bps (基准): {macroBreakdown.fedPolicyImpact.cutProbability25bps}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                    50 bps (激进): {macroBreakdown.fedPolicyImpact.cutProbability50bps}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  {macroBreakdown.fedPolicyImpact.policyStance}
                </div>
              </div>
            )}
          </div>
        )}
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
            <p className="text-slate-700 dark:text-slate-300">{displayTransmission}</p>
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
              companyProfile={companyProfile || undefined}
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
