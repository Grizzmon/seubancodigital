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
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        console.warn(
          "Push notifications não são suportadas neste navegador."
        );
        return;
      }

      // O usuário precisa estar identificado antes de salvar a subscription.
      const userId = localStorage.getItem("bankpix_user_id");

      if (!userId) {
        console.log(
          "Push aguardando login: bankpix_user_id ainda não existe."
        );
        return;
      }

      try {
        // Registra o Service Worker
        await navigator.serviceWorker.register("/sw.js");

        // Aguarda o Service Worker ficar pronto
        const registration = await navigator.serviceWorker.ready;

        // Verifica a permissão atual
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

        // Procura uma subscription existente
        let subscription =
          await registration.pushManager.getSubscription();

        // Se não existir, cria uma nova
        if (!subscription) {
          subscription =
            await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey:
                urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
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

        // Payload completo com o UUID do usuário
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

        // Salva ou atualiza a subscription
        const { error: subscriptionError } =
          await supabase
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

        // Marca o usuário como tendo Push ativado
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
      } catch (error) {
        console.error(
          "Erro na rotina de Push Notification:",
          error
        );
      }
    }

    // Tenta sincronizar caso o usuário já esteja logado
    registerPush();

    // Quando o login terminar, o login-screen dispara este evento.
    const handleUserReady = () => {
      console.log(
        "Usuário identificado. Sincronizando Push novamente..."
      );

      registerPush();
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
