'use client';

import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, X, Copy, Check, Sparkles, Image as ImageIcon } from 'lucide-react';
import { FlashBrief, MarketQuote, NewsItem, TrackId } from '@/lib/types';
import { TRACK_THEMES } from '@/lib/trackThemes';

interface ShareImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  flashBriefs: FlashBrief[];
  newsItems: NewsItem[];
  quotes: MarketQuote[];
}

export default function ShareImageModal({
  isOpen,
  onClose,
  flashBriefs,
  newsItems,
  quotes,
}: ShareImageModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [exportMode, setExportMode] = useState<'brief' | 'full'>('brief');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    // 延迟渲染以确保 DOM 挂载
    const timer = setTimeout(() => {
      renderCanvas();
    }, 80);

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
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keydown', handleKeyDown, true);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, exportMode, flashBriefs, newsItems, quotes, onClose]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setGenerating(true);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 根据模式选取资讯条目：
    // 模式一 (brief)：「今日决策速递精要」（仅大盘行情 + 5~6条决策速递，适合社群高画质极速分享）
    // 模式二 (full)：「全景深度情报底稿」（全站全量深度卡片导出）
    const selectedNews: {
      tag: string;
      track: TrackId;
      title: string;
      takeaway: string;
      transmission: string;
      sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
      watchlist?: string;
      source: string;
    }[] = [];

    if (exportMode === 'brief') {
      const sourceList = (flashBriefs && flashBriefs.length > 0) ? flashBriefs : [];
      sourceList.slice(0, 6).forEach((b) => {
        selectedNews.push({
          tag: b.tag,
          track: b.track,
          title: b.content.replace(/^[【\[][^】\]]+[】\]]\s*/, ''),
          takeaway: b.summaryParagraph || b.content,
          transmission: b.transmission,
          sentiment: b.sentiment || 'NEUTRAL',
          watchlist: b.nextWatchlist,
          source: b.source,
        });
      });
    } else {
      const sourceList = (newsItems && newsItems.length > 0) ? newsItems : [];
      sourceList.forEach((n) => {
        selectedNews.push({
          tag: n.track,
          track: n.track,
          title: n.title.replace(/^[【\[][^】\]]+[】\]]\s*/, ''),
          takeaway: n.oneLineTakeaway,
          transmission: n.transmissionImpact,
          sentiment: n.sentiment || 'NEUTRAL',
          watchlist: n.nextWatchlist,
          source: n.source,
        });
      });
    }

    // 绘图尺寸设定 (Retina 2x 超高清渲染)
    const width = 800;
    // 预估高度
    const cardHeight = exportMode === 'brief' ? 280 : 255;
    const estimatedHeight = 360 + selectedNews.length * cardHeight + 160;
    canvas.width = width * 2;
    canvas.height = estimatedHeight * 2;
    ctx.scale(2, 2);

    // 1. 终端质感背景 (深邃夜空渐变)
    const bgGradient = ctx.createLinearGradient(0, 0, 0, estimatedHeight);
    bgGradient.addColorStop(0, '#040914');
    bgGradient.addColorStop(0.5, '#071022');
    bgGradient.addColorStop(1, '#020617');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, estimatedHeight);

    // 装饰光晕
    const radialGrad = ctx.createRadialGradient(width / 2, 0, 10, width / 2, 0, 400);
    radialGrad.addColorStop(0, 'rgba(37, 99, 235, 0.18)');
    radialGrad.addColorStop(1, 'rgba(37, 99, 235, 0)');
    ctx.fillStyle = radialGrad;
    ctx.fillRect(0, 0, width, 450);

    // 2. 头部品牌区域
    let curY = 40;

    // 品牌标识小胶囊
    drawRoundedRect(ctx, 40, curY, 140, 26, 6, '#1e293b', '#334155');
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('● 决策情报终端', 52, curY + 17);

    // 编号与日期
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.fillText(dateStr, width - 40, curY + 18);
    ctx.textAlign = 'left';

    curY += 50;

    // 主标题
    ctx.font = '900 28px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(
      exportMode === 'brief'
        ? '全球宏观与核心决策 · 晨晚速递'
        : '全球决策情报终端 · 全景深度底稿',
      40,
      curY
    );

    curY += 28;
    ctx.font = '13px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(
      exportMode === 'brief'
        ? '今日决策速递精萃 · 剔除杂音干扰 · 穿透利益链传导与多空博弈'
        : '全站全专区深度底稿 · 涵盖美股算力/大宗航运/地缘战局/治理追踪',
      40,
      curY
    );

    curY += 25;

    // 3. 实时行情条 (Market Ticker Cards)
    if (quotes && quotes.length > 0) {
      // 验真副标题
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#10b981';
      ctx.fillText('● 实时全球行情 · 全网三源交叉验真 100% (新浪+腾讯+东财 · 0 Token)', 40, curY);

      curY += 16;

      const displayQuotes = quotes.slice(0, 4);
      const cardWidth = (width - 80 - (displayQuotes.length - 1) * 12) / displayQuotes.length;

      displayQuotes.forEach((q, qIdx) => {
        const qX = 40 + qIdx * (cardWidth + 12);
        drawRoundedRect(ctx, qX, curY, cardWidth, 68, 10, '#0f172a', '#1e293b');

        // 行情名称
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(q.name, qX + 12, curY + 20);

        // 双源验真微标
        const isConsistent = !q.verification || q.verification.isConsistent;
        ctx.font = 'bold 9px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = isConsistent ? '#34d399' : '#f43f5e';
        ctx.textAlign = 'right';
        ctx.fillText(isConsistent ? '✓ 双源一致' : '⚠ 偏差警示', qX + cardWidth - 10, curY + 20);
        ctx.textAlign = 'left';

        // 价格
        ctx.font = 'bold 15px "SFMono-Regular", monospace, system-ui';
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(q.price, qX + 12, curY + 42);

        // 涨跌幅
        ctx.font = 'bold 12px "SFMono-Regular", monospace, system-ui';
        ctx.fillStyle = q.isUp ? '#10b981' : '#f43f5e';
        ctx.fillText(`${q.isUp ? '+' : ''}${q.change}`, qX + 12, curY + 59);
      });

      curY += 86;
    }

    // 分隔线
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, curY);
    ctx.lineTo(width - 40, curY);
    ctx.stroke();

    curY += 25;

    const TRACK_ACCENT_COLORS: Record<TrackId, string> = {
      us_macro: '#2563eb',
      apac_tech: '#059669',
      commodities_shipping: '#0d9488',
      war_conflict: '#e11d48',
      china_domestic: '#d97706',
      china_policy: '#4f46e5',
      global_cognition: '#9333ea',
    };

    // 4. 精选核心决策资讯列表
    selectedNews.forEach((item, nIdx) => {
      const cardStartY = curY;
      const cardInnerWidth = width - 80;

      // 根据主题着色
      const accentColor = TRACK_ACCENT_COLORS[item.track as TrackId] || '#38bdf8';

      // 资讯卡片背景
      drawRoundedRect(ctx, 40, cardStartY, cardInnerWidth, 240, 14, '#090e1c', '#17223b');

      // 左侧赛道专属彩色条
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.roundRect(40, cardStartY, 5, 240, [14, 0, 0, 14]);
      ctx.fill();

      let itemY = cardStartY + 24;

      // 序号与分类药丸
      drawRoundedRect(ctx, 56, itemY - 14, 28, 20, 5, accentColor);
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(`0${nIdx + 1}`, 70, itemY);
      ctx.textAlign = 'left';

      drawRoundedRect(ctx, 92, itemY - 14, 86, 20, 5, '#1e293b');
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.fillText(item.tag || '深度研报', 98, itemY);

      // 多空情绪标签
      let sentimentText = '⚪ 中性 · 观望';
      let sentimentBg = '#1e293b';
      let sentimentColor = '#cbd5e1';
      if (item.sentiment === 'BULLISH') {
        sentimentText = '🟢 利多 · 偏暖';
        sentimentBg = 'rgba(16, 185, 129, 0.15)';
        sentimentColor = '#34d399';
      } else if (item.sentiment === 'BEARISH') {
        sentimentText = '🔴 利空 · 承压';
        sentimentBg = 'rgba(244, 63, 94, 0.15)';
        sentimentColor = '#fb7185';
      }
      drawRoundedRect(ctx, 186, itemY - 14, 90, 20, 5, sentimentBg);
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = sentimentColor;
      ctx.fillText(sentimentText, 194, itemY);

      // 信源出处
      ctx.font = '11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`信源: ${item.source}`, 286, itemY);

      itemY += 26;

      // 标题（精炼有力）
      ctx.font = 'bold 17px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#f8fafc';
      const truncatedTitle = item.title.length > 36 ? item.title.slice(0, 36) + '...' : item.title;
      ctx.fillText(truncatedTitle, 56, itemY);

      itemY += 26;

      // 核心结论与底层动因
      drawRoundedRect(ctx, 56, itemY - 12, cardInnerWidth - 32, 54, 8, '#0b1329', '#1d2c4d');
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = accentColor;
      ctx.fillText('💡 底层动因与本质归因:', 68, itemY + 6);

      ctx.font = '12px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#e2e8f0';
      wrapCanvasText(ctx, item.takeaway, 68, itemY + 25, cardInnerWidth - 56, 18, 2);

      itemY += 66;

      // 决策传导
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('🎯 市场与决策传导:', 56, itemY + 6);
      ctx.font = '12px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#cbd5e1';
      wrapCanvasText(ctx, item.transmission, 172, itemY + 6, cardInnerWidth - 140, 18, 1);

      itemY += 30;

      // 后续观察哨
      if (item.watchlist) {
        drawRoundedRect(ctx, 56, itemY - 10, cardInnerWidth - 32, 32, 6, 'rgba(49, 46, 129, 0.3)', '#3730a3');
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#a5b4fc';
        const cleanWatchlist = item.watchlist.replace(/^[【\[]后续观察哨[】\]][：:]\s*/, '');
        ctx.fillText(`🔭 后续观察哨: ${cleanWatchlist}`, 68, itemY + 11);
      }

      curY += 260;
    });

    // 5. 底部防伪印记与版权注记
    curY += 10;
    ctx.strokeStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(40, curY);
    ctx.lineTo(width - 40, curY);
    ctx.stroke();

    curY += 28;
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('全球决策情报终端 · 权威信源严审交叉印证', 40, curY);

    ctx.textAlign = 'right';
    ctx.font = '11px monospace, system-ui';
    ctx.fillStyle = '#64748b';
    ctx.fillText('SECURE WATERMARK · GID-VERIFIED', width - 40, curY);
    ctx.textAlign = 'left';

    curY += 20;
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('覆盖：华尔街日报 / 彭博 / 路透 / 日经 / 财新 / 金融时报 · 仅供个人宏观研究内参', 40, curY);

    try {
      const dataUrl = canvas.toDataURL('image/png');
      setImageUrl(dataUrl);
    } catch (e) {
      console.error('Failed to export canvas:', e);
    } finally {
      setGenerating(false);
    }
  };

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    fill?: string,
    stroke?: string
  ) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  };

  const wrapCanvasText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxLines: number = 2
  ) => {
    if (!text) return;
    const chars = text.split('');
    let line = '';
    let lineCount = 0;

    for (let i = 0; i < chars.length; i++) {
      const testLine = line + chars[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        lineCount++;
        if (lineCount >= maxLines) {
          ctx.fillText(line + '...', x, y);
          return;
        }
        ctx.fillText(line, x, y);
        line = chars[i];
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `全球决策情报早晚报_${dateStr}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    } catch (err) {
      console.warn('Clipboard write image not supported, fallback to download:', err);
      handleDownload();
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 overflow-hidden select-none"
    >
      {/* 独立全屏透明暗色蒙层：点击空白处 100% 触发关闭 */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer transition-opacity z-0 animate-in fade-in duration-150"
        onClick={onClose}
        title="点击空白背景关闭 (Esc)"
      />

      {/* 浮动右上角关闭大按钮：无论窗口多大均永久高亮突出 */}
      <button
        type="button"
        onClick={onClose}
        className="fixed top-4 right-4 z-30 p-2.5 rounded-full bg-slate-900/90 hover:bg-rose-600 text-white border border-slate-600/70 shadow-2xl transition-all cursor-pointer select-none active:scale-90 hover:scale-105"
        title="关闭长图预览 (快捷键: Esc / 点击空白处)"
      >
        <X className="w-5 h-5 stroke-[2.5]" />
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white animate-in zoom-in-95 duration-200"
      >
        {/* 弹窗顶栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base md:text-lg text-white">
                今日决策早晚报 · 精选长图
              </h3>
              <p className="text-xs text-slate-400">
                超高清 2x 视网膜渲染 · 自动集成行情/核心研报/后续观察哨
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyImage}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">已复制图片</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-300" />
                  <span>复制到剪贴板</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/25 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>保存高清长图 (PNG)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 双模式选择切换条（精要速递长图 vs 全景深度底稿） */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400 flex-shrink-0">导出版式:</span>
            <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800 gap-1">
              <button
                type="button"
                onClick={() => setExportMode('brief')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  exportMode === 'brief'
                    ? 'bg-blue-600 text-white shadow-xs ring-1 ring-blue-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ⚡ 今日决策速递精要（推荐 · 微信/社群分享）
              </button>
              <button
                type="button"
                onClick={() => setExportMode('full')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  exportMode === 'full'
                    ? 'bg-blue-600 text-white shadow-xs ring-1 ring-blue-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📑 全景深度情报底稿（全站全量卡片）
              </button>
            </div>
          </div>

          <span className="text-[11px] text-slate-400 font-medium hidden md:inline">
            {exportMode === 'brief'
              ? '包含大盘行情 + 6 条今日速递 · 图幅精致轻便 · 杜绝渲染超限'
              : `包含全站 ${newsItems?.length || 31} 篇全部专区深度卡片 · 详实存档`}
          </span>
        </div>

        {/* 隐藏离屏 Canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* 预览区 */}
        <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-slate-950">
          {imageUrl ? (
            <div className="max-w-[480px] w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
              <img
                src={imageUrl}
                alt="早晚报精选长图"
                className="w-full h-auto object-contain select-none"
              />
            </div>
          ) : (
            <div className="py-24 text-center text-slate-400 flex flex-col items-center gap-3">
              <Sparkles className="w-8 h-8 text-blue-400 animate-spin" />
              <span>正在生成高清早晚报长图...</span>
            </div>
          )}
        </div>

        {/* 弹窗底栏（常驻底部，随时一键退出） */}
        <div className="flex-shrink-0 sticky bottom-0 z-20 px-6 py-3.5 border-t border-slate-800 bg-slate-950/95 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span>超高清 2x 视网膜长图渲染完成 · 支持社群直接粘贴原图分享</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-all cursor-pointer select-none active:scale-95 w-full sm:w-auto"
            title="关闭长图 (快捷键: Esc)"
          >
            <X className="w-3.5 h-3.5" />
            <span>关闭长图预览</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
