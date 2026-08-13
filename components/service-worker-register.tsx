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
    async function registerPush() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        alert("Push não suportado neste navegador.");
        return;
      }

      try {
        // 1. Registra Service Worker
        await navigator.serviceWorker.register("/sw.js");
        const registration = await navigator.serviceWorker.ready;

        // 2. Pede permissão de notificação
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          alert("Permissão de notificação negada pelo usuário.");
          return;
        }

        // 3. Obtém ou cria a subscrição
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        const subJson = subscription.toJSON();
        const payload = {
          endpoint: subscription.endpoint,
          p256dh: subJson.keys?.p256dh || "",
          auth: subJson.keys?.auth || "",
        };

        // 4. Salva no Supabase com tratamento explícito de erro
        const { data, error } = await supabase
          .from("push_subscriptions")
          .upsert(payload, { onConflict: "endpoint" });

        if (error) {
          alert("ERRO SUPABASE: " + error.message);
          console.error("Erro Supabase:", error);
        } else {
          alert("SUCESSO! Gravado no Supabase com sucesso!");
        }
      } catch (err: any) {
        alert("ERRO NO SCRIPT: " + (err?.message || JSON.stringify(err)));
        console.error("Erro geral:", err);
      }
    }

    registerPush();
  }, []);

  return null;
}
