/* 화훼 하우스 매니저 — 서비스워커 (설치형 PWA / 오프라인)
   네트워크 우선(network-first): 온라인이면 항상 최신을 받고, 받은 응답을 캐시에 저장한다.
   오프라인이면 캐시로 응답한다. 같은 출처(GitHub Pages)만 처리하고 Firebase 등 외부 CDN은 그대로 통과. */
const CACHE = "fhm-cache-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return; // 외부 CDN(Firebase 등)은 건드리지 않음
  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    } catch (err) {
      const cached = await caches.match(req);
      if (cached) return cached;
      if (req.mode === "navigate") {
        const idx = await caches.match("index.html") || await caches.match("./");
        if (idx) return idx;
      }
      throw err;
    }
  })());
});
