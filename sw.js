/* Casa Mika: keeps the menu working on weak café Wi-Fi.
   Pages, scripts and menu: network first, saved copy when offline.
   Photos, fonts and the Supabase library: saved copy first (they never change under the same address).
   Live data (orders, requests) is never cached. */
var V = "cm-v9";
var CORE = ["./", "index.html", "config.js", "img/logo.png", "img/hero-s.webp"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(V).then(function (c) { return c.addAll(CORE).catch(function () {}); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf("cm-") === 0 && k !== V; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function put(req, res) {
  if (res && (res.ok || res.type === "opaque")) { var copy = res.clone(); caches.open(V).then(function (c) { c.put(req, copy); }); }
  return res;
}
function networkFirst(req) {
  return fetch(req).then(function (res) { return put(req, res); }, function () {
    return caches.match(req, { ignoreSearch: req.mode === "navigate" }).then(function (r) { return r || caches.match("index.html"); });
  });
}
function cacheFirst(req) {
  return caches.match(req).then(function (r) { return r || fetch(req).then(function (res) { return put(req, res); }); });
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var u = new URL(req.url);
  if (u.hostname.indexOf("supabase.co") >= 0 || u.hostname.indexOf("vietqr") >= 0) return;
  if (u.origin === location.origin) {
    if (/\/(img|_fonts)\//.test(u.pathname)) { e.respondWith(cacheFirst(req)); return; }
    e.respondWith(networkFirst(req)); return;
  }
  if (u.hostname === "cdn.jsdelivr.net" || u.hostname === "fonts.gstatic.com" || u.hostname === "fonts.googleapis.com") { e.respondWith(cacheFirst(req)); return; }
});
