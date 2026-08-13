"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

const VAPID_PUBLIC_KEY =
  "BKOyYXXQkylmhMhXOq9qfBctTi0edUI6OzjUOzatYko2pgVSj_FU5WbV9WipbJdSyK-1XnWr1oZ46eVFHee00ho";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export default function ServiceWorkerRegister() {
  useEffect(() => {
    async function registerPush() {
      if (!("serviceWorker" in navigator)) return;

      try {
        const registration = await navigator.serviceWorker.register("/sw.js");

        console.log("Service Worker registrado");

        const permission = await Notification.requestPermission();

        if (permission !== "granted") return;

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        console.log("SUBSCRIPTION:", JSON.stringify(subscription));

        alert("Notificações ativadas com sucesso!");

        await supabase.from("push_subscriptions").upsert( { endpoint: subscription.endpoint, p256dh: subscription.toJSON().keys?.p256dh || "", auth: subscription.toJSON().keys?.auth || "", }, { onConflict: "endpoint", } );
      } catch (err) {
        console.error("Erro ao registrar push:", err);
      }
    }

    registerPush();
  }, []);

  return null;
}
