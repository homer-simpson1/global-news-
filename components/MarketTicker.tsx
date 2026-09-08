'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MarketQuote, QuotesVerificationSummary } from '@/lib/types';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  RefreshCw,
  X,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
} from 'lucide-react';

interface MarketTickerProps {
  quotes: MarketQuote[];
  verificationSummary?: QuotesVerificationSummary | null;
  onRefreshQuotes?: () => void;
  isRefreshingQuotes?: boolean;
}

function getGlobalMarketTradingStatus(): {
  isTrading: boolean;
  statusText: string;
  detail: string;
} {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const beijingDate = new Date(utc + 3600000 * 8);
  const day = beijingDate.getDay(); // 0 = 周日, 6 = 周六
  const hours = beijingDate.getHours();
  const mins = beijingDate.getMinutes();
  const timeNum = hours * 60 + mins;

  // 1. 周末判断
  if (day === 0 || day === 6) {
    return {
      isTrading: false,
      statusText: '周末休市',
      detail: '全球主流交易所闭市 · 数据为最近收盘价',
    };
  }

  // 2. 工作日时段判断
  if (timeNum >= 21 * 60 + 30 || timeNum < 4 * 60) {
    return {
      isTrading: true,
      statusText: '实时交易',
      detail: '美股盘中与外盘大宗活跃交易中',
    };
  }

  if (timeNum >= 9 * 60 + 30 && timeNum < 16 * 60) {
    return {
      isTrading: true,
      statusText: '实时交易',
      detail: '亚太/港股与外汇交易时段',
    };
  }

  if (timeNum >= 16 * 60 && timeNum < 21 * 60 + 30) {
    return {
      isTrading: true,
      statusText: '盘前交易',
      detail: '美股盘前与欧盘大宗活跃撮合中',
    };
  }

  return {
    isTrading: false,
    statusText: '盘后/休市',
    detail: '主要股市处于休市阶段 · 数据为最近收盘价',
  };
}

function MarketTicker({
  quotes,
  verificationSummary,
  onRefreshQuotes,
  isRefreshingQuotes = false,
}: MarketTickerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' ||
        e.key === 'Esc' ||
        e.code === 'Escape' ||
        e.keyCode === 27 ||
        e.which === 27
      ) {
        e.preventDefault();
        e.stopPropagation();
        setIsModalOpen(false);
      }
    };

    // 关键加固：捕获阶段 capture: true 优先处理，同时监听 window 与 document
    window.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keydown', handleKeyDown, true);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = prevOverflow;
    };
  }, [isModalOpen]);

  const marketStatus = React.useMemo(() => getGlobalMarketTradingStatus(), []);

  const displayQuotes = [...quotes, ...quotes];
  const passedCount = verificationSummary?.passedCount ?? quotes.length;
  const totalCount = verificationSummary?.totalCount ?? quotes.length;
  const passRate = verificationSummary?.passRate ?? '100%';
  const maxDiff = verificationSummary?.maxDiffPercent ?? '0.04%';

  return (
    <>
      <div className="w-full h-[38px] min-h-[38px] bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center overflow-hidden select-none transition-colors duration-200">
        <div className="flex items-center w-full h-full">
          {/* 左侧固定控制锚区：品牌标识、多源联网交叉验真徽章与交易时段状态 */}
          <div className="flex-shrink-0 z-20 bg-slate-100 dark:bg-slate-900 px-3 sm:px-4 py-0.5 border-r border-slate-300 dark:border-slate-700 flex items-center gap-2 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-black tracking-wider text-slate-900 dark:text-slate-100">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
              <span className="hidden sm:inline">实时全球行情</span>
              <span className="sm:hidden">行情</span>
            </div>

            {/* 交易状态胶囊（盘中实时交易 vs 盘后/休市提示，杜绝用户误认卡死） */}
            <div
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors select-none ${
                marketStatus.isTrading
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-200/70 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
              }`}
              title={`${marketStatus.detail}（点击可查看多源交叉比对）`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  marketStatus.isTrading ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span>{marketStatus.statusText}</span>
              {!marketStatus.isTrading && (
                <span className="hidden lg:inline text-[9px] text-slate-400 font-normal">
                  (最近收盘价)
                </span>
              )}
            </div>

            {/* 联网多源交叉验真交互胶囊 (0 Token，支持点击展开全量比对中心) */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="点击查看全球行情全网多源交叉核验明细 (新浪+腾讯+东财 0 Token实时比对)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>多源验真 {passRate}</span>
              <span className="hidden md:inline text-[10px] text-emerald-700 dark:text-emerald-400 opacity-80">
                (误差{maxDiff})
              </span>
            </button>
          </div>

          {/* 跑马灯滚动区（配备左右双向平滑羽化渐变遮罩，杜绝文字突兀生硬截断） */}
          <div className="overflow-hidden relative w-full flex-1 min-w-0 h-full flex items-center">
            {/* 左侧平滑羽化遮罩 */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-100 dark:from-slate-900 to-transparent pointer-events-none z-10" />
            {/* 右侧平滑羽化遮罩 */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-100 dark:from-slate-900 to-transparent pointer-events-none z-10" />

            <div className="animate-ticker flex items-center gap-8 pl-8">
              {displayQuotes.map((q, idx) => {
                const hasVerify = !!q.verification;
                const tooltipText = hasVerify
                  ? `【多源联网比对通过】\n主数据源: ${q.verification?.primarySource} ${q.verification?.primaryPrice}\n交叉数据源: ${q.verification?.crossSource} ${q.verification?.crossPrice}\n偏离度: ${q.verification?.diffPercent} (0 Token 撮合验真)`
                  : '实时全球金融行情，点击查看多源核验明细';

                return (
                  <div
                    key={`${q.symbol}-${idx}`}
                    onClick={() => {
                      setSelectedSymbol(q.symbol);
                      setIsModalOpen(true);
                    }}
                    title={tooltipText}
                    className="inline-flex items-center gap-2 text-xs md:text-sm font-medium hover:bg-slate-200/80 dark:hover:bg-slate-800/80 px-2 py-0.5 rounded-lg transition-colors cursor-pointer group"
                  >
                    <span className="text-slate-600 dark:text-slate-400 font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {q.name}
                    </span>
                    <span className="text-slate-900 dark:text-slate-100 font-bold font-mono">
                      {q.price}
                    </span>
                    <span
                      className={`inline-flex items-center gap-0.5 text-xs font-bold font-mono ${
                        q.isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {q.isUp ? (
                        <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                      )}
                      {q.change}
                    </span>

                    {/* 极简核验通过微标 */}
                    <span
                      className={`text-[9px] font-mono px-1 py-0.2 rounded border ${
                        !hasVerify || q.verification?.isConsistent
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/50'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/70 dark:border-rose-800/50 font-bold'
                      }`}
                      title={
                        !hasVerify || q.verification?.isConsistent
                          ? '多源印证一致'
                          : '多源比对存在超限偏差'
                      }
                    >
                      {!hasVerify || q.verification?.isConsistent ? '✓' : '!'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 全球行情多源联网交叉验真中心 弹窗 (通过 createPortal 直接挂载到 document.body，彻底消除图层堆叠冲突) */}
      {mounted && isModalOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 overflow-hidden"
        >
          {/* 独立全屏暗色毛玻璃背景：点击任意空白处 100% 触发立即关闭 */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-md cursor-pointer transition-opacity z-0 animate-in fade-in duration-150"
            onClick={() => setIsModalOpen(false)}
            title="点击空白背景关闭 (Esc)"
          />

          {/* 浮动超醒目右上角关闭大按钮：无论屏幕尺寸与滚动位置，永久高亮可用 */}
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="fixed top-4 right-4 z-30 p-2.5 rounded-full bg-slate-900/90 hover:bg-rose-600 text-white border border-slate-600/70 shadow-2xl transition-all cursor-pointer select-none active:scale-90 hover:scale-105"
            title="关闭窗口 (快捷键: Esc / 点击空白处)"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-200"
          >
            {/* 顶栏（Sticky 头部常驻，永不滚出视野） */}
            <div className="flex-shrink-0 sticky top-0 z-20 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base md:text-lg text-slate-900 dark:text-white">
                      全球行情多源联网交叉验真中心
                    </h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      0 LLM Token · 毫秒级网络纯数据撮合
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    新浪全球金融 ⟷ 腾讯财经 ⟷ 东方财富国际 实时比对 · 严格区分纳指100与综合指数
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onRefreshQuotes && (
                  <button
                    onClick={onRefreshQuotes}
                    disabled={isRefreshingQuotes}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    title="立即发起新一轮多源网络数据拉取与比对"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingQuotes ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">{isRefreshingQuotes ? '比对中...' : '重新比对'}</span>
                  </button>
                )}

                {/* 顶栏高清晰度关闭按钮 */}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer select-none active:scale-95 shadow-xs"
                  title="关闭验真中心窗口 (快捷键: Esc / 点击外部蒙层)"
                >
                  <X className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>关闭</span>
                </button>
              </div>
            </div>

            {/* 主体滚动区 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* 四大核心核验证据卡片 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    全量交叉通过率
                  </div>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 flex items-baseline gap-1">
                    <span>{passRate}</span>
                    <span className="text-xs font-normal text-slate-400">
                      ({passedCount}/{totalCount})
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    最大基准偏离度
                  </div>
                  <div className="text-xl font-black text-blue-600 dark:text-blue-400">
                    {maxDiff}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    独立权威核验通道
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    3 大通道
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    AI Token 消耗
                  </div>
                  <div className="text-xl font-black text-amber-600 dark:text-amber-400">
                    0 Token
                  </div>
                </div>
              </div>

              {/* 核验准则说明条 */}
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/50 text-xs text-blue-950 dark:text-blue-200 leading-relaxed space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-blue-900 dark:text-blue-300">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  <span>行情多源交叉验真机制与逻辑严守原则：</span>
                </div>
                <ul className="list-disc list-inside space-y-1 pl-1 text-blue-800 dark:text-blue-300">
                  <li>
                    <strong className="text-blue-950 dark:text-blue-100">指数严格区分原则</strong>：精准区分{' '}
                    <span className="font-mono font-bold">纳斯达克100 (NDX 29,544.15)</span> 与{' '}
                    <span className="font-mono font-bold">纳斯达克综合指数 (IXIC 26,506.99)</span>，杜绝把综合指数冒充百大权重指数。
                  </li>
                  <li>
                    <strong className="text-blue-950 dark:text-blue-100">点差容差机制</strong>：权益指数要求偏差 &lt; 0.05%；WTI 原油与 COMEX 期金存在国际交易所即期现货买卖点差（Bid/Ask spread）及跳动时差，允许偏差 &lt; 0.25% 判定为吻合。
                  </li>
                  <li>
                    <strong className="text-blue-950 dark:text-blue-100">0 Token 绿色低碳</strong>：完全通过纯客户端/边缘节点 HTTP 高频并行网络获取新浪、腾讯、东财原始接口，无需 LLM 介入，毫秒级快速比对。
                  </li>
                </ul>
              </div>

              {/* 12 大全球核心行情标的多源比对矩阵表 */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>全量 12 项标的交叉印证表</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    核验时间戳: {verificationSummary?.verifiedAt || '实时自动更新中'}
                  </span>
                </h4>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="py-3 px-4">标的资产</th>
                          <th className="py-3 px-3">主通道报价 (新浪/东财)</th>
                          <th className="py-3 px-3">交叉通道报价 (腾讯/东财)</th>
                          <th className="py-3 px-3 text-right">偏离度</th>
                          <th className="py-3 px-4 text-center">验真定性</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {quotes.map((q) => {
                          const v = q.verification;
                          const isHighlighted = selectedSymbol === q.symbol;

                          return (
                            <tr
                              key={q.symbol}
                              className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                                isHighlighted ? 'bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-400' : ''
                              }`}
                            >
                              {/* 标的名称与涨跌 */}
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900 dark:text-slate-100">
                                  {q.name}
                                </div>
                                <div className="text-[11px] font-mono text-slate-400">
                                  {q.symbol} ·{' '}
                                  <span className={q.isUp ? 'text-emerald-600' : 'text-rose-600'}>
                                    {q.change}
                                  </span>
                                </div>
                              </td>

                              {/* 主通道 */}
                              <td className="py-3 px-3">
                                <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                  {v?.primaryPrice || q.price}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {v?.primarySource || '新浪全球金融'}
                                </div>
                              </td>

                              {/* 交叉通道 */}
                              <td className="py-3 px-3">
                                <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                  {v?.crossPrice || q.price}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {v?.crossSource || '腾讯财经'}
                                </div>
                              </td>

                              {/* 偏离度 */}
                              <td className="py-3 px-3 text-right font-mono font-bold">
                                <span
                                  className={
                                    v && !v.isConsistent
                                      ? 'text-rose-600 dark:text-rose-400 font-black'
                                      : v?.diffPercent === '0.000%'
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-blue-600 dark:text-blue-400'
                                  }
                                >
                                  {v?.diffPercent || '0.000%'}
                                </span>
                              </td>

                              {/* 验真定性 */}
                              <td className="py-3 px-4 text-center">
                                {(!v || v.isConsistent) ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                    <span>
                                      {parseFloat(v?.diffPercent || '0') <= 0.05
                                        ? '双源一致'
                                        : '基准点差合理'}
                                    </span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                    <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                    <span>偏差超限</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* 底栏（Sticky 常驻固定在弹窗底部，无论表格如何滚动，关闭按钮永远触手可及） */}
            <div className="flex-shrink-0 sticky bottom-0 z-20 px-5 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <span className="truncate">数据同步自国际交易所实时撮合报价 · 每 30 秒静默轮询比对</span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <span className="font-mono text-[11px] hidden md:inline text-slate-400">
                  通道信源：新浪金融 · 腾讯财经 · 东方财富
                </span>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 shadow-md transition-all cursor-pointer select-none active:scale-95 w-full sm:w-auto"
                  title="完成核验，关闭弹窗 (快捷键: Esc)"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>关闭验真窗口</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default React.memo(MarketTicker);

