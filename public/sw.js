const CACHE_NAME = "masrofy-shell-v3";
const SHELL_URLS = [
  "/",
  "/dashboard",
  "/expenses",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

const BYPASS_PREFIXES = ["/auth/", "/api/", "/login", "/register", "/forgot-password", "/reset-password"];

function shouldBypassServiceWorker(url) {
  return BYPASS_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).then(() => {
      self.skipWaiting();
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin || shouldBypassServiceWorker(url)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }

        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) {
          return cached;
        }

        if (event.request.mode === "navigate") {
          return caches.match("/dashboard");
        }

        throw new Error("Offline and no cached response available.");
      }),
  );
});

self.addEventListener("push", (event) => {
  const fallback = {
    title: "Masrofy",
    body: "عملية متكررة مستحقة",
    url: "/expenses",
    tag: "masrofy-due",
  };

  let payload = fallback;

  try {
    payload = { ...fallback, ...(event.data ? event.data.json() : {}) };
  } catch {
    payload = fallback;
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: payload.tag,
      data: { url: payload.url || "/expenses" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/expenses";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          if ("navigate" in client) {
            return client.navigate(targetUrl).then((opened) => opened.focus());
          }

          return client.focus();
        }
      }

      return self.clients.openWindow(targetUrl);
    }),
  );
});
