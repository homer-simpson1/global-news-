// 全球决策情报终端 - 生产级 Service Worker (PWA)
const CACHE_VERSION = 'git-pwa-v1.7';
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

  // 策略 A: API 动态数据 (/api/news, /api/ticker 等) -> Stale-While-Revalidate 毫秒级秒开 + 后台静默保鲜
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.match(req).then((cachedRes) => {
          const fetchPromise = fetch(req)
            .then((networkRes) => {
              if (networkRes && networkRes.status === 200) {
                cache.put(req, networkRes.clone());
              }
              return networkRes;
            })
            .catch(() => {
              if (cachedRes) return cachedRes;
              return new Response(
                JSON.stringify({
                  success: false,
                  offline: true,
                  message: '当前处于离线模式，正在展示本地离线情报。',
                }),
                { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
              );
            });

          // 核心优化：若本地已有缓存，0ms 立即瞬时返回展示；网络静默更新缓存
          return cachedRes || fetchPromise;
        });
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

  // 策略 C: 页面导航 -> Stale-While-Revalidate 极速秒开 (有本地缓存 0ms 瞬间打开，后台静默联网保鲜)
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              const resClone = networkRes.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(req, resClone);
              });
            }
            return networkRes;
          })
          .catch(() => {
            return cached || caches.match('/');
          });

        // 核心提速：若本地已有网页缓存骨架，0ms 立即瞬时呈现，彻底杜绝白屏与网络等待感
        return cached || fetchPromise;
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
