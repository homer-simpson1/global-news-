'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import MarketTicker from '@/components/MarketTicker';
import Header from '@/components/Header';
import FlashBriefing from '@/components/FlashBriefing';
import OngoingDisasterBanner from '@/components/OngoingDisasterBanner';
import RegionalTrack from '@/components/RegionalTrack';
import { FlashBrief, MarketQuote, NewsItem, TrackId, TimeWindow, QuotesVerificationSummary, DisasterTracker } from '@/lib/types';
import { SEED_FLASH_BRIEFS, SEED_MARKET_QUOTES, GYIRONG_PORT_DISASTER_TRACKER } from '@/data/seedData';
import { SEED_NEWS_ITEMS } from '@/data/seedNews';
import { Search, SlidersHorizontal, Calendar, Clock, Sparkles, X, ChevronDown } from 'lucide-react';
import BackToTopButton from '@/components/BackToTopButton';
import { autoCorrectAllNews } from '@/lib/selfHealingEngine';

const REFRESH_INTERVAL_SECONDS = 3 * 60; // 3分钟 = 180秒自动静默轮询最新资讯

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

function TerminalApp() {
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
  const [isTopBarHidden, setIsTopBarHidden] = useState<boolean>(false);
  const [headerOpacity, setHeaderOpacity] = useState<number>(1);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('git_topbar_hidden');
      if (saved === 'true') {
        setIsTopBarHidden(true);
      }
    } catch (e) {}
  }, []);

  // 页面滚动微动渐变：下滑时顶栏平滑淡出，不引发任何布局重排抖动
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      if (y <= 5) {
        setHeaderOpacity(1);
      } else if (y >= 65) {
        setHeaderOpacity(0);
      } else {
        setHeaderOpacity(Math.max(0, 1 - (y - 5) / 60));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const refreshQuotes = async () => {
    setIsVerifyingQuotes(true);
    try {
      const res = await fetch(`/api/ticker?force=true&_t=${Date.now()}`, { cache: 'no-store' });
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

  // 加载与刷新最新数据 (非阻塞异步流式渲染，优先渲染核心资讯)
  const loadData = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);

    const cacheBuster = `force=true&_t=${Date.now()}`;
    const newsUrl = `/api/news?${cacheBuster}`;
    const tickerUrl = `/api/ticker?${cacheBuster}`;
    const fetchOptions: RequestInit = { cache: 'no-store' };

    // 1. 优先拉取与更新核心资讯数据（不被行情接口拖慢）
    const fetchNewsPromise = fetch(newsUrl, fetchOptions)
      .then((r) => (r.ok ? r.json() : null))
      .then((newsRes) => {
        if (newsRes?.success && newsRes.data) {
          const rawN = newsRes.data.news || [];
          const rawB = newsRes.data.flashBriefs || [];
          const healed = autoCorrectAllNews(rawN, rawB);

          if (healed.news.length > 0) {
            setNews(healed.news);
            try {
              localStorage.setItem('git_cached_news', JSON.stringify(healed.news));
            } catch (e) {}
          }
          if (healed.flashBriefs.length > 0) {
            setFlashBriefs(healed.flashBriefs);
            try {
              localStorage.setItem('git_cached_briefs', JSON.stringify(healed.flashBriefs));
            } catch (e) {}
          }
          setLastUpdated(
            new Date().toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            })
          );
        }
      })
      .catch((e) => {
        console.warn('资讯更新异常，使用离线深度储备:', e);
      });

    // 2. 独立拉取与更新多源实时金融行情
    const fetchTickerPromise = fetch(tickerUrl, fetchOptions)
      .then((r) => (r.ok ? r.json() : null))
      .then((tickerRes) => {
        if (tickerRes?.success && tickerRes.data?.quotes) {
          setQuotes(tickerRes.data.quotes);
          try {
            localStorage.setItem('git_cached_quotes', JSON.stringify(tickerRes.data.quotes));
          } catch (e) {}
          if (tickerRes.data.verificationSummary) {
            setQuotesVerification(tickerRes.data.verificationSummary);
          }
        }
      })
      .catch((e) => {
        // silent
      });

    Promise.allSettled([fetchNewsPromise, fetchTickerPromise]).finally(() => {
      if (isManual) {
        setTimeout(() => setIsRefreshing(false), 300);
      }
    });
  };

  // 1. 0ms 瞬间秒开：挂载时优先提取最近一次本地缓存数据，并执行全域自动纠偏引擎净化，终结界面跳变
  useEffect(() => {
    try {
      const cachedNews = localStorage.getItem('git_cached_news');
      const cachedBriefs = localStorage.getItem('git_cached_briefs');
      const cachedQuotes = localStorage.getItem('git_cached_quotes');

      let parsedN = cachedNews ? JSON.parse(cachedNews) : null;
      let parsedB = cachedBriefs ? JSON.parse(cachedBriefs) : null;

      // 关键防守：如果本地缓存中的新闻全都是今天以前的旧日期（例如 9月5日/9月7日），直接彻底清空旧缓存，绝不把死数据推给界面！
      const today = new Date();
      const beijingTime = new Date(today.getTime() + (today.getTimezoneOffset() + 480) * 60000);
      const todayStr = `${beijingTime.getMonth() + 1}月${beijingTime.getDate()}日`;
      if (Array.isArray(parsedN) && parsedN.length > 0) {
        const hasTodayNews = parsedN.some((n: any) =>
          (n.publishedAt && n.publishedAt.includes(todayStr)) ||
          (n.time && n.time.includes(todayStr))
        );
        if (!hasTodayNews) {
          console.log('[Cache] 本地缓存均为旧日期新闻，主动清空旧缓存并由网络实时拉取');
          localStorage.removeItem('git_cached_news');
          localStorage.removeItem('git_cached_briefs');
          parsedN = null;
          parsedB = null;
        }
      }

      if (!Array.isArray(parsedN) || parsedN.length < 16) parsedN = SEED_NEWS_ITEMS;
      if (!Array.isArray(parsedB) || parsedB.length === 0) parsedB = SEED_FLASH_BRIEFS;

      const healed = autoCorrectAllNews(parsedN, parsedB);
      setNews(healed.news);
      setFlashBriefs(healed.flashBriefs);

      if (cachedQuotes) {
        const parsedQ = JSON.parse(cachedQuotes);
        if (Array.isArray(parsedQ) && parsedQ.length > 0) setQuotes(parsedQ);
      }
    } catch (e) {}

    // 关键：首屏挂载后立即在后台静默发起网络拉取，确保用户打开页面即可即时获取最新发布资讯
    loadData(false);
  }, []);

  // 统一的可见性与刷新时间戳记录，防止后台切换与休眠时的重复或失效调用
  const lastNewsFetchTimeRef = useRef<number>(Date.now());
  const lastTickerFetchTimeRef = useRef<number>(Date.now());

  // 2. 资讯更新与高频行情轮询：集成页面可见性休眠与即时唤醒机制 (Page Visibility Throttling)
  // 当用户切到其他标签页或锁屏时 (document.hidden) 主动休眠定时器，避免后台耗电与发热；切回前台时即时唤醒并精准对齐
  useEffect(() => {
    let newsTimer: NodeJS.Timeout | null = null;
    let newsInterval: NodeJS.Timeout | null = null;
    let tickerInterval: NodeJS.Timeout | null = null;

    const updateTickerSilently = async () => {
      lastTickerFetchTimeRef.current = Date.now();
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

    const runNewsUpdate = (isManual = false) => {
      lastNewsFetchTimeRef.current = Date.now();
      loadData(isManual);
    };

    const startIntervals = () => {
      if (!newsInterval) {
        newsInterval = setInterval(() => {
          runNewsUpdate();
        }, REFRESH_INTERVAL_SECONDS * 1000);
      }
      if (!tickerInterval) {
        tickerInterval = setInterval(() => {
          updateTickerSilently();
        }, 15 * 1000);
      }
    };

    const stopIntervals = () => {
      if (newsInterval) {
        clearInterval(newsInterval);
        newsInterval = null;
      }
      if (tickerInterval) {
        clearInterval(tickerInterval);
        tickerInterval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopIntervals();
      } else {
        const now = Date.now();
        // 若切回前台时距离上次行情已超过 15 秒，立即触发一次静默拉取
        if (now - lastTickerFetchTimeRef.current >= 15 * 1000) {
          updateTickerSilently();
        }
        // 若切回前台时离开超过 1 分钟（60秒），立即触发全量网络拉取，杜绝用户看到旧新闻！
        if (now - lastNewsFetchTimeRef.current >= 60 * 1000) {
          runNewsUpdate();
        }
        startIntervals();
      }
    };

    // ── iOS PWA 独立模式唤醒修复 ────────────────────────────────────────────────
    // iOS Safari PWA（Standalone）下，visibilitychange 行为不可靠：
    // 锁屏/切换 App 后系统会彻底挂起 JS 引擎，setInterval 静默失效，
    // 回到前台时也不一定触发 visibilitychange。
    // 可靠的唤醒信号：pageshow（含 persisted=true BFCache 还原）+ window focus
    const handlePageShow = (e: PageTransitionEvent) => {
      // persisted=true 表示页面从 BFCache 或 iOS 后台快照恢复
      const now = Date.now();
      if (now - lastNewsFetchTimeRef.current >= 60 * 1000) {
        runNewsUpdate();
      }
      if (now - lastTickerFetchTimeRef.current >= 15 * 1000) {
        updateTickerSilently();
      }
      startIntervals();
    };

    const handleWindowFocus = () => {
      // iOS PWA 切回前台时 window 会收到 focus 事件（比 visibilitychange 更可靠）
      const now = Date.now();
      if (now - lastNewsFetchTimeRef.current >= 60 * 1000) {
        runNewsUpdate();
      }
      if (now - lastTickerFetchTimeRef.current >= 15 * 1000) {
        updateTickerSilently();
      }
      startIntervals();
    };

    const handleWindowBlur = () => {
      // 失焦时停止轮询，节省电量（iOS PWA 后台会挂起，防止无效唤醒）
      stopIntervals();
    };

    // 首屏挂载后延迟 60ms 释放浏览器主线程，优先保障首屏秒开渲染
    newsTimer = setTimeout(() => {
      runNewsUpdate();
      startIntervals();
    }, 60);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      if (newsTimer) clearTimeout(newsTimer);
      stopIntervals();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  // 筛选与搜索过滤（useMemo 确保只有搜索、专区或数据发生改变时才执行过滤）
  const filteredNews = React.useMemo(() => {
    return news.filter((item) => {
      // 核心保护：特大灾害持续追踪档案（吉隆口岸等）绝不被速递过滤，必须常驻正文专区供读者深度阅读！
      const isDisasterTrackerItem = Boolean(item.isOngoingDisaster || item.disasterTracker || item.id === 'GID-JILONG-PORT-DISASTER');

      if (!isDisasterTrackerItem) {
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
    // 1. 彻底清除可能遮蔽吉隆口岸卡片的筛选条件，保证正文卡片立即处于可见状态
    if (searchQuery) setSearchQuery('');
    if (onlyLevel1) setOnlyLevel1(false);
    if (timeFilter !== 'ALL') setTimeFilter('ALL');
    // 2. 强制切换至【国内重大要闻与治理】专区，确保正文专区首篇即为该特大灾害详实档案
    setSelectedTrack('china_domestic');

    // 3. 轮询等待 DOM 渲染完成，精准锚定特大灾害卡片，绝对排除误选其他板块卡片
    let attempts = 0;
    const pollAndScroll = () => {
      attempts++;
      const el =
        document.getElementById('disaster-full-lifecycle-card') ||
        document.getElementById('news-card-GID-JILONG-PORT-DISASTER') ||
        document.getElementById('news-card-TRK-GYIRONG-PORT-2026') ||
        document.querySelector('[data-disaster-card="true"]');

      if (el) {
        const cardContainer = (el.closest('[data-disaster-card="true"]') || el.closest('[id^="news-card-"]') || el) as HTMLElement;
        cardContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        cardContainer.classList.add('ring-4', 'ring-rose-500', 'shadow-2xl', 'transition-all', 'duration-300');
        setTimeout(() => {
          cardContainer.classList.remove('ring-4', 'ring-rose-500', 'shadow-2xl');
        }, 3000);
      } else if (attempts < 15) {
        setTimeout(pollAndScroll, 50);
      }
    };
    setTimeout(pollAndScroll, 40);
  }, [searchQuery, onlyLevel1, timeFilter]);

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
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 pb-[env(safe-area-inset-bottom,1.5rem)]">
      {/* 1. 顶栏 (Header)：位于页面最顶部。页面下滑时平滑渐变淡出并自然滚出视口，从根源上彻底消除与股市栏图层重叠冲突 */}
      {!isTopBarHidden && (
        <div
          className="w-full relative z-20 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-xs transition-opacity duration-150"
          style={{
            opacity: headerOpacity,
          }}
        >
          <Header
            onRefresh={() => loadData(true)}
            isRefreshing={isRefreshing}
            flashBriefs={flashBriefs}
            lastUpdated={lastUpdated}
            newsItems={news}
            quotes={quotes}
            onToggleHideTopBar={() => {
              setIsTopBarHidden(true);
              try {
                localStorage.setItem('git_topbar_hidden', 'true');
              } catch (e) {}
            }}
            isTopBarHidden={isTopBarHidden}
          />
        </div>
      )}

      {/* 2. 股市行情跑马灯：位于顶栏正下方，sticky top-0 永久吸顶。顶栏滚出视口后，股市栏自然无缝锁定在屏幕最顶端 (top-0)，高度恒定为 38px */}
      <div className="sticky top-0 z-40 w-full select-none bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <MarketTicker
          quotes={quotes}
          verificationSummary={quotesVerification}
          onRefreshQuotes={refreshQuotes}
          isRefreshingQuotes={isVerifyingQuotes}
        />
      </div>

      {/* 当用户手动隐藏顶栏时，在股市栏下方居中悬浮一个精致小胶囊，点击即可一键展开恢复 */}
      {isTopBarHidden && (
        <div className="fixed top-[46px] left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <button
            onClick={() => {
              setIsTopBarHidden(false);
              try {
                localStorage.setItem('git_topbar_hidden', 'false');
              } catch (e) {}
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-900/90 dark:bg-slate-800/90 hover:bg-slate-900 dark:hover:bg-slate-700 text-white border border-slate-700/50 dark:border-slate-600/50 shadow-xl backdrop-blur-md cursor-pointer select-none transition-all hover:scale-105 active:scale-95"
            title="点击展开顶部固定导航栏"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>展开顶栏</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
          </button>
        </div>
      )}

      {/* 主体大版面 */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* 全球特大突发灾害 · 全生命周期持续追踪看板（智能情境感知折叠：全部/国内常驻，细分专区精简胶囊） */}
        <OngoingDisasterBanner
          trackers={
            news.some((n) => n.disasterTracker && n.disasterTracker.status === 'ONGOING')
              ? news.filter((n) => n.disasterTracker && n.disasterTracker.status === 'ONGOING').map((n) => n.disasterTracker!)
              : [GYIRONG_PORT_DISASTER_TRACKER]
          }
          selectedTrack={selectedTrack}
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

            {/* 专区快速切换：移动端原生横向滑动胶囊栏 (Horizontal Scroll Strip)，PC端 flex-wrap 平铺 */}
            <div className="relative w-full overflow-hidden">
              <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar flex-nowrap lg:flex-wrap py-1 scroll-smooth">
                {trackTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTrack(tab.id)}
                    className={`h-9 sm:h-10 inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer border shadow-xs flex-shrink-0 ${
                      selectedTrack === tab.id ? tab.activeClass : tab.idleClass
                    }`}
                  >
                    <span
                      className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${
                        selectedTrack === tab.id ? 'bg-white' : tab.dotClass
                      } flex-shrink-0`}
                    />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 第二层：时效导航 + 重大关注 + 搜索框 */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* 左侧：时钟周期与重大关注 */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* 时效周期切换胶囊 */}
              <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0">
                {timeTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setTimeFilter(tab.id)}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                className={`h-9 inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap shadow-xs flex-shrink-0 ${
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
                className="h-9 inline-flex items-center gap-1.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap shadow-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700 flex-shrink-0"
                title="直达正在全生命周期持续追踪的吉隆口岸特大跨境地质灾害看板"
              >
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse flex-shrink-0" />
                <span>持续追踪灾害 (1)</span>
              </button>
            </div>

            {/* 搜索框（iOS 防缩放：input 默认 text-base，在 sm 上 text-sm） */}
            <div className="relative w-full lg:w-72 h-9">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索实体词 / 股票 / 战局..."
                className="h-9 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-9 text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-slate-800 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title="清空搜索与实体标签"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* 第三层：热点实体快速检索胶囊 Tag（移动端原生横向滑动，拒绝折行堆叠） */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center gap-2 overflow-x-auto no-scrollbar flex-nowrap lg:flex-wrap py-1 scroll-smooth">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>热搜实体:</span>
            </span>
            <div className="flex items-center gap-1.5 flex-nowrap lg:flex-wrap">
              {HOT_TAGS.map((tag) => {
                const isActive = searchQuery === tag.keyword || searchQuery.trim() === tag.label.replace(/^#/, '');
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
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border select-none flex-shrink-0 ${
                      isActive
                        ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-sm ring-2 ring-blue-400/40 scale-105 font-bold'
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
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold ml-1 transition-colors cursor-pointer border border-rose-200 dark:border-rose-900"
                >
                  <X className="w-3 h-3" />
                  <span>重置筛选</span>
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
      <footer className="w-full bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-8 px-4 text-center mt-16 text-xs sm:text-sm text-slate-500 dark:text-slate-400 transition-colors duration-200 pb-[env(safe-area-inset-bottom,1.5rem)]">
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

      {/* 一键回到页面顶端浮动按钮 */}
      <BackToTopButton />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <TerminalApp />
    </Suspense>
  );
}
