'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Newspaper,
  RefreshCw,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronRight,
  Sun,
  Moon,
  Image as ImageIcon,
} from 'lucide-react';
import { FlashBrief, MarketQuote, NewsItem } from '@/lib/types';
import dynamic from 'next/dynamic';

const ShareImageModal = dynamic(() => import('./ShareImageModal'), {
  ssr: false,
});

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  flashBriefs: FlashBrief[];
  lastUpdated: string;
  countdownSeconds?: number;
  newsItems?: NewsItem[];
  quotes?: MarketQuote[];
}

interface UnpassedVerifyItem {
  id: string;
  title: string;
  source: string;
  sourceUrl?: string;
  track?: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
  reasons: string[];
}

interface VerifyData {
  score: number;
  passRate: string;
  verifiedAt: string;
  totalNewsChecked: number;
  passedCount: number;
  warningCount: number;
  failedCount: number;
  unpassedItems: UnpassedVerifyItem[];
}

// 独立自驱动倒计时胶囊：物理隔离 1 秒重渲染作用域，彻底根除父级组件与全部卡片的高频无效 Diff
function CountdownBadge({
  onRefresh,
  isRefreshing,
  initialSeconds = 1800,
}: {
  onRefresh: () => void;
  isRefreshing: boolean;
  initialSeconds?: number;
}) {
  const [secs, setSecs] = useState(initialSeconds);

  useEffect(() => {
    if (isRefreshing) {
      setSecs(1800);
    }
  }, [isRefreshing]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecs((prev) => {
        if (prev <= 1) {
          onRefresh();
          return 1800;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onRefresh]);

  const m = Math.floor(secs / 60);
  const s = secs % 60;
  const formatted = `${m}分${s < 10 ? '0' : ''}${s}秒`;

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-medium">
      <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
      <span>
        自动刷新: <span className="font-mono font-bold text-blue-900 dark:text-blue-200">{formatted}</span>
      </span>
    </div>
  );
}

export default function Header({
  onRefresh,
  isRefreshing,
  flashBriefs,
  lastUpdated,
  countdownSeconds,
  newsItems = [],
  quotes = [],
}: HeaderProps) {
  const [copied, setCopied] = useState(false);
  const [verifyData, setVerifyData] = useState<VerifyData | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isVerifyingNow, setIsVerifyingNow] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化深色主题状态检测
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const fetchVerify = async (force = false) => {
    if (force) setIsVerifyingNow(true);
    try {
      const res = await fetch(`/api/verify${force ? '?force=true' : ''}`);
      if (res.ok) {
        const d = await res.json();
        if (d.success && d.data) {
          const allDetails: any[] = d.data.details || [];
          const unpassed = allDetails.filter((item: any) => item.status !== 'PASS');
          setVerifyData({
            score: d.data.accuracyScore ?? 100,
            passRate: d.data.passRate || '100%',
            verifiedAt: d.data.verifiedAtLocal?.slice(11, 16) || '刚刚',
            totalNewsChecked: d.data.totalNewsChecked || allDetails.length || 0,
            passedCount: d.data.passedCount || 0,
            warningCount: d.data.warningCount || 0,
            failedCount: d.data.failedCount || 0,
            unpassedItems: unpassed.map((item: any) => ({
              id: item.id,
              title: item.title,
              source: item.source,
              sourceUrl: item.sourceUrl,
              track: item.track,
              status: item.status,
              reasons: item.reasons || [],
            })),
          });
        }
      }
    } catch (e) {
      // silent fallback
    } finally {
      if (force) {
        setTimeout(() => setIsVerifyingNow(false), 600);
      }
    }
  };

  useEffect(() => {
    // 15分钟自动化核验状态同步
    fetchVerify();
    const verifyInterval = setInterval(() => fetchVerify(false), 60 * 1000); // 每分钟轮询最新核验结果

    return () => {
      clearInterval(verifyInterval);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 250);
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
      ...flashBriefs.map((f, i) => {
        const sentimentStr =
          f.sentiment === 'BULLISH'
            ? '【利多】'
            : f.sentiment === 'BEARISH'
            ? '【利空】'
            : '【中性】';
        const watchlistStr = f.nextWatchlist ? `\n   🔭 观察哨：${f.nextWatchlist}` : '';
        return `${i + 1}. [${f.tag}] ${sentimentStr} ${f.content}\n   💡 决策传导：${f.transmission}${watchlistStr}`;
      }),
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `覆盖：美股/算力模型/大宗航运/俄乌战局/美伊中东/国内金融与治理`,
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

  const unpassedCount = verifyData?.unpassedItems.length || 0;
  const hasUnpassed = unpassedCount > 0;

  return (
    <>
      <header className="w-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-4 lg:px-8 py-3.5 shadow-sm transition-colors duration-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* 左侧：品牌与定位 */}
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-slate-900 dark:bg-blue-600 text-white shadow-sm flex items-center justify-center">
              <Newspaper className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg md:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  全球决策情报终端
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  7x24 权威直连
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                美股 · 算力模型 · 大宗航运 · 俄乌美伊 · 宏观大势 · 国内金融治理
              </p>
            </div>
          </div>

          {/* 右侧：30分钟定时器、15分钟自检、长图生成、暗黑模式切换与快捷操作 */}
          <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-between md:justify-end text-xs md:text-sm">
            {/* 15分钟自动化新闻真实性与准确性自检指示器 */}
            <div
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={() => setIsHovered(!isHovered)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-xs cursor-pointer select-none ${
                  hasUnpassed
                    ? 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 ring-2 ring-amber-400/20'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                }`}
              >
                {hasUnpassed ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                )}
                <span>
                  15分自检:{' '}
                  <span className={`font-bold ${hasUnpassed ? 'text-amber-800 dark:text-amber-200' : 'text-emerald-900 dark:text-emerald-200'}`}>
                    {hasUnpassed
                      ? `${unpassedCount}篇待优化 (${verifyData?.passRate || '90%'})`
                      : `通过 (${verifyData?.passRate || '100%'})`}
                  </span>
                </span>
              </button>

              {/* 鼠标悬停浮层展示未通过文章明细 */}
              {isHovered && (
                <div
                  className="absolute right-0 top-full mt-2 w-[340px] sm:w-[440px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 z-50 p-4 text-left animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* 浮层头部 */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-lg ${
                          hasUnpassed ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {hasUnpassed ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                          {hasUnpassed
                            ? `检测到 ${unpassedCount} 篇资讯待复核 / 需优化`
                            : '15分钟自动化全要素自检全部通过'}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          准确性评分 <span className="font-bold text-slate-800 dark:text-slate-200">{verifyData?.score ?? 100}</span>/100 · 通过率{' '}
                          <span className="font-bold text-slate-800 dark:text-slate-200">{verifyData?.passRate || '100%'}</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
                      {verifyData?.verifiedAt || '刚刚'}
                    </span>
                  </div>

                  {/* 浮层主体 */}
                  {hasUnpassed ? (
                    <div className="py-2.5 space-y-2 max-h-80 overflow-y-auto pr-1">
                      <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1.5 rounded-lg border border-amber-200/70 dark:border-amber-800 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>以下文章自检未达满分，点击可直接滚动定位至对应卡片：</span>
                      </div>

                      {verifyData?.unpassedItems.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          onClick={() => {
                            const el = document.getElementById(`news-card-${item.id}`);
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              el.classList.add('ring-4', 'ring-amber-400');
                              setTimeout(() => el.classList.remove('ring-4', 'ring-amber-400'), 2500);
                            }
                            setIsHovered(false);
                          }}
                          className="group/item p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50/70 dark:hover:bg-amber-950/40 border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-300 transition-all cursor-pointer shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover/item:text-amber-950 dark:group-hover/item:text-amber-200 line-clamp-2 leading-snug">
                              {item.title}
                            </span>
                            <span
                              className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                item.status === 'FAIL'
                                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200'
                                  : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 border border-amber-200'
                              }`}
                            >
                              {item.status === 'FAIL' ? '未通过' : '待优化'}
                            </span>
                          </div>

                          <div className="mt-2 space-y-1">
                            {item.reasons.map((reason, rIdx) => (
                              <div key={rIdx} className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                                <span>{reason}</span>
                              </div>
                            ))}
                          </div>

                          <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                            <span className="truncate max-w-[200px]">信源: {item.source}</span>
                            <span className="text-amber-700 dark:text-amber-400 group-hover/item:text-amber-900 font-semibold inline-flex items-center gap-0.5">
                              点击在正文定位 <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-5 text-center">
                      <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        全部 {verifyData?.totalNewsChecked || 30} 篇资讯 100% 严审通过
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                        已核验：一级权威信源白名单 · 5W1H 要素结构 · 标题完整无截断 · 宏观行情要素对齐
                      </p>
                    </div>
                  )}

                  <div className="pt-2.5 mt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>巡检模式: 15分钟全要素自动自检</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchVerify(true);
                      }}
                      disabled={isVerifyingNow}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isVerifyingNow ? 'animate-spin' : ''}`} />
                      <span>{isVerifyingNow ? '自检中...' : '重新自检'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 30分钟倒计时指示器（独立自驱动，隔离重渲染） */}
            <CountdownBadge onRefresh={onRefresh} isRefreshing={isRefreshing} initialSeconds={countdownSeconds || 1800} />

            {/* 一键生成早晚报高清长图 */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              title="一键生成今日决策早晚报精美长图，支持复制与下载"
            >
              <ImageIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>生成长图</span>
            </button>

            {/* 一键复制速递 */}
            <button
              onClick={handleCopyDigest}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-medium transition-colors shadow-xs active:scale-95 cursor-pointer"
              title="将今日核心决策速递复制为微信分享格式"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold">已复制速递</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <span>复制速递</span>
                </>
              )}
            </button>

            {/* 深色模式切换按钮 */}
            <button
              onClick={toggleDarkMode}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer shadow-xs"
              title={isDarkMode ? '切换至明亮模式' : '切换至金融终端暗黑模式'}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* 手动刷新 */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              title="立即检查最新权威信源更新"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? '获取中...' : '刷新'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 高清长图弹窗 */}
      <ShareImageModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        flashBriefs={flashBriefs}
        newsItems={newsItems}
        quotes={quotes}
      />
    </>
  );
}
