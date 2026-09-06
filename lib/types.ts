export type TrackId = 
  | 'us_macro' 
  | 'apac_tech' 
  | 'war_conflict'
  | 'china_domestic'
  | 'china_policy' 
  | 'global_cognition';

export type ImpactLevel = 1 | 2 | 3;

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
