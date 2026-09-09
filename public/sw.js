// 全球决策情报终端 - 生产级 Service Worker (PWA)
const CACHE_VERSION = 'git-pwa-v3.4';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;

// 预缓存核心壳文件与图标
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png'
];

// 1. 安装生命周期 (Install)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache partial note:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. 激活生命周期 (Activate) - 清理过期缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. 拦截请求 (Fetch)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 仅代理同源 GET 请求
  if (req.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // 策略 A: API 动态数据 (/api/news, /api/ticker 等)
  // 若包含 force=true、时间戳 _t 或 no-cache，直接放行直连网络，严禁拦截，保证每次打开与刷新获取最新真实现货/资讯！
  if (url.pathname.startsWith('/api/')) {
    if (
      url.searchParams.has('force') ||
      url.searchParams.has('_t') ||
      req.cache === 'no-store' ||
      req.headers.get('Cache-Control')?.includes('no-cache')
    ) {
      return; // 浏览器直连网络
    }

    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(() => {
          return caches.open(DYNAMIC_CACHE).then((cache) =>
            cache.match(req).then((cachedRes) => {
              if (cachedRes) return cachedRes;
              return new Response(
                JSON.stringify({
                  success: false,
                  offline: true,
                  message: '当前处于离线模式，正在展示本地离线情报。',
                }),
                { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
              );
            })
          );
        })
    );
    return;
  }

  // 策略 B: 静态资源 (_next/static, 字体, 图片, svg, png) -> Cache-First 极速响应
  if (
    url.pathname.startsWith('/_next/static/') ||
    /\.(svg|png|jpg|jpeg|webp|ico|woff2?|css|js)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(req, resClone);
            });
          }
          return networkRes;
        });
      })
    );
    return;
  }

  // 策略 C: 页面导航 -> Network-First 绝对优先获取云端最新构建，彻底解决刷新看到旧网页的问题；离线时自动降级
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(async (networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const resClone = networkRes.clone();
            const cache = await caches.open(STATIC_CACHE);
            await cache.put(req, resClone.clone());
            await cache.put('/', resClone);
          }
          return networkRes;
        })
        .catch(async () => {
          const cached = (await caches.match(req)) || (await caches.match('/'));
          if (cached) return cached;
          return new Response('离线状态', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
        })
    );
    return;
  }

  // 默认策略
  event.respondWith(
    caches.match(req).then((cached) => {
      return cached || fetch(req);
    })
  );
});

// 监听手动跳过等待
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
