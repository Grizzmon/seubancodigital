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
    const isSupported =
      "serviceWorker" in navigator && "PushManager" in window;

    if (!isSupported) {
      console.warn(
        "Push notifications não são suportadas neste navegador."
      );
      return;
    }

    // 1. Registra o SW e PEDE A PERMISSÃO logo na entrada.
    //    Isso restaura o comportamento antigo: o prompt de notificação
    //    aparece assim que o usuário abre o app, sem depender do login.
    async function ensurePermissionAndSubscription() {
      try {
        // Registra o Service Worker
        await navigator.serviceWorker.register("/sw.js");

        // Aguarda o Service Worker ficar pronto
        const registration = await navigator.serviceWorker.ready;

        // Verifica a permissão atual e solicita se ainda não foi decidida
        let permission = Notification.permission;

        if (permission === "default") {
          permission = await Notification.requestPermission();
        }

        if (permission !== "granted") {
          console.log(
            "Permissão de notificações não concedida."
          );
          return;
        }

        // Garante que exista uma subscription no navegador
        let subscription =
          await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription =
            await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey:
                urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
        }

        // 2. Salva no Supabase somente quando o usuário já estiver identificado.
        await syncSubscriptionToSupabase(subscription);
      } catch (error) {
        console.error(
          "Erro na rotina de Push Notification:",
          error
        );
      }
    }

    // Salva/atualiza a subscription no Supabase (precisa do user_id).
    async function syncSubscriptionToSupabase(
      subscription: PushSubscription | null
    ) {
      const userId = localStorage.getItem("bankpix_user_id");

      if (!userId) {
        console.log(
          "Push aguardando login: bankpix_user_id ainda não existe."
        );
        return;
      }

      if (!subscription) {
        const registration =
          await navigator.serviceWorker.ready;
        subscription =
          await registration.pushManager.getSubscription();
      }

      if (!subscription) {
        console.log(
          "Nenhuma subscription disponível para sincronizar."
        );
        return;
      }

      const subJson = subscription.toJSON();

      const p256dh = subJson.keys?.p256dh;
      const auth = subJson.keys?.auth;

      if (!p256dh || !auth) {
        console.error(
          "Não foi possível obter as chaves p256dh/auth."
        );
        return;
      }

      const payload = {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh,
        auth,
      };

      console.log(
        "Sincronizando Push para user_id:",
        userId
      );

      const { error: subscriptionError } = await supabase
        .from("push_subscriptions")
        .upsert(payload, {
          onConflict: "endpoint",
        });

      if (subscriptionError) {
        console.error(
          "Erro ao salvar push_subscriptions:",
          subscriptionError.message
        );
        return;
      }

      const { error: userError } = await supabase
        .from("bankpix_users")
        .update({
          push_enabled: true,
        })
        .eq("id", userId);

      if (userError) {
        console.error(
          "Erro ao atualizar push_enabled:",
          userError.message
        );
        return;
      }

      console.log(
        "Push sincronizado com sucesso para:",
        userId
      );
    }

    // Pede a permissão e cria a subscription já na entrada do app.
    ensurePermissionAndSubscription();

    // Quando o login terminar, o login-screen dispara este evento.
    // Aqui apenas garantimos que a subscription seja vinculada ao user_id.
    const handleUserReady = () => {
      console.log(
        "Usuário identificado. Sincronizando Push novamente..."
      );

      syncSubscriptionToSupabase(null);
    };

    window.addEventListener(
      "bankpix-user-ready",
      handleUserReady
    );

    return () => {
      window.removeEventListener(
        "bankpix-user-ready",
        handleUserReady
      );
    };
  }, []);

  return null;
}
