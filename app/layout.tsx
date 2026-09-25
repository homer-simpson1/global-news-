import type { Metadata, Viewport } from 'next';
import './globals.css';
import PwaManager from '@/components/PwaManager';

export const metadata: Metadata = {
  title: '全球决策情报终端 - 实时宏观与深度决策追踪',
  description:
    '专为宏观认知拓展、美股与算力模型投资、大宗航运、俄乌美伊战局、国内金融与社会治理追踪打造的高信噪比决策级情报终端。',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '全球情报',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="dns-prefetch" href="https://hq.sinajs.cn" />
        <link rel="dns-prefetch" href="https://qt.gtimg.cn" />
        <link rel="dns-prefetch" href="https://push2.eastmoney.com" />
        <link rel="preconnect" href="https://hq.sinajs.cn" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://qt.gtimg.cn" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://push2.eastmoney.com" crossOrigin="anonymous" />
        <meta name="application-name" content="全球情报" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="全球情报" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // 1. 主题偏好秒级应用
                  var saved = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (saved === 'dark' || (!saved && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }

                  // 2. 核心版本防死锁与污染旧闻秒级熔断 (Hard Cache Purge)
                  var APP_VERSION = 'v2026.09.25.v1';
                  var cachedVer = localStorage.getItem('git_app_build_version');
                  var cachedNews = localStorage.getItem('git_cached_news') || '';
                  var cachedBriefs = localStorage.getItem('git_cached_briefs') || '';
                  var isCorrupt = /美方将《|创去年|相关工作稳步推进|涉事主体|刷新\d+年|最高位至|目标到.*目标到|目标到，泰国|刷新2007年月|5\.13%|[，,、\s]+(?:至|在|于|向|报|达)(?:["'，,\s]|$)|\b至$/.test(cachedNews + ' ' + cachedBriefs);
                  
                  if (cachedVer !== APP_VERSION || isCorrupt) {
                    console.log('[Version Buster] 熔断过期/污染缓存，强制加载最新资讯');
                    localStorage.removeItem('git_cached_news');
                    localStorage.removeItem('git_cached_briefs');
                    localStorage.removeItem('git_cached_quotes');
                    localStorage.setItem('git_app_build_version', APP_VERSION);
                  }

                  // 3. 清理旧版 Service Worker 缓存
                  if ('caches' in window) {
                    caches.keys().then(function(keys) {
                      keys.forEach(function(k) {
                        if (!k.includes('v4.2')) {
                          caches.delete(k);
                        }
                      });
                    });
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-100 dark:selection:bg-blue-900 selection:text-blue-900 dark:selection:text-blue-100 transition-colors duration-200">
        {children}
        <PwaManager />
      </body>
    </html>
  );
}
