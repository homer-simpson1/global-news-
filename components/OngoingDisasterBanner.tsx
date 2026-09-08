'use client';

import React from 'react';
import { DisasterTracker } from '@/lib/types';
import { ShieldAlert, ArrowDown, Activity } from 'lucide-react';

interface OngoingDisasterBannerProps {
  trackers: DisasterTracker[];
  selectedTrack?: string;
  onScrollToCard?: (cardId: string) => void;
}

function OngoingDisasterBanner({ trackers, selectedTrack = 'all', onScrollToCard }: OngoingDisasterBannerProps) {
  const [isManuallyExpanded, setIsManuallyExpanded] = React.useState(false);

  // 专区切换时重置手动展开状态
  React.useEffect(() => {
    setIsManuallyExpanded(false);
  }, [selectedTrack]);

  if (!trackers || trackers.length === 0) return null;

  const tracker = trackers[0];
  const progress = tracker.currentProgressPercent || 75;

  // 在「全部核心专区」或「国内要闻与社会治理」时常驻完整展开态；在美股、算力、大宗、战局等细分专区时默认收缩为精简胶囊
  const isNativeTrack = selectedTrack === 'all' || selectedTrack === 'china_domestic';
  const showFullBanner = isNativeTrack || isManuallyExpanded;

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

  // 细分专区精简胶囊状态：保障细分专区阅读纯粹性
  if (!showFullBanner) {
    return (
      <section className="mb-5 rounded-xl border border-rose-500/40 bg-gradient-to-r from-rose-950/80 via-slate-900/90 to-slate-950/80 text-white shadow-xs px-3.5 py-2 transition-all flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
          <span className="font-bold text-rose-400 flex-shrink-0 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>特大灾害</span>
          </span>
          <span className="text-slate-300 font-medium truncate max-w-[220px] sm:max-w-md">
            {tracker.disasterName} · <span className="text-amber-300 font-mono font-semibold">{tracker.stageLabel} ({progress}%)</span>
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsManuallyExpanded(true)}
            className="text-[11px] font-bold text-rose-300 hover:text-rose-100 underline cursor-pointer"
          >
            展开横幅
          </button>
          <button
            type="button"
            onClick={handleJump}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 active:scale-95 text-white text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
            title="平滑滚动至正文详实全生命周期档案"
          >
            <span>正文档案</span>
            <ArrowDown className="w-3 h-3" />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-4 sm:mb-6 rounded-xl border border-rose-500/60 bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 text-white shadow-md overflow-hidden transition-all">
      {/* 1. 桌面端横幅 (md 以上)：保持左右两端对齐高密度展示 */}
      <div className="hidden md:flex px-4 py-3 items-center justify-between gap-3 min-h-[60px]">
        {/* 左侧：呼吸灯、灾害名称、阶段徽章与追踪天数 */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm animate-pulse">
            <ShieldAlert className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded bg-rose-600 text-white tracking-wider flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              特大灾害常驻
            </span>

            <h3 className="text-sm font-black text-white tracking-tight truncate max-w-md">
              {tracker.disasterName}
            </h3>

            <span className="text-[11px] font-semibold text-rose-300 bg-rose-900/60 px-2 py-0.5 rounded border border-rose-700/50 flex-shrink-0">
              {tracker.stageLabel}
            </span>

            <span className="text-[11px] font-mono text-amber-300 bg-black/40 px-1.5 py-0.5 rounded border border-amber-400/30 flex-shrink-0">
              已追踪 {tracker.trackedDays} 天
            </span>
          </div>
        </div>

        {/* 右侧：紧凑进度条与平滑跳转按钮 */}
        <div className="flex items-center justify-end gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-mono font-bold text-amber-300 leading-none">
                演进 {progress}%
              </span>
              <span className="text-[10px] text-slate-400">
                进行中: 选址论证
              </span>
            </div>
            <div className="w-24 h-2 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleJump}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer border border-rose-400/40 flex-shrink-0"
            title="平滑滚动至正文【国内治理】板块中的详实全生命周期档案"
          >
            <span>正文详实档案</span>
            <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
          </button>

          {!isNativeTrack && isManuallyExpanded && (
            <button
              type="button"
              onClick={() => setIsManuallyExpanded(false)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer border border-slate-700 flex-shrink-0"
            >
              <span>收起</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. 移动端横幅 (md 以下)：两行紧凑布局，锁定高度 60~68px，杜绝大面积空白 */}
      <div className="md:hidden px-3 py-2 flex flex-col justify-center gap-1.5 min-h-[60px] max-h-[68px]">
        {/* 第一行：特大灾害微标 + 标题单行截断 + 进度百分比 */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded bg-rose-600 text-white tracking-wider flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              特大灾害
            </span>
            <h3 className="text-xs font-black text-white truncate">
              {tracker.disasterName}
            </h3>
          </div>
          <span className="text-[11px] font-mono font-bold text-amber-300 flex-shrink-0">
            {progress}%
          </span>
        </div>

        {/* 第二行：满宽进度条 */}
        <div className="w-full h-1.5 rounded-full bg-slate-800 border border-slate-700/60 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 第三行元信息：已追踪天数 + 阶段 + 直达按钮 */}
        <div className="flex items-center justify-between text-[10px] text-slate-300 leading-none">
          <span className="text-slate-400 font-mono">
            已追踪 {tracker.trackedDays} 天 · {tracker.stageLabel}
          </span>
          <button
            type="button"
            onClick={handleJump}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-[10px] font-bold transition-all shadow-xs cursor-pointer border border-rose-400/40"
          >
            <span>正文档案</span>
            <ArrowDown className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default React.memo(OngoingDisasterBanner);
