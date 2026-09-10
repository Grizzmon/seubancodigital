import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import { APP_NAME, APP_URL, NOTIFICATION_BADGE, NOTIFICATION_ICON, VAPID_CONTACT } from "@/lib/push-config";

// Criados só no momento do pedido para o build não depender das variáveis de ambiente.
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Usa a service role para não esbarrar em RLS ao ler/limpar inscrições
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function configureVapid() {
  webpush.setVapidDetails(
    VAPID_CONTACT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
}

export async function GET() {
  try {
    const supabase = getSupabase();
    configureVapid();
    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth");

    if (error) {
      return NextResponse.json(
        { error: "Erro ao ler inscrições", details: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhuma inscrição encontrada",
        total: 0,
        enviadas: 0,
      });
    }

    let enviadas = 0;
    let expiradas = 0;
    const falhas: { id: string; status?: number; message: string }[] = [];

    const payload = JSON.stringify({
      title: APP_NAME,
      body: "Sua primeira notificação push chegou com sucesso!",
      icon: NOTIFICATION_ICON,
      badge: NOTIFICATION_BADGE,
      tag: "realpayz-test",
      data: { url: APP_URL },
    });

    // Trata cada inscrição isoladamente para que uma expirada não derrube o restante
    for (const sub of data) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
        enviadas++;
      } catch (err: any) {
        const status = err?.statusCode;
        if (status === 404 || status === 410) {
          // Inscrição expirada/cancelada: remove do banco
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          expiradas++;
        } else {
          falhas.push({
            id: sub.id,
            status,
            message: err?.message || "erro desconhecido",
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      total: data.length,
      enviadas,
      expiradas_removidas: expiradas,
      falhas,
    });
  } catch (err: any) {
    console.error("Erro send-push:", err);
    return NextResponse.json(
      { error: "Erro ao enviar notificações", details: err?.message },
      { status: 500 }
    );
  }
}
