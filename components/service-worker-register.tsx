"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(async () => {
          console.log("Service Worker registrado");

          // Pedir permissão de notificação
          const permission = await Notification.requestPermission();

          console.log("Permissão:", permission);
        })
        .catch((err) => console.error("Erro ao registrar SW:", err));
    }
  }, []);

  return null;
}