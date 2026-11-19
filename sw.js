// 앱 파일 수정 후 배포할 때 VERSION을 올려야 사용자에게 새 버전이 적용됩니다.
const VERSION = 'v2';
const SHELL = `shell-${VERSION}`;
const TILES = 'tiles';
const MAX_TILES = 400;

const SHELL_FILES = [
  './', 'index.html', 'manifest.webmanifest',
  'src/styles.css', 'src/app.js', 'src/router.js', 'src/db.js', 'src/share.js',
  'src/image.js', 'src/util.js', 'src/constants.js', 'src/mapkit.js',
  'src/views/list.js', 'src/views/map.js', 'src/views/form.js', 'src/views/detail.js',
  'src/views/shared.js', 'src/views/settings.js',
  'vendor/leaflet/leaflet.js', 'vendor/leaflet/leaflet.css',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('shell-') && key !== SHELL) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

async function trimTiles() {
  const cache = await caches.open(TILES);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_TILES; i++) await cache.delete(keys[i]);
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 지도 타일: 캐시 우선, 없으면 네트워크 후 저장 (오프라인에서도 본 지역은 표시)
  if (url.hostname.endsWith('tile.openstreetmap.org')) {
    e.respondWith((async () => {
      const cache = await caches.open(TILES);
      const hit = await cache.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok || res.type === 'opaque') { cache.put(req, res.clone()); trimTiles(); }
        return res;
      } catch {
        return new Response('', { status: 504 });
      }
    })());
    return;
  }

  if (url.origin !== location.origin) return;

  // 앱 파일: 캐시 우선 (오프라인 동작), 백그라운드로 갱신
  e.respondWith((async () => {
    const cache = await caches.open(SHELL);
    const hit = await cache.match(req, { ignoreSearch: true });
    const network = fetch(req).then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    return hit || (await network) || (await cache.match('index.html'));
  })());
});
