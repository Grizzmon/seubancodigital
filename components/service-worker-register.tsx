"use client";

import { useEffect } from "react";
import { WELCOME_PUSH_MODE } from "@/lib/push-config";

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BKOyYXXQkylmhMhXOq9qfBctTi0edUI6OzjUOzatYko2pgVSj_FU5WbV9WipbJdSyK-1XnWr1oZ46eVFHee00ho";

const USER_ID_KEY = "bankpix_user_id";
const WELCOME_PENDING_KEY = "bankpix_welcome_pending";
const WELCOME_SENT_PREFIX = "bankpix_welcome_sent_";

export interface UserReadyDetail {
  userId?: string;
  newAccount?: boolean;
}

// Avisa o ServiceWorkerRegister que o usuário foi identificado.
// newAccount=true faz o push de boas-vindas ser disparado (modo 'immediate').
export function notifyUserReady(detail: UserReadyDetail) {
  if (typeof window === "undefined") return;
  if (detail.userId) localStorage.setItem(USER_ID_KEY, detail.userId);
  if (detail.newAccount && detail.userId) {
    localStorage.setItem(WELCOME_PENDING_KEY, detail.userId);
  }
  window.dispatchEvent(new CustomEvent<UserReadyDetail>("bankpix-user-ready", { detail }));
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function ServiceWorkerRegister() {
  useEffect(() => {
    const isSupported = "serviceWorker" in navigator && "PushManager" in window;

    if (!isSupported) {
      console.warn("Push notifications não são suportadas neste navegador.");
      return;
    }

    let syncing: Promise<void> | null = null;

    async function getOrCreateSubscription(requestIfDefault: boolean) {
      const registration = await navigator.serviceWorker.ready;

      let permission = Notification.permission;
      if (permission === "default" && requestIfDefault) {
        permission = await Notification.requestPermission();
      }
      if (permission !== "granted") return null;

      const existing = await registration.pushManager.getSubscription();
      if (existing) return existing;

      return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // Salva a inscrição no servidor (service role) vinculada ao user_id
    // e, se houver boas-vindas pendente, dispara o push.
    async function syncSubscription(requestIfDefault: boolean) {
      if (syncing) return syncing;

      syncing = (async () => {
        try {
          const userId = localStorage.getItem(USER_ID_KEY);
          if (!userId) {
            console.log("[push] aguardando identificação do usuário");
            return;
          }

          const subscription = await getOrCreateSubscription(requestIfDefault);
          if (!subscription) {
            console.log("[push] permissão não concedida ainda; tentará novamente depois");
            return;
          }

          const json = subscription.toJSON();
          if (!json.keys?.p256dh || !json.keys?.auth) {
            console.error("[push] inscrição sem chaves p256dh/auth");
            return;
          }

          const res = await fetch("/api/save-subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, subscription: json }),
          });

          if (!res.ok) {
            console.error("[push] falha ao salvar inscrição:", await res.text());
            return;
          }

          console.log("[push] inscrição vinculada ao usuário", userId);

          await sendWelcomeIfPending(userId);
        } catch (error) {
          console.error("[push] erro na sincronização:", error);
        } finally {
          syncing = null;
        }
      })();

      return syncing;
    }

    async function sendWelcomeIfPending(userId: string) {
      if (WELCOME_PUSH_MODE !== "immediate") return;

      const pending = localStorage.getItem(WELCOME_PENDING_KEY);
      if (pending !== userId) return;
      if (localStorage.getItem(WELCOME_SENT_PREFIX + userId)) {
        localStorage.removeItem(WELCOME_PENDING_KEY);
        return;
      }

      const res = await fetch("/api/welcome-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const result = await res.json().catch(() => null);
      console.log("[push] boas-vindas:", result);

      if (result?.success || result?.skipped) {
        localStorage.setItem(WELCOME_SENT_PREFIX + userId, new Date().toISOString());
        localStorage.removeItem(WELCOME_PENDING_KEY);
      }
    }

    async function boot() {
      try {
        await navigator.serviceWorker.register("/sw.js");
        // Pede permissão já na entrada (comportamento original do app).
        await syncSubscription(true);
      } catch (error) {
        console.error("[push] erro ao registrar service worker:", error);
      }
    }

    boot();

    const handleUserReady = () => {
      syncSubscription(true);
    };

    // Se o usuário voltar ao app depois de aceitar a permissão, tenta vincular de novo.
    const handleVisibility = () => {
      if (document.visibilityState === "visible") syncSubscription(false);
    };

    window.addEventListener("bankpix-user-ready", handleUserReady);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("bankpix-user-ready", handleUserReady);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return null;
}
