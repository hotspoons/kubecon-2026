// The service worker: the app opens with no network after the first visit (conference wifi).
//
// Built into dist/sw.js by the `sw` plugin in vite.config.ts, which fills in VERSION (a hash of the
// shell and its assets, so a new build is a new worker and a new cache) and PRECACHE (the shell,
// the hashed bundle, the schedule snapshot, the icons). Three rules:
//   - /assets/*: cache first; the names are content-hashed, so a hit is always right
//   - navigations: the cached shell ('/'); it only changes when this worker changes, so the
//     shell and the assets it names never drift apart
//   - /data/schedule.json and the Google fonts: stale-while-revalidate: the cached copy right
//     away, a fresh one fetched behind it for next time
// Everything else from this origin is cache first too (the SVGs, the manifest). Speaker photos
// and other third-party requests are left to the network.
//
// The fonts are precached too, best effort: the first visit's page requests happen before this
// worker controls the page, so without it the first offline open would have no fonts. If Google is
// unreachable at install the app still installs, and an offline miss gets an empty stylesheet (the
// system font, quietly) rather than an error.
const VERSION = '__VERSION__'
const PRECACHE = __PRECACHE__
const FONTS_CSS = '__FONTS_CSS__'
const CACHE = `kc26-${VERSION}`

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => Promise.all([c.addAll(PRECACHE), precacheFonts(c)]))
      .then(() => self.skipWaiting()),
  )
})

async function precacheFonts(c) {
  if (!FONTS_CSS.startsWith('https://')) return
  try {
    const res = await fetch(FONTS_CSS)
    if (!res.ok) return
    await c.put(FONTS_CSS, res.clone())
    const urls = [...(await res.text()).matchAll(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/g)].map((m) => m[1])
    await Promise.allSettled(
      urls.map(async (u) => {
        const r = await fetch(u)
        if (r.ok) await c.put(u, r)
      }),
    )
  } catch {
    /* no fonts offline, then */
  }
}

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('kc26-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin === location.origin) {
    if (req.mode === 'navigate') return e.respondWith(shell(req))
    if (url.pathname === '/data/schedule.json') return e.respondWith(staleWhileRevalidate(e, req))
    return e.respondWith(cacheFirst(req))
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') return e.respondWith(fonts(e, req))
})

async function fonts(e, req) {
  const res = await staleWhileRevalidate(e, req)
  if (res.ok) return res
  // offline and never cached: an empty stylesheet (the system font) is quiet; a font file 404 is not fatal
  return new URL(req.url).hostname === 'fonts.googleapis.com' ? new Response('', { headers: { 'Content-Type': 'text/css' } }) : res
}

async function shell(req) {
  const c = await caches.open(CACHE)
  const hit = await c.match('/')
  if (hit) return hit
  const res = await fetch(req)
  if (res.ok) c.put('/', res.clone())
  return res
}

async function cacheFirst(req) {
  const c = await caches.open(CACHE)
  const hit = await c.match(req)
  if (hit) return hit
  const res = await fetch(req)
  if (res.ok) c.put(req, res.clone())
  return res
}

async function staleWhileRevalidate(e, req) {
  const c = await caches.open(CACHE)
  const hit = await c.match(req, { ignoreVary: true })
  const fresh = fetch(req)
    .then((res) => {
      if (res.ok) c.put(req, res.clone())
      return res
    })
    .catch(() => null)
  if (hit) {
    e.waitUntil(fresh)
    return hit
  }
  const res = await fresh
  return res ?? new Response('offline', { status: 503, statusText: 'offline' })
}
