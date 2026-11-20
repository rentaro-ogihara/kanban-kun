// カンバン君 Service Worker
// 画面のファイルを更新したら VERSION を上げる
const VERSION = 'kanban-kun-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './favicon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 商品一覧と画面本体は「ネット優先」（常に最新、オフライン時だけ保存分）
  if (url.origin === location.origin && (url.pathname.endsWith('products.json') || req.mode === 'navigate' || url.pathname.endsWith('index.html'))) {
    e.respondWith(fetch(req, { cache: 'no-store' }).then(res => {
      const copy = res.clone();
      caches.open(VERSION).then(c => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }

  // それ以外（アイコン・書体など）は「保存分優先」
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  })));
});
