'use client';

import React from 'react';
import { NewsItem, TrackId } from '@/lib/types';
import { TRACK_METADATA } from '@/data/seedData';
import NewsCard from './NewsCard';
import { TrendingUp, Cpu, ShieldAlert, Globe, Flame, BookOpen } from 'lucide-react';

interface RegionalTrackProps {
  trackId: TrackId;
  items: NewsItem[];
}

export default function RegionalTrack({ trackId, items }: RegionalTrackProps) {
  const meta = TRACK_METADATA[trackId];

  const getIcon = () => {
    switch (trackId) {
      case 'us_macro':
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      case 'apac_tech':
        return <Cpu className="w-5 h-5 text-emerald-600" />;
      case 'war_conflict':
        return <Flame className="w-5 h-5 text-rose-600" />;
      case 'china_domestic':
        return <ShieldAlert className="w-5 h-5 text-amber-600" />;
      case 'china_policy':
        return <Globe className="w-5 h-5 text-indigo-600" />;
      case 'global_cognition':
        return <BookOpen className="w-5 h-5 text-purple-600" />;
      default:
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="flex flex-col gap-4 mb-10">
      {/* 赛道标题栏 */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 shadow-sm">
            {getIcon()}
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
              {meta?.title || trackId}
            </h3>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              {meta?.tagline}
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          {items.length} 篇精选
        </span>
      </div>

      {/* 新闻列表 */}
      <div className="space-y-6">
        {items.length > 0 ? (
          items.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))
        ) : (
          <div className="p-8 text-center text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
            今日该板块暂无重大异常事件（抗噪音已生效）
          </div>
        )}
      </div>
    </div>
  );
}
