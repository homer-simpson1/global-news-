'use client';

import React from 'react';
import { DisasterTracker } from '@/lib/types';
import { ShieldAlert, ArrowRight, Activity, MapPin, Calendar, Clock } from 'lucide-react';

interface OngoingDisasterBannerProps {
  trackers: DisasterTracker[];
  onScrollToCard?: (cardId: string) => void;
}

export default function OngoingDisasterBanner({ trackers, onScrollToCard }: OngoingDisasterBannerProps) {
  if (!trackers || trackers.length === 0) return null;

  const handleJump = (trackerId: string) => {
    // 寻找页面中包含吉隆口岸的卡片并平滑滚动定位
    const el = document.getElementById('news-card-GID-JILONG-PORT-DISASTER') || document.querySelector('[id^="news-card-"]');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-rose-500');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-rose-500');
      }, 2500);
    }
  };

  return (
    <section className="mb-8 rounded-2xl border-2 border-rose-500/70 bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 text-white shadow-xl overflow-hidden animate-in fade-in duration-200">
      <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* 左侧：报警标头与事件核心摘要 */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-lg flex-shrink-0 animate-pulse mt-0.5 sm:mt-0">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-black px-2.5 py-0.5 rounded bg-rose-600 text-white tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                特大灾害 · 全生命周期追踪
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-amber-300 border border-amber-300/30">
                已持续追踪 14 天 · 动态未结案
              </span>
              <span className="text-xs text-slate-300 hidden sm:inline">
                以全面恢复通关及善后结案为终结哨点
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2 flex-wrap">
              <span>{trackers[0].disasterName}</span>
              <span className="text-xs font-normal text-rose-300 bg-rose-900/60 px-2.5 py-0.5 rounded-full border border-rose-700/50">
                {trackers[0].stageLabel}
              </span>
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed max-w-4xl">
              {trackers[0].latestUpdateSummary}
            </p>
          </div>
        </div>

        {/* 右侧：快速直达按键与进度指示 */}
        <div className="flex items-center gap-3 self-end lg:self-auto flex-shrink-0">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-xs font-mono font-bold text-amber-300">演进完成度 75%</span>
            <span className="text-[11px] text-slate-400">进行中: 选址防灾论证</span>
          </div>

          <button
            type="button"
            onClick={() => handleJump(trackers[0].id)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs sm:text-sm font-black transition-all shadow-md cursor-pointer border border-rose-400/40"
          >
            <span>直达事件演进脉络</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 底部微小公告提示 */}
      <div className="px-4 py-2 bg-black/40 border-t border-rose-900/40 text-[11px] text-slate-300 flex items-center justify-between flex-wrap gap-2">
        <span className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-rose-400" />
          <span>终端机制保障：重大地质灾害与口岸抢通事件已锁定常驻追踪，每日自动追加最新权威进展，绝不漏抓。</span>
        </span>
        <span className="font-mono text-slate-400">
          始发: {trackers[0].startDate} | 最新: {trackers[0].latestUpdateDate}
        </span>
      </div>
    </section>
  );
}
