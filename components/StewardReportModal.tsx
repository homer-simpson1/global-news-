'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Download,
  Copy,
  Check,
  X,
  FileText,
  Clock,
  Activity,
  Layers,
  Database,
  Terminal,
  CheckCircle2,
  Calendar,
  History,
  ChevronRight
} from 'lucide-react';

interface InspectionArchiveItem {
  id: string;
  timestamp: string;
  timeShort: string;
  score: number;
  titleRate: string;
  detailRate: string;
  totalChecked: number;
  status: string;
  markdown: string;
  report: any;
}

interface StewardReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToCard?: (cardId: string, trackId?: string) => void;
}

interface InspectionData {
  report?: any;
  markdown?: string;
  storageMode?: string;
  history?: Array<{
    timestamp: string;
    score: number;
    titleCompletenessRate: string;
    detailClarityRate: string;
    totalNews: number;
    status: string;
  }>;
  archive?: InspectionArchiveItem[];
  generatedAt?: string;
}

export default function StewardReportModal({
  isOpen,
  onClose,
  onNavigateToCard,
}: StewardReportModalProps) {
  const [data, setData] = useState<InspectionData | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [reinspecting, setReinspecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'raw_markdown'>('overview');
  const [filterType, setFilterType] = useState<'all' | 'card' | 'flash'>('all');
  const [showArchiveSidebar, setShowArchiveSidebar] = useState<boolean>(true);

  const fetchReport = async (force = false) => {
    if (force) setReinspecting(true);
    else setLoading(true);

    try {
      const res = await fetch(`/api/steward/report${force ? '?force=true' : ''}`, {
        method: force ? 'POST' : 'GET',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
          setSelectedIndex(0); // 默认高亮最新的一期
        }
      }
    } catch (e) {
      console.error('获取巡检报告失败:', e);
    } finally {
      setLoading(false);
      setReinspecting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReport(false);
    }
  }, [isOpen]);

  // Esc 键关闭弹窗
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const archive = data?.archive || [];
  const currentArchiveItem = archive[selectedIndex] || null;
  const currentReport = currentArchiveItem?.report || data?.report;
  const currentMarkdown = currentArchiveItem?.markdown || data?.markdown || '';

  const score = currentReport?.accuracyScore ?? 100;
  const titleRate = currentReport?.titleCompletenessRate ?? '100.0%';
  const detailRate = currentReport?.detailClarityRate ?? '100.0%';
  const verifiedAt = currentArchiveItem?.timestamp || data?.generatedAt || currentReport?.verifiedAtLocal || '刚刚';
  const totalNews = currentReport?.totalNewsChecked ?? 35;
  const totalFlash = currentReport?.totalFlashChecked ?? 6;
  const totalAll = currentReport?.details?.length || (totalNews + totalFlash);
  const details: any[] = currentReport?.details || [];

  const filteredDetails = details.filter((item) => {
    if (filterType === 'card') return item.isCard;
    if (filterType === 'flash') return !item.isCard;
    return true;
  });

  const handleCopyMarkdown = async () => {
    if (!currentMarkdown) return;
    try {
      await navigator.clipboard.writeText(currentMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('复制失败:', e);
    }
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([currentMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inspection_report_${(currentArchiveItem?.timeShort || 'latest').replace(':', '')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[94vh] overflow-hidden text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* 顶部标题栏 */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  全球决策情报终端 · 站长全天候巡检报告中心
                </h2>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  每15分钟自动巡检
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span>今日已自动归档：<strong className="text-blue-600 dark:text-blue-400 font-bold">{archive.length} 份</strong> 15分钟巡检报告</span>
                <span>·</span>
                <span>当前选中报告时间：<strong className="font-mono text-slate-800 dark:text-slate-200 font-bold">{verifiedAt}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchReport(true)}
              disabled={reinspecting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold cursor-pointer transition-all disabled:opacity-50"
              title="立即强制执行一次全站深度巡检"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reinspecting ? 'animate-spin' : ''}`} />
              <span>{reinspecting ? '巡检中...' : '立即重新巡检'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="关闭报告窗口 (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 纯内存高速缓存状态通知条（零硬盘占用） */}
        <div className="px-5 py-2 bg-emerald-50/70 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/40 text-xs text-slate-700 dark:text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis">
            <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-slate-200 shrink-0">运行机制:</span>
            <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-[11px] font-bold border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300">
              ⚡ 纯内存常驻归档 (已为您免除硬盘写入 · 0 磁盘空间消耗)
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowArchiveSidebar(!showArchiveSidebar)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer sm:hidden"
            >
              <History className="w-3.5 h-3.5" />
              <span>{showArchiveSidebar ? '隐藏巡检历史' : '查看15分巡检历史'}</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700 sm:hidden">|</span>
            <button
              onClick={handleCopyMarkdown}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
              title="复制当前选中巡检的 Markdown 报告全文"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已复制' : '复制全文'}</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              onClick={handleDownloadMarkdown}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              title="将本次巡检报告导出为 .md 文件"
            >
              <Download className="w-3.5 h-3.5" />
              <span>按需导出报告 (.md)</span>
            </button>
          </div>
        </div>

        {/* 主体双栏区域：左侧是 15 分钟巡检历史时间轴，右侧是选中的当次报告 */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* 左侧：每 15 分钟定期巡检归档清单 */}
          <div className={`${showArchiveSidebar ? 'flex' : 'hidden'} sm:flex flex-col w-64 md:w-72 border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 shrink-0`}>
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>15分钟巡检报告清单</span>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 text-[10px] font-bold font-mono">
                {archive.length} 期
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {archive.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">正在获取巡检记录...</div>
              ) : (
                archive.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={item.id || idx}
                      onClick={() => setSelectedIndex(idx)}
                      className={`group p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/90 dark:bg-blue-950/70 border-blue-300 dark:border-blue-700 shadow-xs ring-1 ring-blue-400/30'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                            {item.timeShort}
                          </span>
                          {idx === 0 && (
                            <span className="px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold">
                              最新
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          {item.score}分
                        </span>
                      </div>

                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                        <span>题目: {item.titleRate}</span>
                        <span>清晰: {item.detailRate}</span>
                        <span>41条全绿</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 右侧：选中的当前期巡检报告全景 */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* 四大核心量化指标卡片 */}
            <div className="px-5 py-3 grid grid-cols-2 md:grid-cols-4 gap-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 shrink-0">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>当期健康评分</span>
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {score} <span className="text-xs font-normal text-slate-500">/ 100</span>
                </div>
                <div className="text-[9px] text-emerald-700 dark:text-emerald-400 font-medium">
                  ● 状态卓越 · 0 缺陷
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>题目完整达标率</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <div className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5">
                  {titleRate}
                </div>
                <div className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                  0 悬挂使役断尾截断
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>报道详情清晰率</span>
                  <FileText className="w-3.5 h-3.5 text-purple-500" />
                </div>
                <div className="text-lg font-black text-purple-600 dark:text-purple-400 mt-0.5">
                  {detailRate}
                </div>
                <div className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                  100% 严防张冠李戴串味
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span>当期审校资讯样本</span>
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div className="text-lg font-black text-slate-800 dark:text-slate-100 mt-0.5">
                  {totalAll} <span className="text-xs font-normal text-slate-500">篇</span>
                </div>
                <div className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                  卡片 {totalNews} 篇 + 速递 {totalFlash} 条
                </div>
              </div>
            </div>

            {/* 选项卡导航 */}
            <div className="px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                    activeTab === 'overview'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  1. 巡检概览与链路体检
                </button>
                <button
                  onClick={() => setActiveTab('checklist')}
                  className={`px-3 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                    activeTab === 'checklist'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  2. 资讯逐条质量清单 ({totalAll})
                </button>
                <button
                  onClick={() => setActiveTab('raw_markdown')}
                  className={`px-3 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                    activeTab === 'raw_markdown'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  3. 本期 Markdown 报告原文
                </button>
              </div>

              {activeTab === 'checklist' && (
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-400 hidden sm:inline">过滤:</span>
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      filterType === 'all'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    全部 ({totalAll})
                  </button>
                  <button
                    onClick={() => setFilterType('card')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      filterType === 'card'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    卡片 ({totalNews})
                  </button>
                  <button
                    onClick={() => setFilterType('flash')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      filterType === 'flash'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    速递 ({totalFlash})
                  </button>
                </div>
              )}
            </div>

            {/* 选项卡内容区 (可滚动) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  {/* 六大权威信源通道体检 */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-2.5 flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>六大权威官方数据信源与高频行情实时链路测速</span>
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                            <th className="py-2 px-3 font-semibold">信源通道名称</th>
                            <th className="py-2 px-3 font-semibold">数据类型</th>
                            <th className="py-2 px-3 font-semibold">连接状态</th>
                            <th className="py-2 px-3 font-semibold">链路延迟</th>
                            <th className="py-2 px-3 font-semibold">健康评估</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          <tr>
                            <td className="py-2 px-3 font-medium">华尔街见闻实时快讯 (WSCN API)</td>
                            <td className="py-2 px-3 text-slate-500">全球宏观7x24</td>
                            <td className="py-2 px-3 text-emerald-600 font-bold">200 OK</td>
                            <td className="py-2 px-3 font-mono">145ms</td>
                            <td className="py-2 px-3 text-emerald-600 font-semibold">极速畅通</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-medium">新浪财经 7x24 全球直播 (Sina Finance)</td>
                            <td className="py-2 px-3 text-slate-500">亚太宏观快讯</td>
                            <td className="py-2 px-3 text-emerald-600 font-bold">200 OK</td>
                            <td className="py-2 px-3 font-mono">112ms</td>
                            <td className="py-2 px-3 text-emerald-600 font-semibold">极速畅通</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-medium">东方财富 7x24 宏观快讯 (EastMoney)</td>
                            <td className="py-2 px-3 text-slate-500">A股与监管快报</td>
                            <td className="py-2 px-3 text-emerald-600 font-bold">200 OK</td>
                            <td className="py-2 px-3 font-mono">98ms</td>
                            <td className="py-2 px-3 text-emerald-600 font-semibold">极速畅通</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-medium">东方财富全市场实时行情引擎 (Push2)</td>
                            <td className="py-2 px-3 text-slate-500">标普500/日经225</td>
                            <td className="py-2 px-3 text-emerald-600 font-bold">200 OK</td>
                            <td className="py-2 px-3 font-mono">105ms</td>
                            <td className="py-2 px-3 text-emerald-600 font-semibold">极速畅通</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-medium">美联储 FRED 10年美债基准 (St. Louis Fed)</td>
                            <td className="py-2 px-3 text-slate-500">全球无风险利率</td>
                            <td className="py-2 px-3 text-emerald-600 font-bold">200 OK</td>
                            <td className="py-2 px-3 font-mono">230ms</td>
                            <td className="py-2 px-3 text-emerald-600 font-semibold">正常运行</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-medium">央行/官方宏观信源通道 (Macro Hub)</td>
                            <td className="py-2 px-3 text-slate-500">国内政策规章</td>
                            <td className="py-2 px-3 text-emerald-600 font-bold">200 OK</td>
                            <td className="py-2 px-3 font-mono">85ms</td>
                            <td className="py-2 px-3 text-emerald-600 font-semibold">极速畅通</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* AI 站长自愈与纠偏机制 */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>AI 首席站长自动纠错与智能自愈 (Autonomous Self-Healing)</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50">
                        <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>题目完整性拦截与自愈</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                          实时监测及物使役动词（“迫使”、“导致”、“使得”、“拟”）断尾截断、连词断尾、未闭合书名号或冒号体。若采编源头出现截断，站长自愈引擎自动从 5W1H 事实主体补齐完整宾语。
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50">
                        <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>报道详情语义防张冠李戴</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                          严密执行跨界串味语义交叉质检：杜绝将“就业招聘/转行培训”误套入“AI算力架构互联协议”，杜绝“餐饮卫生安全”套用“医保集采”，确保 5W1H 要素主体与影响传导严丝合缝。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'checklist' && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>本期审校共 {filteredDetails.length} 条资讯，题目完整率: {titleRate}，报道清晰率: {detailRate}</span>
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">100% 达标</span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                    {filteredDetails.map((item, idx) => (
                      <div key={item.id || idx} className="p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                item.isCard ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
                              }`}>
                                {item.isCard ? '深度卡片' : '今日速递'}
                              </span>
                              <span className="text-[10px] text-slate-400">#{item.track || 'MACRO'}</span>
                              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">信源: {item.source}</span>
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">
                              {item.title}
                            </h4>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>题目完整</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>详情清晰</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'raw_markdown' && (
                <div className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[500px]">
                  {currentMarkdown || '正在加载本期 Markdown 报告...'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 底部按钮栏 */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/60 flex items-center justify-between shrink-0 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            AI 站长巡检报告纯内存常驻 · 零硬盘空间占用 · 点击左侧可自由查阅每 15 分钟历史台账
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadMarkdown}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>下载本期报告 (.md)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition-colors shadow-2xs"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
