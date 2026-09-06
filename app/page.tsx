'use client';

import React, { useState, useEffect } from 'react';
import MarketTicker from '@/components/MarketTicker';
import Header from '@/components/Header';
import FlashBriefing from '@/components/FlashBriefing';
import RegionalTrack from '@/components/RegionalTrack';
import { FlashBrief, MarketQuote, NewsItem, TrackId } from '@/lib/types';
import { SEED_FLASH_BRIEFS, SEED_MARKET_QUOTES, SEED_NEWS_ITEMS } from '@/data/seedData';
import { Search, SlidersHorizontal, CheckCircle2 } from 'lucide-react';

const REFRESH_INTERVAL_SECONDS = 30 * 60; // 30分钟 = 1800秒

export default function Home() {
  const [quotes, setQuotes] = useState<MarketQuote[]>(SEED_MARKET_QUOTES);
  const [flashBriefs, setFlashBriefs] = useState<FlashBrief[]>(SEED_FLASH_BRIEFS);
  const [news, setNews] = useState<NewsItem[]>(SEED_NEWS_ITEMS);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('刚刚');
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyLevel1, setOnlyLevel1] = useState<boolean>(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(REFRESH_INTERVAL_SECONDS);

  // 加载与刷新最新数据
  const loadData = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const [newsRes, tickerRes] = await Promise.all([
        fetch('/api/news').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/ticker').then((r) => (r.ok ? r.json() : null)),
      ]);

      if (newsRes?.success && newsRes.data) {
        if (newsRes.data.news && newsRes.data.news.length > 0) {
          setNews(newsRes.data.news);
        }
        if (newsRes.data.flashBriefs && newsRes.data.flashBriefs.length > 0) {
          setFlashBriefs(newsRes.data.flashBriefs);
        }
        setLastUpdated(
          new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          })
        );
      }

      if (tickerRes?.success && tickerRes.data?.quotes) {
        setQuotes(tickerRes.data.quotes);
      }
    } catch (e) {
      console.warn('网络同步异常，使用内置深度数据库:', e);
    } finally {
      if (isManual) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
      // 重置30分钟倒计时
      setCountdownSeconds(REFRESH_INTERVAL_SECONDS);
    }
  };

  // 30分钟每秒倒计时与自动拉取逻辑
  useEffect(() => {
    loadData();

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          loadData();
          return REFRESH_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 筛选与搜索过滤
  const filteredNews = news.filter((item) => {
    if (selectedTrack !== 'all' && item.track !== selectedTrack) {
      return false;
    }
    if (onlyLevel1 && item.impactLevel !== 1) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchTakeaway = item.oneLineTakeaway.toLowerCase().includes(q);
      const matchImpact = item.transmissionImpact.toLowerCase().includes(q);
      const matchSource = item.source.toLowerCase().includes(q);
      return matchTitle || matchTakeaway || matchImpact || matchSource;
    }
    return true;
  });

  const tracks: { id: TrackId; items: NewsItem[] }[] = [
    { id: 'us_macro', items: filteredNews.filter((n) => n.track === 'us_macro') },
    { id: 'apac_tech', items: filteredNews.filter((n) => n.track === 'apac_tech') },
    { id: 'war_conflict', items: filteredNews.filter((n) => n.track === 'war_conflict') },
    { id: 'china_domestic', items: filteredNews.filter((n) => n.track === 'china_domestic') },
    { id: 'china_policy', items: filteredNews.filter((n) => n.track === 'china_policy') },
    { id: 'global_cognition', items: filteredNews.filter((n) => n.track === 'global_cognition') },
  ];

  const trackTabs = [
    { id: 'all', label: '全部核心专区', activeClass: 'bg-slate-900 text-white ring-2 ring-slate-900/20', dotClass: 'bg-slate-400' },
    { id: 'us_macro', label: '美股与宏观', activeClass: 'bg-blue-600 text-white shadow-blue-500/20 ring-2 ring-blue-400', dotClass: 'bg-blue-500' },
    { id: 'apac_tech', label: '日韩台芯片', activeClass: 'bg-emerald-600 text-white shadow-emerald-500/20 ring-2 ring-emerald-400', dotClass: 'bg-emerald-500' },
    { id: 'war_conflict', label: '俄乌与美伊战局', activeClass: 'bg-rose-600 text-white shadow-rose-500/20 ring-2 ring-rose-400', dotClass: 'bg-rose-500' },
    { id: 'china_domestic', label: '国内要闻与治理', activeClass: 'bg-amber-600 text-white shadow-amber-500/20 ring-2 ring-amber-400', dotClass: 'bg-amber-500' },
    { id: 'china_policy', label: '发达国家对华', activeClass: 'bg-indigo-600 text-white shadow-indigo-500/20 ring-2 ring-indigo-400', dotClass: 'bg-indigo-500' },
    { id: 'global_cognition', label: '全球认知与顶刊', activeClass: 'bg-purple-600 text-white shadow-purple-500/20 ring-2 ring-purple-400', dotClass: 'bg-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      {/* 顶部行情跑马灯 */}
      <MarketTicker quotes={quotes} />

      {/* 导航头（包含30分钟倒计时与一键复制） */}
      <Header
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
        flashBriefs={flashBriefs}
        lastUpdated={lastUpdated}
        countdownSeconds={countdownSeconds}
      />

      {/* 主体大版面：最大宽度 6xl 居中，阅读通透开阔，彻底消除拥挤挤压感 */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* 顶部：今日决策速递 5 大核心事件 */}
        <FlashBriefing briefs={flashBriefs} />

        {/* 筛选与搜索控制栏 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 mb-8 shadow-sm">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* 赛道切换药丸按钮：各赛道专属色彩，告别单一黑灰色 */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
              {trackTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTrack(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedTrack === tab.id
                      ? `${tab.activeClass} shadow-md`
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${tab.dotClass}`} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* 右侧：仅看重大与搜索 */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <button
                onClick={() => setOnlyLevel1(!onlyLevel1)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                  onlyLevel1
                    ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-sm'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${onlyLevel1 ? 'bg-rose-600 animate-ping' : 'bg-slate-400'}`} />
                <span>仅看重大关注</span>
              </button>

              <div className="relative flex-1 lg:w-60">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索关键词 / 股票 / 战局..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 深度报道精选流 */}
        <div className="space-y-8">
          {tracks
            .filter((t) => selectedTrack === 'all' || t.id === selectedTrack)
            .map((t) => (
              <RegionalTrack
                key={t.id}
                trackId={t.id}
                items={t.items}
              />
            ))}
        </div>
      </main>

      {/* 底部页脚 */}
      <footer className="w-full bg-white border-t border-slate-200 py-8 px-4 text-center mt-16 text-xs sm:text-sm text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-base">全球决策情报终端</span>
            <span className="text-slate-400">· 个人宏观观察专属平台</span>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            信源标准：华尔街日报 · 彭博社 · 日经亚洲 · 金融时报 · 财新网 · 经济学人 · 路透社
          </div>

          <div className="text-xs text-slate-400">
            半小时全自动静默获取更新中
          </div>
        </div>
      </footer>
    </div>
  );
}
