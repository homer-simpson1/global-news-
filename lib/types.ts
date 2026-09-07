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
  verificationLevel?: 'CROSS_VERIFIED' | 'OFFICIAL_DECREE' | 'SINGLE_SOURCE_FAST';
  verificationBadge?: string;
  crossSourceCount?: number;
  hasClarification?: boolean;
  clarificationNote?: string;
  sentiment?: MarketSentiment;           // 🟢 偏暖利多 / 🔴 承压利空 / ⚪ 观望中性
  nextWatchlist?: string;                // 【后续观察哨】：关键时间窗口与待验证指标
  bullBearDivergence?: BullBearDivergence; // 市场多空博弈分歧焦点
  timeWindow?: 'TODAY' | 'PAST_24H' | 'HISTORIC'; // 归档时间轴
}

export interface FlashBrief {
  id: string;
  tag: string;
  track: TrackId;
  content: string;
  transmission: string;
  impactLevel: ImpactLevel;
  time: string;
  source: string;
  sourceUrl?: string;
  summaryParagraph?: string; // 遵守 5W1H 原则的一段连贯深度小结
  summary5W1H?: Summary5W1H;
  verificationLevel?: 'CROSS_VERIFIED' | 'OFFICIAL_DECREE' | 'SINGLE_SOURCE_FAST';
  verificationBadge?: string;
  crossSourceCount?: number;
  hasClarification?: boolean;
  clarificationNote?: string;
  sentiment?: MarketSentiment;
  nextWatchlist?: string;
  bullBearDivergence?: BullBearDivergence;
}

export interface MarketQuote {
  symbol: string;
  name: string;
  price: string;
  change: string;
  isUp: boolean;
  category: 'US' | 'ASIA' | 'BOND_FX';
}

export interface TrackMetadata {
  id: TrackId;
  title: string;
  tagline: string;
  iconName: string;
  badgeColor: string;
}
