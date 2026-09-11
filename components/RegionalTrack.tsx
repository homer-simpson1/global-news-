'use client';

import React, { useState, useEffect } from 'react';
import { NewsItem, TrackId } from '@/lib/types';
import { TRACK_METADATA } from '@/data/seedData';
import { TRACK_THEMES } from '@/lib/trackThemes';
import NewsCard from './NewsCard';
import { TrendingUp, Cpu, ShieldAlert, Globe, Flame, BookOpen, Anchor, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';

interface RegionalTrackProps {
  trackId: TrackId;
  items: NewsItem[];
}

function RegionalTrack({ trackId, items }: RegionalTrackProps) {
  const [showAll, setShowAll] = useState(false);
  const meta = TRACK_METADATA[trackId];
  const theme = TRACK_THEMES[trackId] || TRACK_THEMES.us_macro;

  // 当导航事件命中专区内排在 5 条后的文章时，自动解锁全量视图 (showAll: true) 确保卡片挂载入 DOM
  useEffect(() => {
    const handleNav = (e: Event) => {
      const ce = e as CustomEvent<{ id?: string; cardId?: string; trackId?: string }>;
      const targetId = ce.detail?.cardId || ce.detail?.id;
      if (!targetId) return;

      const cardExists = items.some((it) => it.id === targetId);
      const isTargetTrack = ce.detail?.trackId === trackId;
      if (cardExists || isTargetTrack) {
        setShowAll(true);
      }
    };

    window.addEventListener('git-navigate-to-card', handleNav);
    window.addEventListener('git-expand-card', handleNav);
    window.addEventListener('git-expand-track-card', handleNav);
    return () => {
      window.removeEventListener('git-navigate-to-card', handleNav);
      window.removeEventListener('git-expand-card', handleNav);
      window.removeEventListener('git-expand-track-card', handleNav);
    };
  }, [items, trackId]);

  const getIcon = () => {
    const iconClass = "w-5 h-5 text-white";
    switch (trackId) {
      case 'us_macro':
        return <TrendingUp className={iconClass} />;
      case 'apac_tech':
        return <Cpu className={iconClass} />;
      case 'commodities_shipping':
        return <Anchor className={iconClass} />;
      case 'war_conflict':
        return <Flame className={iconClass} />;
      case 'china_domestic':
        return <ShieldAlert className={iconClass} />;
      case 'china_policy':
        return <Globe className={iconClass} />;
      case 'china_macro':
        return <BarChart2 className={iconClass} />;
      case 'global_cognition':
        return <BookOpen className={iconClass} />;
      default:
        return <TrendingUp className={iconClass} />;
    }
  };

  // 默认直接呈现前 5 条核心报道，充分保障各板块情报厚度，消除单篇空置感
  const visibleItems = showAll ? items : items.slice(0, 5);

  return (
    <section id={`track-section-${trackId}`} className="flex flex-col gap-5 mb-14 scroll-mt-24">
      {/* 赛道专属权威深色英雄标头：彻底终结千篇一律，建立绝对清晰的视觉锚点 */}
      <div
        className={`rounded-2xl border ${theme.headerBorder} ${theme.headerHeroBg} p-5 md:p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 ${theme.iconBg}`}
          >
            {getIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded bg-white/20 text-white tracking-widest">
                {theme.numStr}
              </span>
              <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
                {meta?.title || theme.name}
              </h3>
              <span className="text-[11px] font-black font-mono tracking-wider uppercase px-2.5 py-0.5 rounded-md bg-white/10 border border-white/20 text-white/90">
                {theme.enTag}
              </span>
            </div>
            <p className="text-xs md:text-sm text-white/80 mt-1.5 font-medium">
              {meta?.tagline}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span
            className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-white/15 border border-white/25 text-white backdrop-blur-sm"
          >
            共 {items.length} 篇深度追踪
          </span>
        </div>
      </div>

      {/* 新闻列表：头条与后续报道轻重有致，打破视觉疲劳 */}
      <div className="space-y-5">
        {visibleItems.length > 0 ? (
          visibleItems.map((item, index) => (
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

        {/* 专区内容展开/收起按钮：仅在文章数大于 5 篇时提供按需折叠 */}
        {items.length > 5 && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => setShowAll(!showAll)}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                showAll
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : `${theme.buttonIdle} shadow-xs`
              }`}
            >
              <span>
                {showAll
                  ? `收起精选视角（已展开全部 ${items.length} 篇）`
                  : `展开查看本专区全部 ${items.length} 篇深度追踪（还有 ${items.length - 5} 篇）`}
              </span>
              {showAll ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default React.memo(RegionalTrack);
