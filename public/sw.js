var CACHE = "wc2026-v1";
var STATIC_ASSETS = ["/", "/group-stage", "/knockout", "/statistics", "/schedule"];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(STATIC_ASSETS);
    }),
  );
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  var url = new URL(request.url);

  if (url.origin === location.origin) {
    if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/icons/")) {
      event.respondWith(cacheFirst(request));
      return;
    }
    if (request.mode === "navigate") {
      event.respondWith(networkFirst(request));
      return;
    }
  }
});

function cacheFirst(request) {
  return caches.match(request).then(function (cached) {
    if (cached) return cached;
    return fetch(request).then(function (response) {
      if (response.ok) {
        return caches.open(CACHE).then(function (cache) {
          cache.put(request, response.clone());
          return response;
        });
      }
      return response;
    });
  });
}

function networkFirst(request) {
  return fetch(request).then(function (response) {
    if (response.ok) {
      return caches.open(CACHE).then(function (cache) {
        cache.put(request, response.clone());
        return response;
      });
    }
    return response;
  }).catch(function () {
    return caches.match(request).then(function (cached) {
      if (cached) return cached;
      return new Response("Offline", { status: 503 });
    });
  });
}
