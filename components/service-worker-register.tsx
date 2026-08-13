"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BKOyYXXQkylmhMhXOq9qfBctTi0edUI6OzjUOzatYko2pgVSj_FU5WbV9WipbJdSyK-1XnWr1oZ46eVFHee00ho";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function ServiceWorkerRegister() {
  useEffect(() => {
    async function initPushNotification() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.warn("Push notifications não são suportadas neste navegador.");
        return;
      }

      try {
        // 1. Registra e aguarda o Service Worker estar ativo
        await navigator.serviceWorker.register("/sw.js");
        const registration = await navigator.serviceWorker.ready;

        // 2. Verifica se já existe uma assinatura ativa
        let subscription = await registration.pushManager.getSubscription();

        // 3. Se a permissão já foi concedida e não há assinatura, assina
        if (!subscription && Notification.permission === "granted") {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        // 4. Se existir uma assinatura (existente ou recém-criada), sincroniza com o Supabase
        if (subscription) {
          const subJson = subscription.toJSON();
          
          await supabase.from("push_subscriptions").upsert(
            {
              endpoint: subscription.endpoint,
              p256dh: subJson.keys?.p256dh || "",
              auth: subJson.keys?.auth || "",
            },
            { onConflict: "endpoint" }
          );
        }
      } catch (err) {
        console.error("Erro ao registrar Push Notification:", err);
      }
    }

    initPushNotification();
  }, []);

  return null;
}
