// ⭐ 星星人 · 收入本 — Service Worker
var CACHE_NAME = 'starperson-v4';

// 安装：缓存所有核心文件
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll([
        './index.html',
        './manifest.json',
        './chart.umd.min.js'
      ]);
    })
  );
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// 网络优先，断网时回退缓存
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;

  var url = event.request.url;

  // 跳过云端 API 请求（不缓存）
  if (url.indexOf('memfiredb.com') !== -1 || url.indexOf('supabase') !== -1) return;

  event.respondWith(
    fetch(event.request).then(function(response) {
      // 只缓存同源资源
      if (url.indexOf(self.location.origin) === 0) {
        var cloned = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, cloned);
        });
      }
      return response;
    }).catch(function() {
      return caches.match(event.request).then(function(cached) {
        return cached || new Response('离线中…请联网后刷新', { status: 503 });
      });
    })
  );
});
