self.addEventListener("install", (event) => {
  console.log("Service Worker instalado.");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker ativado.");
});

self.addEventListener("fetch", (event) => {
  // Deixa o navegador tratar normalmente
});

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};

  event.waitUntil(
    self.registration.showNotification(data.title || "Notificação", {
      body: data.body || "Você recebeu uma notificação",
      icon: "/launchericon-192x192.png",
      badge: "/launchericon-192x192.png",
    })
  );
});