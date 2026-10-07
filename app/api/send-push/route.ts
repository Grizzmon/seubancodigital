import { NextResponse } from "next/server";
import webpush from "web-push";
import { APP_NAME, APP_URL, NOTIFICATION_BADGE, NOTIFICATION_ICON } from "@/lib/push-config";
import { ensureVapid, getServerSupabase } from "@/lib/push-server";

function supabaseHost() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "").host || "(não definido)";
  } catch {
    return "(URL inválida)";
  }
}

export async function GET() {
  try {
    const supabase = getServerSupabase();
    ensureVapid();
    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth");

    if (error) {
      return NextResponse.json(
        {
          error: "Erro ao ler inscrições",
          details: error.message,
          supabase_host: supabaseHost(),
          dica: "Se for 'fetch failed', o projeto Supabase está pausado/apagado ou a NEXT_PUBLIC_SUPABASE_URL na Vercel está errada.",
        },
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
