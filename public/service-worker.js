/* Real World Atlas PWA shell.
 * Do not cache navigation HTML, API responses, account data or user content.
 */
const CACHE_NAME = "atlas-static-shell-v1";
const PRECACHE_URLS = ["/offline.html", "/manifest.webmanifest", "/atlas-icon.svg", "/favicon.ico"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("atlas-static-shell-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigation is network-only; on failure show an explicit offline state.
  // Never make cached, potentially private or stale HTML look current.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const offline = await caches.match("/offline.html");
        return (
          offline ||
          new Response("Offline", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
        );
      }),
    );
    return;
  }

  // Only cache versioned build assets after a successful network read.
  // Requests for API/data endpoints, uploads and unversioned routes are untouched.
  const isBuildAsset = url.pathname.startsWith("/assets/") || url.pathname.startsWith("/_build/");
  const isStaticResource = ["script", "style", "font", "image"].includes(request.destination);
  if (!isBuildAsset || !isStaticResource) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;

      const response = await fetch(request);
      if (response.ok && response.type === "basic") {
        try {
          await cache.put(request, response.clone());
        } catch {
          // Storage pressure must not break a successful network response.
        }
      }
      return response;
    })().catch(
      () =>
        new Response("", {
          status: 503,
          headers: { "Cache-Control": "no-store" },
        }),
    ),
  );
});
