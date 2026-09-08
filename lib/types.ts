export type TrackId = 
  | 'us_macro' 
  | 'apac_tech' 
  | 'commodities_shipping'
  | 'war_conflict'
  | 'china_domestic'
  | 'china_policy' 
  | 'global_cognition';

export type ImpactLevel = 1 | 2 | 3;

export type MarketSentiment = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export type TimeWindow = 'TODAY' | 'PAST_24H' | 'HISTORIC';

export interface BullBearDivergence {
  bullConsensus: string;  // 多方/共识逻辑（市场主要押注什么）
  bearDivergence: string; // 空方/分歧逻辑（机构担忧什么暗礁）
}

export interface Summary5W1H {
  who: string;          // 核心主体（谁）
  what: string;         // 发生了什么具体事实
  when: string;         // 发生或通报时间
  where: string;        // 发生地点与地理区域
  why: string;          // 为什么发生（起因背景）
  consequence: string;  // 带来什么后果（宏观/市场/政策传导）
}

export type DisasterLifecycleStage =
  | 'IMPACT_OUTBREAK'      // 1. 突发冲击与应急响应
  | 'RESCUE_CLEARING'      // 2. 抢险排险与通道抢通
  | 'DIVERSION_RELIEF'     // 3. 持续搜救与应急分流
  | 'FEASIBILITY_REBUILD'  // 4. 选址防灾与工程重建
  | 'CONCLUDED_RESTORED';  // 5. 正式恢复通关与善后结案

export interface DisasterTimelineNode {
  date: string;            // 例如 "8月26日" 或 "9月3日"
  time?: string;           // 例如 "14:00"
  stage: DisasterLifecycleStage;
  stageName: string;       // 例如 "突发冲击"
  title: string;           // 节点简述
  description: string;     // 节点详细进展与权威通报事实
  isCompleted: boolean;
  isCurrent?: boolean;
}

export interface DisasterTracker {
  id: string;
  disasterName: string;            // 追踪专题名称，例如 "中尼吉隆口岸跨境特大泥石流与通关重建"
  location: string;                // 地点区域
  startDate: string;               // 始发日期，例如 "2026年8月26日"
  trackedDays: number;             // 已持续追踪天数
  currentStage: DisasterLifecycleStage;
  stageLabel: string;              // "阶段 4/5 · 抢险搜救与选址防灾论证"
  currentProgressPercent: number;  // 75%
  status: 'ONGOING' | 'CONCLUDED'; // 持续追踪中 / 已正式结案
  conclusionCondition: string;     // 结案终结哨点，例如 "以吉隆口岸全面恢复通关运营并发布灾害善后结案公报为终结节点"
  timeline: DisasterTimelineNode[];
  latestUpdateDate: string;        // "9月8日"
  latestUpdateSummary: string;     // 最新动态
  nextWatchMilestone: string;      // 下一步观察哨
}

export interface NewsItem {
  id: string;
  track: TrackId;
  title: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  impactLevel: ImpactLevel;
  oneLineTakeaway: string;
  transmissionImpact: string;
  chinaPolicyAngle?: string;
  bulletPoints: string[];
  summaryParagraph?: string; // 遵守 5W1H 原则的一段连贯深度小结
  summary5W1H?: Summary5W1H;
  verificationLevel?: 'CROSS_VERIFIED' | 'OFFICIAL_DECREE' | 'SINGLE_SOURCE_FAST' | 'UNILATERAL_CLAIM';
  verificationBadge?: string;
  crossSourceCount?: number;
  hasClarification?: boolean;
  clarificationNote?: string;
  sentiment?: MarketSentiment;           // 🟢 偏暖利多 / 🔴 承压利空 / ⚪ 观望中性
  nextWatchlist?: string;                // 【后续观察哨】：关键时间窗口与待验证指标
  bullBearDivergence?: BullBearDivergence; // 市场多空博弈分歧焦点
  timeWindow?: 'TODAY' | 'PAST_24H' | 'HISTORIC'; // 归档时间轴
  spilloverCriterion?: string;           // 命中外溢指标名称（监管铁拳/供应链断裂/涉外擦枪/系统性事故）
  isUnilateralClaim?: boolean;           // 是否单方自宣/待验证
  disasterTracker?: DisasterTracker;     // 特大灾害全生命周期持续追踪系统
  isOngoingDisaster?: boolean;           // 是否属于持续追踪特大灾害
}

export interface FlashBrief {
  id: string;
  tag: string;
  track: TrackId;
  content: string;
  transmission: string;
  oneLineTakeaway?: string; // 核心结论与白话透视
  impactLevel: ImpactLevel;
  time: string;
  source: string;
  sourceUrl?: string;
  summaryParagraph?: string; // 遵守 5W1H 原则的一段连贯深度小结
  summary5W1H?: Summary5W1H;
  verificationLevel?: 'CROSS_VERIFIED' | 'OFFICIAL_DECREE' | 'SINGLE_SOURCE_FAST' | 'UNILATERAL_CLAIM';
  verificationBadge?: string;
  crossSourceCount?: number;
  hasClarification?: boolean;
  clarificationNote?: string;
  sentiment?: MarketSentiment;
  nextWatchlist?: string;
  bullBearDivergence?: BullBearDivergence;
  spilloverCriterion?: string;           // 命中外溢指标名称
  isUnilateralClaim?: boolean;           // 是否单方自宣/待验证
}

export interface QuoteVerificationDetail {
  symbol: string;
  name: string;
  primarySource: string;
  primaryPrice: string;
  crossSource: string;
  crossPrice: string;
  diffPercent: string;
  diffAbsolute: string;
  isConsistent: boolean;
  status: 'PASS' | 'TOLERANCE' | 'WARN';
  note?: string;
}

export interface QuotesVerificationSummary {
  totalCount: number;
  passedCount: number;
  passRate: string;
  maxDiffPercent: string;
  channels: string[];
  verifiedAt: string;
  tokenCost: number;
  items: QuoteVerificationDetail[];
}

export interface MarketQuote {
  symbol: string;
  name: string;
  price: string;
  change: string;
  isUp: boolean;
  category: 'US' | 'ASIA' | 'BOND_FX';
  verification?: QuoteVerificationDetail;
}

export interface TrackMetadata {
  id: TrackId;
  title: string;
  tagline: string;
  iconName: string;
  badgeColor: string;
}
