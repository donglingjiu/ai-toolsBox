/* Nova SW：同源静态缓存层 v1（大版本发布时 CACHE 改 nova-v2 强制刷新）*/
var CACHE = 'nova-v4';
var CORE = ['./', 'css/tokens.css', 'css/nova.css', 'css/tokens-light.css',
  'js/nova-core.js', 'js/at-cmdk.js', 'js/s1-backup.js', 'js/s1-io.js'];
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(CORE); })
    .then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){ return k !== CACHE; })
      .map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;
  var isNav = req.mode === 'navigate' || /\.html?$/.test(url.pathname);
  if (isNav){ // HTML：命中立即回 + 后台静默更新（SWR）
    e.respondWith(caches.match(req).then(function(hit){
      var net = fetch(req).then(function(r){
        var cp = r.clone();
        caches.open(CACHE).then(function(c){ c.put(req, cp); });
        return r;
      }).catch(function(){ return hit; });
      return hit || net;
    }));
    return;
  }
  e.respondWith(caches.match(req).then(function(hit){ // 静态：缓存优先
    if (hit) return hit;
    return fetch(req).then(function(r){
      var cp = r.clone();
      caches.open(CACHE).then(function(c){ c.put(req, cp); });
      return r;
    });
  }));
});
