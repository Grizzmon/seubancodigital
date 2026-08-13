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
  
  // Garantimos que o data.data venha do payload (para abrir a URL certa)
  const notificationOptions = {
    body: data.body || "Você recebeu uma notificação",
    icon: "/launchericon-192x192.png",
    badge: "/launchericon-192x192.png",
    data: data.data || { url: '/' } // URL padrão se não vier no payload
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "BankPix", notificationOptions)
  );
});

// Adicionando o comportamento de clique para abrir o link
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Abre a URL que foi enviada no payload do push ou a home
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});