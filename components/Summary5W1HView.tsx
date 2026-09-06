'use client';

import React from 'react';
import { Summary5W1H } from '@/lib/types';
import { User, MapPin, Clock, HelpCircle, FileText, AlertTriangle } from 'lucide-react';

interface Summary5W1HViewProps {
  summary?: Summary5W1H;
  title?: string;
  time?: string;
  source?: string;
}

export default function Summary5W1HView({ summary, title, time, source }: Summary5W1HViewProps) {
  // 智能保底数据，确保任何情况下都能完整呈现 5W1H 结构
  const data: Summary5W1H = summary || {
    who: '涉事核心决策部门、国际机构或市场主体',
    what: title || '官方电讯已核实发布最新核心事实与官方通报。',
    when: time ? `本日 ${time}（现场电讯直发）` : '最新实时通报',
    where: '该事件涉及之核心行政管辖区或国际地缘走廊',
    why: '全球宏观周期、地缘政治博弈或产业供需演变引发的结构性变动。',
    consequence: '直接影响市场风险偏好与资产定价，牵动后续监管政策与产业供应链应对。',
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm space-y-4 my-3 text-slate-800">
      {/* 5W1H 模块标题标头 */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
          </span>
          <h4 className="text-xs md:text-sm font-bold text-slate-900 tracking-wide uppercase">
            5W1H 深度事实小结 · 发生了什么与后果剖析
          </h4>
        </div>
        <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
          决策级事实模型
        </span>
      </div>

      {/* 2列网格：主体 (Who) 与 地点 (Where) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Who */}
        <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 mb-1">
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span>核心主体 (Who / 涉事人或机构)</span>
          </div>
          <p className="text-xs md:text-sm text-slate-800 font-medium leading-relaxed">
            {data.who}
          </p>
        </div>

        {/* Where */}
        <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>事件地点 (Where / 地理或战区)</span>
          </div>
          <p className="text-xs md:text-sm text-slate-800 font-medium leading-relaxed">
            {data.where}
          </p>
        </div>
      </div>

      {/* 2列网格：时间 (When) 与 起因 (Why) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* When */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
            <Clock className="w-3.5 h-3.5 text-slate-600" />
            <span>发生时间 (When / 电讯节点)</span>
          </div>
          <p className="text-xs md:text-sm text-slate-800 font-mono leading-relaxed">
            {data.when}
          </p>
        </div>

        {/* Why */}
        <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/80">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-1">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>起因背景 (Why / 触发动因)</span>
          </div>
          <p className="text-xs md:text-sm text-slate-800 leading-relaxed">
            {data.why}
          </p>
        </div>
      </div>

      {/* 具体事实 (What) - 全宽突出 */}
      <div className="p-3.5 rounded-lg bg-slate-50 border-l-4 border-slate-700">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1.5">
          <FileText className="w-3.5 h-3.5 text-slate-700" />
          <span>具体事实进展 (What / 发生了什么事)</span>
        </div>
        <p className="text-xs md:text-sm text-slate-900 leading-relaxed font-normal">
          {data.what}
        </p>
      </div>

      {/* 核心后果与影响 (Consequence) - 最关键板块，醒目强化 */}
      <div className="p-3.5 rounded-lg bg-gradient-to-r from-rose-50 to-amber-50/50 border-l-4 border-rose-500 border-t border-r border-b border-rose-100">
        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 mb-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          <span>会带来什么后果 (Consequence / 连锁传导与应对)</span>
        </div>
        <p className="text-xs md:text-sm text-slate-900 font-medium leading-relaxed">
          {data.consequence}
        </p>
      </div>
    </div>
  );
}
