// Minimal offline app-shell cache for the PA-30 Performance Calculator.
// Service workers only run under http(s), never file:// — index.html guards
// registration accordingly, so this file is simply never loaded when the
// app is opened directly from disk.

var CACHE_NAME = 'pa30-calc-v8';
var ASSETS = [
  './index.html',
  './style.css',
  './app.js',
  './data.js',
  './airports.js',
  './runways.js',
  './navaids.js',
  './fixes.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './data/fig5-02-airspeed-calibration.json',
  './data/fig5-06-takeoff-ground-run.json',
  './data/fig5-07-takeoff-distance-50ft.json',
  './data/fig5-08-accelerate-stop.json',
  './data/fig5-09-multi-engine-roc.json',
  './data/fig5-10-single-engine-roc.json',
  './data/fig5-11-vx-vy.json',
  './data/fig5-12-true-airspeed.json',
  './data/fig5-13-range-profile.json',
  './data/fig5-14-endurance-profile.json',
  './data/fig5-15-landing-ground-roll.json',
  './data/fig5-16-landing-distance-50ft.json',
  './data/fig5-17-power-setting-table.json',
  './data/fig6-01-cg-envelope.json'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.filter(function (n) { return n !== CACHE_NAME; }).map(function (n) { return caches.delete(n); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      var network = fetch(event.request).then(function (resp) {
        if (resp && resp.ok) {
          var copy = resp.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, copy); });
        }
        return resp;
      }).catch(function () { return cached; });
      return cached || network;
    })
  );
});
