import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

webpush.setVapidDetails(
  "mailto:teuemail@gmail.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function GET() {
  try {
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
