/**
 * MediQueue Font Caching Service Worker
 *
 * Implements a cache-first strategy for Google Fonts resources.
 * Fonts are cached for up to 30 days. If the cache is unavailable
 * or a cached entry has expired, the font is re-fetched from the
 * network and re-cached. If the network fetch also fails, the
 * browser falls back to system fonts via font-display: swap.
 *
 * Requirements: 11.5, 11.6
 */

const FONT_CACHE = 'mediqueue-fonts-v1'
const FONT_ORIGINS = [
  'https://fonts.gstatic.com',
  'https://fonts.googleapis.com',
]
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds

// ─── Install ─────────────────────────────────────────────────────────────────
// Skip waiting so the new SW activates immediately without waiting for
// existing tabs to close.
self.addEventListener('install', () => {
  self.skipWaiting()
})

// ─── Activate ────────────────────────────────────────────────────────────────
// Claim all clients so the SW controls existing pages right away.
// Also prune any stale font caches from previous SW versions.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('mediqueue-fonts-') && name !== FONT_CACHE)
          .map((name) => caches.delete(name))
      )
    }).then(() => self.clients.claim())
  )
})

// ─── Fetch ───────────────────────────────────────────────────────────────────
// Intercept requests to Google Fonts origins and apply cache-first strategy.
self.addEventListener('fetch', (event) => {
  const isFontRequest = FONT_ORIGINS.some((origin) =>
    event.request.url.startsWith(origin)
  )

  if (isFontRequest) {
    event.respondWith(cacheFirstWithExpiry(event.request))
  }
  // All other requests pass through to the network unmodified.
})

/**
 * Cache-first strategy with 30-day expiry.
 *
 * 1. Open the font cache.
 * 2. If a cached response exists and is within the 30-day window, return it.
 * 3. Otherwise fetch from the network, stamp with `sw-cached-at`, cache it,
 *    and return the network response.
 * 4. If the network fetch fails (offline / CDN unreachable), return the
 *    expired cached response as a last resort, or a network error response
 *    so the browser falls back to system fonts via font-display: swap.
 *
 * Requirements: 11.5, 11.6
 *
 * @param {Request} request - The font resource request.
 * @returns {Promise<Response>}
 */
async function cacheFirstWithExpiry(request) {
  let cache

  try {
    cache = await caches.open(FONT_CACHE)
  } catch {
    // Cache API unavailable (e.g. private browsing in some browsers).
    // Fall through to a plain network fetch — system fonts will be used
    // via font-display: swap if this also fails.
    return fetchAndReturn(request)
  }

  // ── 1. Check cache ──────────────────────────────────────────────────────
  const cached = await cache.match(request)

  if (cached) {
    const cachedAt = cached.headers.get('sw-cached-at')
    const age = cachedAt ? Date.now() - parseInt(cachedAt, 10) : Infinity

    if (age < MAX_AGE_MS) {
      // Cache hit within lifetime — serve immediately.
      return cached
    }
    // Cache hit but expired — fall through to re-fetch.
  }

  // ── 2. Fetch from network ───────────────────────────────────────────────
  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      // Clone the response so we can read the body for caching while also
      // returning the original to the browser.
      const responseToCache = networkResponse.clone()

      // Stamp with the current timestamp so we can check expiry later.
      const headers = new Headers(responseToCache.headers)
      headers.set('sw-cached-at', Date.now().toString())

      const cachedResponse = new Response(await responseToCache.blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers,
      })

      // Store asynchronously — don't block the response.
      cache.put(request, cachedResponse).catch(() => {
        // Cache write failure is non-fatal; the font will still render.
      })
    }

    return networkResponse
  } catch {
    // ── 3. Network failed — last-resort fallback ────────────────────────
    // Return the expired cached entry if we have one; otherwise return a
    // network error so the browser uses system fonts via font-display: swap.
    if (cached) {
      return cached
    }
    return Response.error()
  }
}

/**
 * Plain network fetch with no caching.
 * Used when the Cache API is unavailable.
 *
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function fetchAndReturn(request) {
  try {
    return await fetch(request)
  } catch {
    return Response.error()
  }
}
