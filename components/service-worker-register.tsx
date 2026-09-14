"use client";

import { useEffect } from "react";
import { WELCOME_PUSH_MODE } from "@/lib/push-config";

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BKOyYXXQkylmhMhXOq9qfBctTi0edUI6OzjUOzatYko2pgVSj_FU5WbV9WipbJdSyK-1XnWr1oZ46eVFHee00ho";

const USER_ID_KEY = "bankpix_user_id";
const WELCOME_PENDING_KEY = "bankpix_welcome_pending";
const WELCOME_SENT_PREFIX = "bankpix_welcome_sent_";
const LINKED_ENDPOINT_PREFIX = "realpayz_push_linked_";

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
    const isSupported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

    if (!isSupported) {
      console.warn("[push] notificações não são suportadas neste navegador.");
      return;
    }

    let syncing: Promise<void> | null = null;
    // Se um pedido chegar enquanto outro ainda corre (ex.: cadastro concluído durante o
    // pedido de permissão do primeiro toque), refaz a sincronização logo a seguir
    // em vez de descartar o pedido — senão a inscrição só seria vinculada na próxima visita.
    let rerunRequested = false;
    let permissionAsked = false;

    // Pede a permissão e cria a inscrição. Não depende do usuário estar identificado:
    // a inscrição fica pronta no navegador e é vinculada assim que houver userId.
    async function getOrCreateSubscription(requestIfDefault: boolean) {
      const registration = await navigator.serviceWorker.ready;

      let permission = Notification.permission;
      if (permission === "default" && requestIfDefault && !permissionAsked) {
        permissionAsked = true;
        permission = await Notification.requestPermission();
        permissionAsked = false;
      }
      if (permission !== "granted") return null;

      const existing = await registration.pushManager.getSubscription();
      if (existing) return existing;

      return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // Garante a inscrição e, se houver usuário identificado, vincula no servidor
    // (só uma vez por endpoint+usuário) e dispara o push de boas-vindas pendente.
    async function syncSubscription(requestIfDefault: boolean): Promise<void> {
      if (syncing) {
        rerunRequested = true;
        return syncing;
      }

      syncing = (async () => {
        try {
          const subscription = await getOrCreateSubscription(requestIfDefault);
          if (!subscription) {
            console.log("[push] permissão ainda não concedida");
            return;
          }

          const userId = localStorage.getItem(USER_ID_KEY);
          if (!userId) {
            console.log("[push] inscrição pronta; aguardando identificação do usuário");
            return;
          }

          const json = subscription.toJSON();
          if (!json.keys?.p256dh || !json.keys?.auth || !json.endpoint) {
            console.error("[push] inscrição sem chaves p256dh/auth");
            return;
          }

          const linkedKey = LINKED_ENDPOINT_PREFIX + userId;
          if (localStorage.getItem(linkedKey) !== json.endpoint) {
            const res = await fetch("/api/save-subscription", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, subscription: json }),
            });

            if (!res.ok) {
              console.error("[push] falha ao salvar inscrição:", await res.text());
              return;
            }
            localStorage.setItem(linkedKey, json.endpoint);
            console.log("[push] inscrição vinculada ao usuário", userId);

            // O servidor já dispara as boas-vindas ao vincular; evita a segunda chamada.
            const saved = await res.json().catch(() => null);
            if (saved?.welcome === "sent" || saved?.welcome === "skipped") {
              localStorage.setItem(WELCOME_SENT_PREFIX + userId, new Date().toISOString());
              localStorage.removeItem(WELCOME_PENDING_KEY);
            }
          }

          await sendWelcomeIfPending(userId);
        } catch (error) {
          console.error("[push] erro na sincronização:", error);
        } finally {
          syncing = null;
        }
      })();

      const current = syncing;
      current.then(() => {
        if (rerunRequested) {
          rerunRequested = false;
          void syncSubscription(false);
        }
      });

      return current;
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
        // updateViaCache: "none" faz o navegador buscar sempre o sw.js mais recente
        // em vez de reutilizar a cópia em cache HTTP (evita o worker antigo "BankPix").
        const registration = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
        await registration.update().catch(() => null);
        // Tenta já na entrada; navegadores que exigem gesto caem no primeiro toque abaixo.
        await syncSubscription(true);
      } catch (error) {
        console.error("[push] erro ao registrar service worker:", error);
      }
    }

    boot();

    // Android/Chrome só mostram o pedido de permissão de forma visível quando vem
    // de uma interação do usuário. O primeiro toque em qualquer lugar do app faz o pedido.
    const handleFirstInteraction = () => {
      if (Notification.permission !== "default") {
        removeInteractionListeners();
        return;
      }
      syncSubscription(true).finally(() => {
        if (Notification.permission !== "default") removeInteractionListeners();
      });
    };

    const removeInteractionListeners = () => {
      window.removeEventListener("pointerdown", handleFirstInteraction, true);
      window.removeEventListener("keydown", handleFirstInteraction, true);
    };

    window.addEventListener("pointerdown", handleFirstInteraction, true);
    window.addEventListener("keydown", handleFirstInteraction, true);

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
      removeInteractionListeners();
      window.removeEventListener("bankpix-user-ready", handleUserReady);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return null;
}
