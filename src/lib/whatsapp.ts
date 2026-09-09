import "server-only";
import { prisma } from "@/lib/prisma";
import { toWhatsAppNumber } from "@/lib/utils";

/**
 * Two modes, on purpose:
 *
 *  1. No Meta credentials (the default) — we build a wa.me deep link and
 *     hand it to the admin in the dashboard and the notification email.
 *     One tap and the message is pre-typed. Zero setup, zero cost.
 *  2. WHATSAPP_PHONE_NUMBER_ID + WHATSAPP_ACCESS_TOKEN set — we post the
 *     message through the Cloud API so it arrives without anyone tapping.
 *
 * Either way the attempt is recorded in MessageLog.
 */
export function buildForwardLink(number: string, message: string) {
  return `https://wa.me/${toWhatsAppNumber(number)}?text=${encodeURIComponent(message)}`;
}

export async function forwardToWhatsApp(opts: {
  to: string;
  message: string;
  bookingId?: string;
}) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const to = toWhatsAppNumber(opts.to);

  const log = await prisma.messageLog.create({
    data: {
      channel: "WHATSAPP",
      status: "QUEUED",
      toAddress: to,
      body: opts.message,
      bookingId: opts.bookingId,
    },
  });

  if (!phoneNumberId || !token) {
    await prisma.messageLog.update({
      where: { id: log.id },
      data: { status: "SKIPPED", error: "Cloud API not configured — deep link used instead" },
    });
    return { ok: false as const, link: buildForwardLink(to, opts.message) };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { preview_url: false, body: opts.message },
      }),
    });

    if (!res.ok) throw new Error(`WhatsApp API responded ${res.status}: ${await res.text()}`);

    await prisma.messageLog.update({
      where: { id: log.id },
      data: { status: "SENT", sentAt: new Date() },
    });
    return { ok: true as const, link: buildForwardLink(to, opts.message) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown WhatsApp error";
    console.error("[whatsapp failed]", message);
    await prisma.messageLog.update({
      where: { id: log.id },
      data: { status: "FAILED", error: message },
    });
    return { ok: false as const, link: buildForwardLink(to, opts.message) };
  }
}
