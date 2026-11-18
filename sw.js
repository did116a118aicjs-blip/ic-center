// Lets browsers install the link page as an app. It caches nothing: the page must always fetch
// the current url.json, and the app itself lives on the server.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => event.respondWith(fetch(event.request)));

// Web Push from the IC CENTER server (server/push.ts): "งานที่คุณแจ้งมีความคืบหน้า", even when the
// page is closed. The message is JSON { title, body, url, tag }; tapping it opens url (/?track=<job id>).
self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = { body: event.data ? event.data.text() : '' }; }
  event.waitUntil(self.registration.showNotification(d.title || 'IC CENTER', {
    body: d.body || 'งานที่คุณแจ้งมีความคืบหน้า',
    tag: d.tag || undefined,
    renotify: !!d.tag,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: d.url || '/' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) {
      if (new URL(w.url).origin !== self.location.origin) continue;
      try { await w.focus(); } catch (e) {}
      try { if (w.navigate) { await w.navigate(url); return; } } catch (e) {}
      break;
    }
    await self.clients.openWindow(url);
  })());
});
