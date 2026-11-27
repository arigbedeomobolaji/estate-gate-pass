// NAF Base Access Control — Service Worker
// Level 1: static asset cache + page cache
// Level 2: POST /api/verify cached per-token for 10 minutes

const CACHE_STATIC = 'naf-static-v1';   // immutable /_next/static/ files
const CACHE_PAGES  = 'naf-pages-v1';    // app HTML pages
const CACHE_VERIFY = 'naf-verify-v1';   // permit verify results
const ALL_CACHES   = [CACHE_STATIC, CACHE_PAGES, CACHE_VERIFY];
const VERIFY_TTL   = 10 * 60 * 1000;   // 10 minutes in ms

// ── Install: precache offline fallback ───────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_PAGES)
      .then(c => c.addAll(['/offline.html']))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: delete any old cache versions ───────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => !ALL_CACHES.includes(k)).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch routing ─────────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Level 2 — intercept POST /api/verify before the GET-only guard below
  if (url.pathname === '/api/verify' && e.request.method === 'POST') {
    e.respondWith(handleVerify(e.request));
    return;
  }

  // Only cache GET from here on
  if (e.request.method !== 'GET') return;

  // Level 1a — immutable hashed Next.js bundles → cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(handleStatic(e.request));
    return;
  }

  // Skip dynamic /_next/ routes (data fetches, image optimisation, etc.)
  if (url.pathname.startsWith('/_next/')) return;

  // Skip all other API routes — never cache mutations or auth
  if (url.pathname.startsWith('/api/')) return;

  // Level 1b — app pages → network-first, serve cache when offline
  e.respondWith(handlePage(e.request));
});

// ── Level 1a: cache-first for immutable static assets ────────────────────
async function handleStatic(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_STATIC);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Static asset not in cache', { status: 503 });
  }
}

// ── Level 1b: network-first for pages ────────────────────────────────────
async function handlePage(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_PAGES);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offline = await caches.match('/offline.html');
    return offline || new Response('Offline', { status: 503 });
  }
}

// ── Level 2: network-first for POST /api/verify with 10-min token cache ──
async function handleVerify(request) {
  let token;
  try {
    const body = await request.clone().json();
    token = body.token;
  } catch {
    // Can't parse body — just pass through
    return fetch(request);
  }

  // Use a synthetic GET URL as the cache key (Cache API requires a Request/URL)
  const cacheKey = `/api/verify?token=${encodeURIComponent(token)}`;

  try {
    const response = await fetch(request);
    if (response.ok) {
      // Store result with a timestamp so we know its age later
      const data = await response.clone().json();
      const withTs = new Response(
        JSON.stringify({ ...data, _cachedAt: Date.now() }),
        { headers: { 'content-type': 'application/json' } }
      );
      const cache = await caches.open(CACHE_VERIFY);
      cache.put(cacheKey, withTs);
    }
    return response;
  } catch {
    // Network failed — try to serve from cache if within TTL
    const cache = await caches.open(CACHE_VERIFY);
    const cached = await cache.match(cacheKey);
    if (cached) {
      const data = await cached.json();
      const age = Date.now() - (data._cachedAt || 0);
      if (age < VERIFY_TTL) {
        const { _cachedAt, ...rest } = data;
        return new Response(
          JSON.stringify({ ...rest, _cached: true, _cacheAgeSeconds: Math.round(age / 1000) }),
          { headers: { 'content-type': 'application/json' } }
        );
      }
      // Cache exists but expired — delete it
      cache.delete(cacheKey);
    }
    // No usable cache — tell the client we're offline
    return new Response(
      JSON.stringify({ ok: false, code: 'OFFLINE' }),
      { status: 503, headers: { 'content-type': 'application/json' } }
    );
  }
}

// ── Push notifications ────────────────────────────────────────────────────
self.addEventListener('push', e => {
  if (!e.data) return;
  let payload;
  try { payload = e.data.json(); } catch { payload = { title: 'NAF Base Access Control', body: e.data.text() }; }

  const title = payload.title || 'NAF Base Access Control';
  const options = {
    body: payload.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: payload.tag || 'naf-notification',
    data: payload.data || {},
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(self.location.origin) && 'focus' in c);
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});
