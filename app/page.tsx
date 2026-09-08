'use client';

import React, { useState, useEffect } from 'react';
import MarketTicker from '@/components/MarketTicker';
import Header from '@/components/Header';
import FlashBriefing from '@/components/FlashBriefing';
import OngoingDisasterBanner from '@/components/OngoingDisasterBanner';
import RegionalTrack from '@/components/RegionalTrack';
import { FlashBrief, MarketQuote, NewsItem, TrackId, TimeWindow, QuotesVerificationSummary, DisasterTracker } from '@/lib/types';
import { SEED_FLASH_BRIEFS, SEED_MARKET_QUOTES, GYIRONG_PORT_DISASTER_TRACKER } from '@/data/seedData';
import { SEED_NEWS_ITEMS } from '@/data/seedNews';
import { Search, SlidersHorizontal, Calendar, Clock, Sparkles } from 'lucide-react';

const REFRESH_INTERVAL_SECONDS = 30 * 60; // 30分钟 = 1800秒

const HOT_TAGS = [
  { label: '#美债收益率', keyword: '美债' },
  { label: '#台积电2nm', keyword: '台积电' },
  { label: '#红海集运', keyword: '红海' },
  { label: '#五角大楼测谎', keyword: '五角大楼' },
  { label: '#吉隆口岸抢通', keyword: '吉隆口岸' },
  { label: '#王建军案', keyword: '王建军' },
  { label: '#特别国债', keyword: '特别国债' },
  { label: '#芯片管制', keyword: '商务部' },
];

type TimeFilterType = 'ALL' | 'TODAY' | 'PAST_24H' | 'HISTORIC';

export default function Home() {
  const [quotes, setQuotes] = useState<MarketQuote[]>(SEED_MARKET_QUOTES);
  const [flashBriefs, setFlashBriefs] = useState<FlashBrief[]>(SEED_FLASH_BRIEFS);
  const [news, setNews] = useState<NewsItem[]>(SEED_NEWS_ITEMS);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('刚刚');
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyLevel1, setOnlyLevel1] = useState<boolean>(false);
  const [quotesVerification, setQuotesVerification] = useState<QuotesVerificationSummary | null>(null);
  const [isVerifyingQuotes, setIsVerifyingQuotes] = useState<boolean>(false);

  const refreshQuotes = async () => {
    setIsVerifyingQuotes(true);
    try {
      const res = await fetch('/api/ticker?force=true');
      if (res.ok) {
        const d = await res.json();
        if (d?.success && d.data?.quotes) {
          setQuotes(d.data.quotes);
          if (d.data.verificationSummary) {
            setQuotesVerification(d.data.verificationSummary);
          }
        }
      }
    } catch (e) {
      // silent fallback
    } finally {
      setTimeout(() => setIsVerifyingQuotes(false), 500);
    }
  };

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
          try {
            localStorage.setItem('git_cached_news', JSON.stringify(newsRes.data.news));
          } catch (e) {}
        }
        if (newsRes.data.flashBriefs && newsRes.data.flashBriefs.length > 0) {
          setFlashBriefs(newsRes.data.flashBriefs);
          try {
            localStorage.setItem('git_cached_briefs', JSON.stringify(newsRes.data.flashBriefs));
          } catch (e) {}
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
        try {
          localStorage.setItem('git_cached_quotes', JSON.stringify(tickerRes.data.quotes));
        } catch (e) {}
        if (tickerRes.data.verificationSummary) {
          setQuotesVerification(tickerRes.data.verificationSummary);
        }
      }
    } catch (e) {
      console.warn('网络同步异常，按需加载内置离线深度数据库:', e);
      try {
        const { SEED_NEWS_ITEMS } = await import('@/data/seedNews');
        setNews(SEED_NEWS_ITEMS);
      } catch (err) {
        // silent
      }
    } finally {
      if (isManual) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  // 1. 0ms 瞬间秒开：挂载时优先提取最近一次本地缓存数据，彻底终结网络请求带来的等待感与界面跳变
  useEffect(() => {
    try {
      const cachedNews = localStorage.getItem('git_cached_news');
      const cachedBriefs = localStorage.getItem('git_cached_briefs');
      const cachedQuotes = localStorage.getItem('git_cached_quotes');
      if (cachedNews) {
        const parsed = JSON.parse(cachedNews);
        if (Array.isArray(parsed) && parsed.length >= 16) {
          setNews(parsed);
        } else {
          setNews(SEED_NEWS_ITEMS);
        }
      }
      if (cachedBriefs) {
        const parsed = JSON.parse(cachedBriefs);
        if (Array.isArray(parsed) && parsed.length > 0) setFlashBriefs(parsed);
      }
      if (cachedQuotes) {
        const parsed = JSON.parse(cachedQuotes);
        if (Array.isArray(parsed) && parsed.length > 0) setQuotes(parsed);
      }
    } catch (e) {}
  }, []);

  // 2. 30分钟静默拉取与初始化
  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData();
    }, REFRESH_INTERVAL_SECONDS * 1000);

    return () => clearInterval(interval);
  }, []);

  // 实时全球行情高频静默刷新（每 30 秒自动拉取）
  useEffect(() => {
    const updateTicker = async () => {
      try {
        const res = await fetch('/api/ticker');
        if (res.ok) {
          const d = await res.json();
          if (d?.success && d.data?.quotes) {
            setQuotes(d.data.quotes);
            if (d.data.verificationSummary) {
              setQuotesVerification(d.data.verificationSummary);
            }
          }
        }
      } catch (err) {
        // 静默捕获
      }
    };

    const tickerInterval = setInterval(updateTicker, 30 * 1000);
    return () => clearInterval(tickerInterval);
  }, []);

  // 筛选与搜索过滤（useMemo 确保只有搜索、专区或数据发生改变时才执行过滤）
  const filteredNews = React.useMemo(() => {
    return news.filter((item) => {
      // 核心去重门禁：若某篇新闻已在“今日决策速递”中推出，下方各专区板块绝不重复出现！
      const cleanItemTitle = item.title.replace(/^[【\[][^】\]]+[】\]]\s*/, '').trim().toLowerCase();
      const isAlreadyInFlash = flashBriefs.some((f) => {
        if (f.id === item.id || f.id === `flash-${item.id}` || `flash-${f.id}` === item.id) return true;
        const cleanFlashContent = f.content.replace(/^[【\[][^】\]]+[】\]]\s*/, '').trim().toLowerCase();
        if (cleanItemTitle === cleanFlashContent) return true;
        if (cleanItemTitle.length > 8 && cleanFlashContent.length > 8) {
          if (cleanItemTitle.includes(cleanFlashContent) || cleanFlashContent.includes(cleanItemTitle)) return true;
        }
        return false;
      });

      if (isAlreadyInFlash) {
        return false;
      }

      if (selectedTrack !== 'all' && item.track !== selectedTrack) {
        return false;
      }
      if (onlyLevel1 && item.impactLevel !== 1) {
        return false;
      }
      // 时效筛选
      if (timeFilter === 'TODAY') {
        if (item.timeWindow && item.timeWindow !== 'TODAY') return false;
      } else if (timeFilter === 'PAST_24H') {
        if (item.timeWindow && item.timeWindow === 'HISTORIC') return false;
      } else if (timeFilter === 'HISTORIC') {
        if (item.timeWindow && item.timeWindow !== 'HISTORIC') return false;
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
  }, [news, flashBriefs, selectedTrack, onlyLevel1, timeFilter, searchQuery]);

  const handleScrollToDisasterCard = React.useCallback((cardId?: string) => {
    if (selectedTrack !== 'all' && selectedTrack !== 'china_domestic') {
      setSelectedTrack('china_domestic');
    }
    setTimeout(() => {
      const targetId = cardId ? `news-card-${cardId}` : 'news-card-GID-JILONG-PORT-DISASTER';
      const el = document.getElementById(targetId) || document.getElementById('news-card-GID-JILONG-PORT-DISASTER') || document.querySelector('[id^="news-card-"]');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-4', 'ring-rose-500');
        setTimeout(() => el.classList.remove('ring-4', 'ring-rose-500'), 2500);
      }
    }, 80);
  }, [selectedTrack]);

  const tracks: { id: TrackId; items: NewsItem[] }[] = React.useMemo(() => [
    { id: 'us_macro', items: filteredNews.filter((n) => n.track === 'us_macro') },
    { id: 'apac_tech', items: filteredNews.filter((n) => n.track === 'apac_tech') },
    { id: 'commodities_shipping', items: filteredNews.filter((n) => n.track === 'commodities_shipping') },
    { id: 'war_conflict', items: filteredNews.filter((n) => n.track === 'war_conflict') },
    { id: 'china_domestic', items: filteredNews.filter((n) => n.track === 'china_domestic') },
    { id: 'china_policy', items: filteredNews.filter((n) => n.track === 'china_policy') },
    { id: 'global_cognition', items: filteredNews.filter((n) => n.track === 'global_cognition') },
  ], [filteredNews]);

  const trackTabs = [
    {
      id: 'all',
      label: '全部核心专区',
      activeClass: 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 shadow-md ring-2 ring-slate-800 dark:ring-white border-slate-900 dark:border-white',
      idleClass: 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 font-bold',
      dotClass: 'bg-slate-600 dark:bg-slate-400',
    },
    {
      id: 'us_macro',
      label: '美股与宏观',
      activeClass: 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-500 border-blue-600',
      idleClass: 'bg-blue-50/90 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-300 border-blue-200/90 dark:border-blue-800',
      dotClass: 'bg-blue-600',
    },
    {
      id: 'apac_tech',
      label: '算力模型与芯片',
      activeClass: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-500 border-emerald-600',
      idleClass: 'bg-emerald-50/90 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border-emerald-200/90 dark:border-emerald-800',
      dotClass: 'bg-emerald-600',
    },
    {
      id: 'commodities_shipping',
      label: '大宗商品与航运',
      activeClass: 'bg-teal-600 text-white shadow-md shadow-teal-500/25 ring-2 ring-teal-500 border-teal-600',
      idleClass: 'bg-teal-50/90 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-800 dark:text-teal-300 border-teal-200/90 dark:border-teal-800',
      dotClass: 'bg-teal-600',
    },
    {
      id: 'war_conflict',
      label: '俄乌与美伊战局',
      activeClass: 'bg-rose-600 text-white shadow-md shadow-rose-500/25 ring-2 ring-rose-500 border-rose-600',
      idleClass: 'bg-rose-50/90 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-800 dark:text-rose-300 border-rose-200/90 dark:border-rose-800',
      dotClass: 'bg-rose-600',
    },
    {
      id: 'china_domestic',
      label: '国内要闻与治理',
      activeClass: 'bg-amber-600 text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-500 border-amber-600',
      idleClass: 'bg-amber-50/90 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-300 border-amber-300/80 dark:border-amber-700',
      dotClass: 'bg-amber-600',
    },
    {
      id: 'china_policy',
      label: '发达国家对华',
      activeClass: 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-500 border-indigo-600',
      idleClass: 'bg-indigo-50/90 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-900 dark:text-indigo-300 border-indigo-200/90 dark:border-indigo-800',
      dotClass: 'bg-indigo-600',
    },
    {
      id: 'global_cognition',
      label: '全球认知与顶刊',
      activeClass: 'bg-purple-600 text-white shadow-md shadow-purple-500/25 ring-2 ring-purple-500 border-purple-600',
      idleClass: 'bg-purple-50/90 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-900 dark:text-purple-300 border-purple-200/90 dark:border-purple-800',
      dotClass: 'bg-purple-600',
    },
  ];

  const timeTabs: { id: TimeFilterType; label: string }[] = [
    { id: 'ALL', label: '全部时段' },
    { id: 'TODAY', label: '今日核心' },
    { id: 'PAST_24H', label: '近24小时' },
    { id: 'HISTORIC', label: '历史精选' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* 顶部行情跑马灯（集成全网多源0 Token实时交叉验真中心） */}
      <MarketTicker
        quotes={quotes}
        verificationSummary={quotesVerification}
        onRefreshQuotes={refreshQuotes}
        isRefreshingQuotes={isVerifyingQuotes}
      />

      {/* 导航头（包含30分钟倒计时、长图生成、暗黑模式与一键复制） */}
      <Header
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
        flashBriefs={flashBriefs}
        lastUpdated={lastUpdated}
        newsItems={news}
        quotes={quotes}
      />

      {/* 主体大版面 */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* 全球特大突发灾害 · 全生命周期持续追踪看板（常驻置顶，直到正式恢复通关结案） */}
        <OngoingDisasterBanner
          trackers={
            news.some((n) => n.disasterTracker && n.disasterTracker.status === 'ONGOING')
              ? news.filter((n) => n.disasterTracker && n.disasterTracker.status === 'ONGOING').map((n) => n.disasterTracker!)
              : [GYIRONG_PORT_DISASTER_TRACKER]
          }
          onScrollToCard={handleScrollToDisasterCard}
        />

        {/* 顶部：今日决策速递核心事件 */}
        <FlashBriefing briefs={flashBriefs} />

        {/* 筛选与搜索控制栏 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5 mb-8 shadow-sm space-y-4">
          {/* 第一层：7 大核心专区赛道 */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span>情报专区切换</span>
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                当前专区：{trackTabs.find((t) => t.id === selectedTrack)?.label} · 共 {filteredNews.length} 篇深度追踪
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              {trackTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTrack(tab.id)}
                  className={`h-10 inline-flex items-center gap-2 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer border shadow-xs ${
                    selectedTrack === tab.id ? tab.activeClass : tab.idleClass
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      selectedTrack === tab.id ? 'bg-white' : tab.dotClass
                    } flex-shrink-0`}
                  />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 第二层：时效导航 + 重大关注 + 搜索框 */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* 左侧：时钟周期与重大关注 */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* 时效周期切换胶囊 */}
              <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {timeTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setTimeFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      timeFilter === tab.id
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* 仅看重大关注开关 */}
              <button
                onClick={() => setOnlyLevel1(!onlyLevel1)}
                className={`h-9 inline-flex items-center gap-2 px-3.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap shadow-xs ${
                  onlyLevel1
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/25 ring-2 ring-rose-400'
                    : 'bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-800 dark:text-rose-300 border-rose-200/90 dark:border-rose-800'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    onlyLevel1 ? 'bg-white animate-ping' : 'bg-rose-500'
                  } flex-shrink-0`}
                />
                <span>仅看重大关注</span>
              </button>

              {/* 持续追踪特大灾害直达按钮 */}
              <button
                type="button"
                onClick={() => handleScrollToDisasterCard('GID-JILONG-PORT-DISASTER')}
                className="h-9 inline-flex items-center gap-1.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap shadow-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700"
                title="直达正在全生命周期持续追踪的吉隆口岸特大跨境地质灾害看板"
              >
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse flex-shrink-0" />
                <span>持续追踪灾害 (1)</span>
              </button>
            </div>

            {/* 搜索框 */}
            <div className="relative w-full lg:w-72 h-9">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索实体词 / 股票 / 战局..."
                className="h-9 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-slate-800 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-xs"
              />
            </div>
          </div>

          {/* 第三层：热点实体快速检索胶囊 Tag（避免空搜挫败） */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>热搜实体:</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {HOT_TAGS.map((tag) => {
                const isActive = searchQuery === tag.keyword;
                return (
                  <button
                    key={tag.keyword}
                    type="button"
                    onClick={() => {
                      if (isActive) {
                        setSearchQuery('');
                      } else {
                        setSearchQuery(tag.keyword);
                        if (selectedTrack !== 'all') {
                          setSelectedTrack('all');
                        }
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border select-none ${
                      isActive
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs scale-105'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {tag.label}
                  </button>
                );
              })}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-2 py-0.5 rounded text-xs text-rose-500 hover:text-rose-600 font-bold ml-1 transition-colors cursor-pointer"
                >
                  清空筛选 ×
                </button>
              )}
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
      <footer className="w-full bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-8 px-4 text-center mt-16 text-xs sm:text-sm text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white text-base">全球决策情报终端</span>
            <span className="text-slate-400 dark:text-slate-500">· 个人宏观观察专属平台</span>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            信源标准：华尔街日报 · 彭博社 · 日经亚洲 · 金融时报 · 财新网 · 经济学人 · 路透社
          </div>

          <div className="text-xs text-slate-400 dark:text-slate-500">
            半小时全自动静默获取更新中
          </div>
        </div>
      </footer>
    </div>
  );
}
