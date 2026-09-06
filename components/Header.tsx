'use client';

import React, { useState, useEffect } from 'react';
import { Newspaper, RefreshCw, Copy, Check, Clock, ShieldCheck } from 'lucide-react';
import { FlashBrief } from '@/lib/types';

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  flashBriefs: FlashBrief[];
  lastUpdated: string;
  countdownSeconds: number;
}

export default function Header({
  onRefresh,
  isRefreshing,
  flashBriefs,
  lastUpdated,
  countdownSeconds,
}: HeaderProps) {
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('zh-CN', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}分${s < 10 ? '0' : ''}${s}秒`;
  };

  const handleCopyDigest = async () => {
    if (!flashBriefs || flashBriefs.length === 0) return;
    const dateStr = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });

    const lines = [
      `⚡ 【全球决策情报站 · 今日速递】(${dateStr})`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ...flashBriefs.map((f, i) => `${i + 1}. [${f.tag}] ${f.content}\n   💡 决策传导：${f.transmission}`),
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `覆盖：美股/半导体/俄乌战局/美伊中东/国内金融与安全`,
      `信源：华尔街日报 / 彭博 / 路透 / 财新 / 日经亚洲 / 经济学人`,
    ];

    try {
      await navigator.clipboard.writeText(lines.join('\n\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy digest:', e);
    }
  };

  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-4 lg:px-8 py-3.5 shadow-sm">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* 左侧：品牌与定位 */}
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-slate-900 text-white shadow-sm">
            <Newspaper className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-900">
                全球决策情报终端
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                7x24 全网实时联网直连
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              美股 · 日韩台芯片 · 俄乌美伊战局 · 国内金融与社会治理 · 宏观大势
            </p>
          </div>
        </div>

        {/* 右侧：30分钟定时器与快捷操作 */}
        <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto justify-between md:justify-end text-xs md:text-sm">
          {/* 30分钟倒计时指示器 */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>半小时自动获取: 剩余 <span className="font-mono font-bold text-blue-900">{formatCountdown(countdownSeconds)}</span></span>
          </div>

          {/* 一键复制速递 */}
          <button
            onClick={handleCopyDigest}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-medium transition-colors shadow-sm active:scale-95 cursor-pointer"
            title="将今日核心决策速递复制为微信分享格式"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">已复制速递</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-amber-700" />
                <span>复制今日速递</span>
              </>
            )}
          </button>

          {/* 手动刷新 */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            title="立即检查最新权威信源更新"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? '获取中...' : '立即刷新'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
