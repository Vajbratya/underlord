/* Underlord — minimal offline shell.
 *
 * Strategy:
 *  - On install, precache the launch icon set so the home-screen icon and
 *    splash are usable offline immediately after install.
 *  - At runtime, use a stale-while-revalidate cache for same-origin GETs:
 *    serve from cache fast, refresh in the background. HTML navigations
 *    fall back to the cached "/" if the network fails so the player can
 *    re-enter even on the subway.
 *  - Bump CACHE_VERSION to invalidate the cache on a new release.
 *
 * Note: Next.js fingerprints /_next/static URLs, so old chunks naturally
 * stay valid until removed by the LRU cap.
 */
const CACHE_VERSION = "underlord-v1"
const PRECACHE = ["/icon-192.jpg", "/icon-512.jpg", "/icon.svg"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_VERSION)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  if (req.method !== "GET") return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // HTML navigation: network-first with offline fallback.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy))
          return res
        })
        .catch(() =>
          caches.match(req).then((m) => m || caches.match("/")),
        ),
    )
    return
  }

  // Static assets: stale-while-revalidate.
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone()
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy))
          }
          return res
        })
        .catch(() => cached)
      return cached || fetchPromise
    }),
  )
})
