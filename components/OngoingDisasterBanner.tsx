'use client';

import React from 'react';
import { DisasterTracker } from '@/lib/types';
import { ShieldAlert, ArrowDown, Activity } from 'lucide-react';

interface OngoingDisasterBannerProps {
  trackers: DisasterTracker[];
  onScrollToCard?: (cardId: string) => void;
}

function OngoingDisasterBanner({ trackers, onScrollToCard }: OngoingDisasterBannerProps) {
  if (!trackers || trackers.length === 0) return null;

  const tracker = trackers[0];
  const progress = tracker.currentProgressPercent || 75;

  const handleJump = () => {
    if (onScrollToCard) {
      onScrollToCard(tracker.id);
      return;
    }
    const el = document.getElementById(`news-card-${tracker.id}`) || document.getElementById('news-card-GID-JILONG-PORT-DISASTER');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-rose-500');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-rose-500');
      }, 2500);
    }
  };

  return (
    <section className="mb-6 rounded-xl border border-rose-500/60 bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 text-white shadow-md overflow-hidden transition-all">
      <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 min-h-[64px]">
        {/* 左侧：呼吸灯、灾害名称、阶段徽章与追踪天数 */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm animate-pulse">
            <ShieldAlert className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded bg-rose-600 text-white tracking-wider flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              特大灾害常驻
            </span>

            <h3 className="text-xs sm:text-sm font-black text-white tracking-tight truncate max-w-[280px] sm:max-w-md">
              {tracker.disasterName}
            </h3>

            <span className="text-[11px] font-semibold text-rose-300 bg-rose-900/60 px-2 py-0.5 rounded border border-rose-700/50 hidden sm:inline-flex flex-shrink-0">
              {tracker.stageLabel}
            </span>

            <span className="text-[11px] font-mono text-amber-300 bg-black/40 px-1.5 py-0.5 rounded border border-amber-400/30 hidden md:inline-flex flex-shrink-0">
              已追踪 {tracker.trackedDays} 天
            </span>
          </div>
        </div>

        {/* 右侧：紧凑进度条与平滑跳转按钮 */}
        <div className="flex items-center justify-between md:justify-end gap-3 flex-shrink-0 pt-1 md:pt-0 border-t md:border-t-0 border-rose-900/40">
          {/* 紧凑进度指示器 */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-mono font-bold text-amber-300 leading-none">
                演进 {progress}%
              </span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                进行中: 选址论证
              </span>
            </div>
            <div className="w-16 sm:w-24 h-2 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* 锚定跳转按钮 */}
          <button
            type="button"
            onClick={handleJump}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer border border-rose-400/40 flex-shrink-0"
            title="平滑滚动至正文【国内治理】板块中的详实全生命周期档案"
          >
            <span>正文详实档案</span>
            <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default React.memo(OngoingDisasterBanner);
