import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

function getClients() {
  if (!supabaseUrl || !serviceRole || !vapidPublicKey || !vapidPrivateKey) {
    return null;
  }

  const supabase = createClient(supabaseUrl, serviceRole);
  webpush.setVapidDetails(
    "mailto:suporte@bankpix.com",
    vapidPublicKey,
    vapidPrivateKey
  );
  return supabase;
}

export async function GET() {
  try {
    const supabase = getClients();
    if (!supabase) {
      return NextResponse.json({ error: "Push não configurado" }, { status: 503 });
    }

    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth");

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        message: "Nenhuma subscription encontrada",
      });
    }

    for (const sub of data) {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify({
          title: "BankPix",
          body: "Sua primeira notificação push chegou com sucesso! 🚀",
        })
      );
    }

    return NextResponse.json({
      success: true,
      total: data.length,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao enviar notificações" },
      { status: 500 }
    );
  }
}
