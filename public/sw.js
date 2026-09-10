// RealPayz Service Worker
// Ao mudar ícones, nome ou comportamento das notificações, incremente SW_VERSION:
// isso força o Android/Chrome a instalar o novo worker e descartar caches antigos (BankPix).
const SW_VERSION = "realpayz-v2";

const APP_NAME = "RealPayz";
const NOTIFICATION_ICON = "/notification-icon-192.png";
const NOTIFICATION_BADGE = "/notification-badge-96.png";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Remove qualquer cache deixado por versões anteriores do app.
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== SW_VERSION).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", () => {
  // Deixa o navegador tratar normalmente (sem cache offline).
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  // Ícone e nome vêm sempre daqui: ignoramos valores antigos que possam chegar no payload.
  const options = {
    body: data.body || "Você recebeu uma notificação",
    icon: NOTIFICATION_ICON,
    badge: NOTIFICATION_BADGE,
    tag: data.tag || "realpayz",
    renotify: true,
    data: data.data || { url: "/" },
  };

  const title = !data.title || /bankpix/i.test(data.title) ? APP_NAME : data.title;

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = windowClients.find((client) => "focus" in client);
      if (existing) {
        await existing.focus();
        if ("navigate" in existing) await existing.navigate(url);
        return;
      }
      await self.clients.openWindow(url);
    })()
  );
});
