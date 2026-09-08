'use client';

import React, { useState } from 'react';
import { DisasterTracker } from '@/lib/types';
import { ShieldAlert, CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp, Milestone, Compass } from 'lucide-react';

interface DisasterTrackerViewProps {
  tracker: DisasterTracker;
}

const STAGES = [
  { key: 'IMPACT_OUTBREAK', label: '1. 突发冲击', num: '01' },
  { key: 'RESCUE_CLEARING', label: '2. 抢险排险', num: '02' },
  { key: 'DIVERSION_RELIEF', label: '3. 搜救分流', num: '03' },
  { key: 'FEASIBILITY_REBUILD', label: '4. 选址论证', num: '04' },
  { key: 'CONCLUDED_RESTORED', label: '5. 恢复通关', num: '05' },
];

export default function DisasterTrackerView({ tracker }: DisasterTrackerViewProps) {
  const [showFullTimeline, setShowFullTimeline] = useState(true);

  // 当前阶段序号
  const currentStageIndex = STAGES.findIndex((s) => s.key === tracker.currentStage);

  return (
    <div className="mt-4 rounded-2xl border-2 border-rose-300 dark:border-rose-800/80 bg-gradient-to-b from-rose-50/90 via-white to-amber-50/30 dark:from-rose-950/40 dark:via-slate-900 dark:to-amber-950/20 shadow-md overflow-hidden transition-all">
      {/* 顶部标题栏：高危特大灾害持续追踪标头 */}
      <div className="p-4 sm:p-5 border-b border-rose-200 dark:border-rose-900/60 bg-rose-100/70 dark:bg-rose-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md flex-shrink-0 animate-pulse">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-rose-600 text-white tracking-wide">
                特大灾害 · 全程持续追踪
              </span>
              <span className="text-xs font-black font-mono px-2 py-0.5 rounded-md bg-amber-500 text-white">
                已持续追踪 {tracker.trackedDays} 天
              </span>
              <span className="text-xs font-bold text-rose-950 dark:text-rose-200">
                始发于 {tracker.startDate}
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-black text-rose-950 dark:text-rose-100 mt-1">
              {tracker.disasterName}
            </h4>
          </div>
        </div>

        {/* 状态徽章与折叠按钮 */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            <span>{tracker.status === 'ONGOING' ? '未结案 · 动态监控中' : '已结案'}</span>
          </span>

          <button
            type="button"
            onClick={() => setShowFullTimeline(!showFullTimeline)}
            className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <span>{showFullTimeline ? '收起脉络' : '展开脉络'}</span>
            {showFullTimeline ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* 阶段演进阶梯看板 (5-Stage Progress Stepper) */}
        <div className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-rose-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
              <Milestone className="w-4 h-4 text-rose-600" />
              <span>事件生命周期演进阶梯</span>
            </span>
            <span className="font-mono text-rose-700 dark:text-rose-400 font-extrabold">
              当前进行度：{tracker.currentProgressPercent}%
            </span>
          </div>

          {/* 阶梯图标条 */}
          <div className="grid grid-cols-5 gap-1 sm:gap-2 pt-1">
            {STAGES.map((s, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              return (
                <div
                  key={s.key}
                  className={`p-2 rounded-lg text-center transition-all flex flex-col items-center justify-center border ${
                    isCurrent
                      ? 'bg-rose-500 text-white border-rose-600 shadow-sm ring-2 ring-rose-400/50'
                      : isPast
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-center mb-0.5">
                    {isPast ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : isCurrent ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap block">
                    {s.label}
                  </span>
                  <span className="text-[9px] opacity-75 hidden sm:inline">
                    {isCurrent ? '当前节点' : isPast ? '已完成' : '待推进'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 终结哨点判定条件公告框 */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs sm:text-sm text-amber-950 dark:text-amber-200 flex items-start gap-2.5">
          <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold text-amber-900 dark:text-amber-300 mr-1">
              【事件结案终结哨点】：
            </span>
            <span className="font-semibold text-amber-900 dark:text-amber-200">
              {tracker.conclusionCondition}
            </span>
          </div>
        </div>

        {/* 动态时间演进脉络流 (Chronological Incident Timeline) */}
        {showFullTimeline && (
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>📅 事件演进动态时间线（持续递增更新）</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                共 {tracker.timeline.length} 个里程碑节点
              </span>
            </div>

            <div className="relative pl-6 sm:pl-7 border-l-2 border-rose-300 dark:border-rose-800 space-y-3.5 ml-2.5 sm:ml-3">
              {tracker.timeline.map((node, nIdx) => (
                <div key={nIdx} className="relative">
                  {/* 时间线圆形标记 */}
                  <div
                    className={`absolute -left-[31px] sm:-left-[35px] top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      node.isCurrent
                        ? 'bg-rose-600 border-white ring-4 ring-rose-300/80 animate-pulse'
                        : node.isCompleted
                        ? 'bg-emerald-500 border-white'
                        : 'bg-slate-300 border-white'
                    }`}
                  >
                    {node.isCompleted && !node.isCurrent && (
                      <span className="w-1.5 h-1.5 bg-white rounded-full" />
                    )}
                  </div>

                  {/* 节点内容框 */}
                  <div
                    className={`p-3 sm:p-3.5 rounded-xl border transition-all ${
                      node.isCurrent
                        ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 shadow-xs'
                        : node.isCompleted
                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        : 'bg-slate-50/50 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black font-mono text-rose-700 dark:text-rose-400">
                          {node.date}
                        </span>
                        {node.time && (
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {node.time}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            node.isCurrent
                              ? 'bg-rose-600 text-white'
                              : node.isCompleted
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {node.stageName}
                        </span>
                      </div>

                      {node.isCurrent && (
                        <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                          最新推进节点
                        </span>
                      )}
                    </div>

                    <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                      {node.title}
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {node.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 持续追踪保障承诺卡 */}
        <div className="p-3 rounded-xl bg-slate-900 text-slate-200 dark:bg-slate-950 dark:text-slate-300 text-xs leading-relaxed border border-slate-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white">💡 持续更新承诺机制：</span>
            本情报终端已将该事件列入【特大灾害重点持续追踪目录】。在口岸全面恢复正常通关运营、失联人员搜救与地质灾害调查善后彻底闭环前，系统每日半小时抓取轮询将锁定该事件关键词并实时追加里程碑，绝不因时间推移而遗漏！
          </div>
        </div>
      </div>
    </div>
  );
}
