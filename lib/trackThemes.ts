import { TrackId } from './types';

export interface TrackVisualTheme {
  trackId: TrackId;
  name: string;
  enTag: string;
  colorName: string;
  borderLeft: string;
  headerBorder: string;
  headerBg: string;
  iconBg: string;
  iconColor: string;
  tagBadge: string;
  leadBadge: string;
  buttonIdle: string;
  buttonActive: string;
  cardActiveBorder: string;
  cardActiveRing: string;
  conclusionBorder: string;
  conclusionBg: string;
  conclusionText: string;
}

export const TRACK_THEMES: Record<TrackId, TrackVisualTheme> = {
  us_macro: {
    trackId: 'us_macro',
    name: '美股与美元宏观',
    enTag: 'US MACRO & FED',
    colorName: 'blue',
    borderLeft: 'border-l-blue-600',
    headerBorder: 'border-blue-200',
    headerBg: 'bg-gradient-to-r from-blue-50/80 via-blue-50/30 to-white',
    iconBg: 'bg-blue-600 text-white',
    iconColor: 'text-blue-600',
    tagBadge: 'bg-blue-100 text-blue-800 border-blue-200',
    leadBadge: 'bg-blue-600 text-white shadow-blue-500/20',
    buttonIdle: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
    buttonActive: 'bg-blue-600 text-white border-blue-600',
    cardActiveBorder: 'border-blue-500',
    cardActiveRing: 'ring-blue-500/10',
    conclusionBorder: 'border-blue-600',
    conclusionBg: 'bg-blue-50/50',
    conclusionText: 'text-blue-800',
  },
  apac_tech: {
    trackId: 'apac_tech',
    name: '日韩台核心资本与芯片',
    enTag: 'APAC SEMI & AI',
    colorName: 'emerald',
    borderLeft: 'border-l-emerald-600',
    headerBorder: 'border-emerald-200',
    headerBg: 'bg-gradient-to-r from-emerald-50/80 via-emerald-50/30 to-white',
    iconBg: 'bg-emerald-600 text-white',
    iconColor: 'text-emerald-600',
    tagBadge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    leadBadge: 'bg-emerald-600 text-white shadow-emerald-500/20',
    buttonIdle: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200',
    buttonActive: 'bg-emerald-600 text-white border-emerald-600',
    cardActiveBorder: 'border-emerald-500',
    cardActiveRing: 'ring-emerald-500/10',
    conclusionBorder: 'border-emerald-600',
    conclusionBg: 'bg-emerald-50/50',
    conclusionText: 'text-emerald-800',
  },
  war_conflict: {
    trackId: 'war_conflict',
    name: '俄乌局势与美伊中东战局',
    enTag: 'WAR & DEFENSE',
    colorName: 'rose',
    borderLeft: 'border-l-rose-600',
    headerBorder: 'border-rose-200',
    headerBg: 'bg-gradient-to-r from-rose-50/80 via-rose-50/30 to-white',
    iconBg: 'bg-rose-600 text-white',
    iconColor: 'text-rose-600',
    tagBadge: 'bg-rose-100 text-rose-800 border-rose-200',
    leadBadge: 'bg-rose-600 text-white shadow-rose-500/20',
    buttonIdle: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200',
    buttonActive: 'bg-rose-600 text-white border-rose-600',
    cardActiveBorder: 'border-rose-500',
    cardActiveRing: 'ring-rose-500/10',
    conclusionBorder: 'border-rose-600',
    conclusionBg: 'bg-rose-50/50',
    conclusionText: 'text-rose-800',
  },
  china_domestic: {
    trackId: 'china_domestic',
    name: '中国国内要闻与社会治理',
    enTag: 'CHINA DOMESTIC',
    colorName: 'amber',
    borderLeft: 'border-l-amber-500',
    headerBorder: 'border-amber-200',
    headerBg: 'bg-gradient-to-r from-amber-50/80 via-amber-50/30 to-white',
    iconBg: 'bg-amber-600 text-white',
    iconColor: 'text-amber-600',
    tagBadge: 'bg-amber-100 text-amber-900 border-amber-300',
    leadBadge: 'bg-amber-600 text-white shadow-amber-500/20',
    buttonIdle: 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200',
    buttonActive: 'bg-amber-600 text-white border-amber-600',
    cardActiveBorder: 'border-amber-500',
    cardActiveRing: 'ring-amber-500/10',
    conclusionBorder: 'border-amber-500',
    conclusionBg: 'bg-amber-50/50',
    conclusionText: 'text-amber-800',
  },
  china_policy: {
    trackId: 'china_policy',
    name: '发达国家对华举措与博弈',
    enTag: 'GLOBAL DIPLOMACY',
    colorName: 'indigo',
    borderLeft: 'border-l-indigo-600',
    headerBorder: 'border-indigo-200',
    headerBg: 'bg-gradient-to-r from-indigo-50/80 via-indigo-50/30 to-white',
    iconBg: 'bg-indigo-600 text-white',
    iconColor: 'text-indigo-600',
    tagBadge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    leadBadge: 'bg-indigo-600 text-white shadow-indigo-500/20',
    buttonIdle: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200',
    buttonActive: 'bg-indigo-600 text-white border-indigo-600',
    cardActiveBorder: 'border-indigo-500',
    cardActiveRing: 'ring-indigo-500/10',
    conclusionBorder: 'border-indigo-600',
    conclusionBg: 'bg-indigo-50/50',
    conclusionText: 'text-indigo-800',
  },
  global_cognition: {
    trackId: 'global_cognition',
    name: '全球宏观认知与深度要闻',
    enTag: 'THINK TANK INTEL',
    colorName: 'purple',
    borderLeft: 'border-l-purple-600',
    headerBorder: 'border-purple-200',
    headerBg: 'bg-gradient-to-r from-purple-50/80 via-purple-50/30 to-white',
    iconBg: 'bg-purple-600 text-white',
    iconColor: 'text-purple-600',
    tagBadge: 'bg-purple-100 text-purple-800 border-purple-200',
    leadBadge: 'bg-purple-600 text-white shadow-purple-500/20',
    buttonIdle: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200',
    buttonActive: 'bg-purple-600 text-white border-purple-600',
    cardActiveBorder: 'border-purple-500',
    cardActiveRing: 'ring-purple-500/10',
    conclusionBorder: 'border-purple-600',
    conclusionBg: 'bg-purple-50/50',
    conclusionText: 'text-purple-800',
  },
};
