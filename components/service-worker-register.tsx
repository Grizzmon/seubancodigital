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
      // 1. Verifica se o navegador suporta Service Worker e Push
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.warn("Push notifications não são suportadas neste navegador.");
        return;
      }

      try {
        // 2. Registra e aguarda o Service Worker
        await navigator.serviceWorker.register("/sw.js");
        const registration = await navigator.serviceWorker.ready;

        // 3. Verifica ou solicita permissão de notificação
        let permission = Notification.permission;
        if (permission === "default") {
          permission = await Notification.requestPermission();
        }

        if (permission !== "granted") {
          console.log("Permissão para notificações não foi concedida.");
          return;
        }

        // 4. Obtém ou cria a assinatura push
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        // Recupera o ID do usuário logado do localStorage
        const userId = localStorage.getItem("bankpix_user_id");

        const subJson = subscription.toJSON();
        const payload = {
          user_id: userId, // Vínculo adicionado aqui!
          endpoint: subscription.endpoint,
          p256dh: subJson.keys?.p256dh || "",
          auth: subJson.keys?.auth || "",
        };

        // 5. Salva no Supabase com o user_id
        const { error } = await supabase
          .from("push_subscriptions")
          .upsert(payload, { onConflict: "endpoint" });

        if (error) {
          console.error("Erro ao salvar inscrição no Supabase:", error.message);
        } else {
          console.log("Inscrição de Push sincronizada com o Supabase.");
        }
      } catch (err) {
        console.error("Erro na rotina de Push Notification:", err);
      }
    }

    registerPush();
  }, []);

  return null;
}
