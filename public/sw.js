/* BALANCE service worker — makes the site installable and shows push notifications.
   No offline caching on purpose: menu prices and events must always be fresh. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data ? event.data.text() : "" };
  }
  // iOS requires every push to show a notification, so there is always a fallback title.
  event.waitUntil(
    self.registration.showNotification(data.title || "BALANCE", {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag || undefined,
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          return client.focus().then((c) => (c && "navigate" in c ? c.navigate(url) : c));
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// The browser may rotate a subscription; re-subscribe and let the server move
// the visitor's topics and language over to the new one.
self.addEventListener("pushsubscriptionchange", (event) => {
  const old = event.oldSubscription;
  if (!old || !old.options) return;
  event.waitUntil(
    self.registration.pushManager.subscribe(old.options).then((sub) =>
      fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rotate", replaces: old.endpoint, subscription: sub.toJSON() }),
      }).catch(() => null)
    )
  );
});
