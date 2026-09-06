'use client';

import React from 'react';
import { NewsItem, TrackId } from '@/lib/types';
import { TRACK_METADATA } from '@/data/seedData';
import { TRACK_THEMES } from '@/lib/trackThemes';
import NewsCard from './NewsCard';
import { TrendingUp, Cpu, ShieldAlert, Globe, Flame, BookOpen } from 'lucide-react';

interface RegionalTrackProps {
  trackId: TrackId;
  items: NewsItem[];
}

export default function RegionalTrack({ trackId, items }: RegionalTrackProps) {
  const meta = TRACK_METADATA[trackId];
  const theme = TRACK_THEMES[trackId] || TRACK_THEMES.us_macro;

  const getIcon = () => {
    const iconClass = "w-5 h-5 text-white";
    switch (trackId) {
      case 'us_macro':
        return <TrendingUp className={iconClass} />;
      case 'apac_tech':
        return <Cpu className={iconClass} />;
      case 'war_conflict':
        return <Flame className={iconClass} />;
      case 'china_domestic':
        return <ShieldAlert className={iconClass} />;
      case 'china_policy':
        return <Globe className={iconClass} />;
      case 'global_cognition':
        return <BookOpen className={iconClass} />;
      default:
        return <TrendingUp className={iconClass} />;
    }
  };

  return (
    <section className="flex flex-col gap-5 mb-14">
      {/* 赛道专属沉浸标头：每个赛道拥有完全独立的色彩性格与视觉锚点 */}
      <div
        className={`rounded-2xl border ${theme.headerBorder} ${theme.headerBg} p-5 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0 ${theme.iconBg}`}
          >
            {getIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                {meta?.title || theme.name}
              </h3>
              <span className="text-[11px] font-black font-mono tracking-wider uppercase px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 shadow-2xs">
                {theme.enTag}
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-600 mt-1 font-medium">
              {meta?.tagline}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span
            className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border ${theme.tagBadge} shadow-2xs`}
          >
            {items.length} 篇实时深度追踪
          </span>
        </div>
      </div>

      {/* 新闻列表：头条与后续报道轻重有致，打破视觉疲劳 */}
      <div className="space-y-5">
        {items.length > 0 ? (
          items.map((item, index) => (
            <NewsCard
              key={item.id}
              item={item}
              trackTheme={theme}
              isLead={index === 0}
            />
          ))
        ) : (
          <div className="p-10 text-center text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
            今日该板块暂无重大异常事件（智能过滤已生效）
          </div>
        )}
      </div>
    </section>
  );
}
