const CACHE_NAME = "DukanSmarts-pwa-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/src/main.tsx",
  "/src/index.css"
];

// Install Event - Pre-cache App Shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching offline app shell");
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[Service Worker] Pre-cache partial warning:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Network First with Cache Fallback for offline usability
self.addEventListener("fetch", (event) => {
  // Ignore non-GET requests or browser extension requests
  if (event.request.method !== "GET" || !event.request.url.startsWith("http")) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        console.log("[Service Worker] Offline fetch fallback for:", event.request.url);
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.headers.get("accept")?.includes("text/html")) {
            return caches.match("/index.html") || caches.match("/");
          }
        });
      })
  );
});

// Background Sync Listener for queued offline inventory updates
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-offline-scans") {
    console.log("[Service Worker] Background sync triggered for offline inventory scans!");
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "SYNC_OFFLINE_QUEUE" });
        });
      })
    );
  }
});

// Firebase FCM / Push Notification Event Listener
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "DukanSmarts Restock Alert";
  const options = {
    body: data.body || "A Kirana item is nearing critical stockout level.",
    icon: "/public/manifest.json",
    badge: "/public/manifest.json",
    vibrate: [200, 100, 200],
    data: { url: data.url || "/" }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === "/" && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/");
    })
  );
});
