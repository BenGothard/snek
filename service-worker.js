const CACHE_NAME = 'snek-cache-v1';
const URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/game.js',
  '/asset_loader.js',
  '/http_client.js',
  '/remote_config.js',
  '/scores.js',
  '/assets/eat.mp3',
  '/assets/gameover.mp3'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
