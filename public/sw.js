// 간단한 오프라인 캐시 서비스 워커 (앱 셸 + 런타임 캐시)
const CACHE_NAME = "distance-globe-v1"
const APP_SHELL = ["/", "/manifest.webmanifest", "/icon.svg"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {}),
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      ),
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const { request } = event

  // GET 외 요청과 외부 도메인(API/타일/네이버 등)은 그대로 통과
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return
  }

  // 네비게이션 요청: 네트워크 우선, 실패 시 캐시 폴백
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          return res
        })
        .catch(() => caches.match(request).then((c) => c || caches.match("/"))),
    )
    return
  }

  // 정적 자원: 캐시 우선, 없으면 네트워크 후 캐시에 저장
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          const copy = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          return res
        }),
    ),
  )
})
