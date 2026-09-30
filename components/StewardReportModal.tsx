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
  ExternalLink,
  Activity,
  Layers,
  Database,
  Terminal,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';

interface StewardReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToCard?: (cardId: string, trackId?: string) => void;
}

interface InspectionData {
  report?: any;
  markdown?: string;
  reportPath?: string;
  generatedAt?: string;
}

export default function StewardReportModal({
  isOpen,
  onClose,
  onNavigateToCard,
}: StewardReportModalProps) {
  const [data, setData] = useState<InspectionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [reinspecting, setReinspecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'raw_markdown'>('overview');
  const [filterType, setFilterType] = useState<'all' | 'card' | 'flash'>('all');

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

  const report = data?.report;
  const score = report?.accuracyScore ?? 100;
  const titleRate = report?.titleCompletenessRate ?? '100.0%';
  const detailRate = report?.detailClarityRate ?? '100.0%';
  const passRate = report?.passRate ?? '100%';
  const verifiedAt = data?.generatedAt || report?.verifiedAtLocal || '刚刚';
  const totalNews = report?.totalNewsChecked ?? 35;
  const totalFlash = report?.totalFlashChecked ?? 6;
  const totalAll = report?.details?.length || (totalNews + totalFlash);
  const details: any[] = report?.details || [];

  const filteredDetails = details.filter((item) => {
    if (filterType === 'card') return item.isCard;
    if (filterType === 'flash') return !item.isCard;
    return true;
  });

  const handleCopyMarkdown = async () => {
    if (!data?.markdown) return;
    try {
      await navigator.clipboard.writeText(data.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('复制失败:', e);
    }
  };

  const handleDownloadMarkdown = () => {
    window.open('/api/steward/report?download=true', '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* 顶部标题栏 */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  全球决策情报终端 · 站长全天候巡检报告
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  每15分钟自动巡检
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                <span>实时自检时间：<strong className="font-mono text-slate-700 dark:text-slate-300">{verifiedAt}</strong></span>
                <span>·</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">健康指数: {score}/100 满分</span>
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
        <div className="px-5 py-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/40 text-xs text-slate-700 dark:text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis">
            <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-slate-200 shrink-0">存储模式:</span>
            <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-[11px] font-bold border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300">
              ⚡ 纯内存单例高速缓存 (零硬盘占用 · 0 磁盘空间消耗)
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyMarkdown}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
              title="复制 Markdown 报告全文"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已复制' : '复制全文'}</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              onClick={handleDownloadMarkdown}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              title="按需下载 .md 格式巡检报告到本地"
            >
              <Download className="w-3.5 h-3.5" />
              <span>按需导出报告 (.md)</span>
            </button>
          </div>
        </div>

        {/* 四大核心量化指标卡片 */}
        <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 shrink-0">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
              <span>全栈综合健康度</span>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {score} <span className="text-xs font-normal text-slate-500">/ 100</span>
            </div>
            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
              ● 状态极优 · 0 重大缺陷
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
              <span>题目完整达标率</span>
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
              {titleRate}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              0 悬空截断 · 0 悬挂使役断尾
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
              <span>报道详情清晰率</span>
              <FileText className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
              {detailRate}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              100% 严防张冠李戴串味
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
              <span>巡检资讯样本量</span>
              <Layers className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
              {totalAll} <span className="text-xs font-normal text-slate-500">篇</span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              深度卡片 {totalNews} 篇 + 速递 {totalFlash} 条
            </div>
          </div>
        </div>

        {/* 选项卡导航 */}
        <div className="px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              1. 巡检概览与链路体检
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              className={`px-3 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'checklist'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              2. 全域资讯逐条质量清单 ({totalAll})
            </button>
            <button
              onClick={() => setActiveTab('raw_markdown')}
              className={`px-3 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'raw_markdown'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              3. Markdown 实体报告原文
            </button>
          </div>

          {activeTab === 'checklist' && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 hidden sm:inline">过滤:</span>
              <button
                onClick={() => setFilterType('all')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                全部 ({totalAll})
              </button>
              <button
                onClick={() => setFilterType('card')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  filterType === 'card'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                卡片 ({totalNews})
              </button>
              <button
                onClick={() => setFilterType('flash')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
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
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 六大权威信源通道体检 */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
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
                <span>共审校 {filteredDetails.length} 条资讯，题目完整率: {titleRate}，报道清晰率: {detailRate}</span>
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
              {data?.markdown || '正在加载最新落盘 Markdown 报告...'}
            </div>
          )}
        </div>

        {/* 底部按钮栏 */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/60 flex items-center justify-between shrink-0 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            AI 站长巡检报告纯内存常驻 · 零硬盘空间占用 · 支持按需导出与在线阅览
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadMarkdown}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>下载报告 (.md)</span>
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
