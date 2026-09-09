import "server-only";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/constants";

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  cc?: string | null;
  replyTo?: string;
  bookingId?: string;
  recipientId?: string;
  senderId?: string;
};

let cached: nodemailer.Transporter | null = null;

function transporter() {
  if (cached) return cached;
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  cached = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
  });
  return cached;
}

/**
 * Sends an email and records it in MessageLog either way, so the admin
 * can always see what was attempted. With no SMTP configured the message
 * is logged to the console and marked SKIPPED — development stays quiet
 * and nothing silently disappears.
 */
export async function sendEmail(args: SendArgs) {
  const from = process.env.SMTP_FROM ?? `${SITE.name} <${SITE.email}>`;
  const tx = transporter();

  const log = await prisma.messageLog.create({
    data: {
      channel: "EMAIL",
      status: "QUEUED",
      toAddress: args.to,
      subject: args.subject,
      body: args.html,
      bookingId: args.bookingId,
      recipientId: args.recipientId,
      senderId: args.senderId,
    },
  });

  if (!tx) {
    console.info(`[email skipped — no SMTP_HOST] to=${args.to} subject="${args.subject}"`);
    await prisma.messageLog.update({
      where: { id: log.id },
      data: { status: "SKIPPED", error: "SMTP not configured" },
    });
    return { ok: false as const, skipped: true as const };
  }

  try {
    await tx.sendMail({
      from,
      to: args.to,
      cc: args.cc ?? undefined,
      replyTo: args.replyTo ?? SITE.email,
      subject: args.subject,
      html: args.html,
      text: args.text ?? args.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    });
    await prisma.messageLog.update({
      where: { id: log.id },
      data: { status: "SENT", sentAt: new Date() },
    });
    return { ok: true as const, skipped: false as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown mail error";
    console.error("[email failed]", message);
    await prisma.messageLog.update({
      where: { id: log.id },
      data: { status: "FAILED", error: message },
    });
    return { ok: false as const, skipped: false as const };
  }
}

/** Single email shell so every message looks like the website. */
export function emailShell(opts: { preheader?: string; heading: string; body: string; cta?: { label: string; url: string } }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${opts.heading}</title></head>
<body style="margin:0;padding:0;background:#eff3f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#10201a;">
${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${opts.preheader}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff3f0;padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 32px -20px rgba(7,39,27,.5)">
  <tr><td style="background:#0d3b2a;padding:22px 28px;">
    <div style="color:#ffffff;font-size:18px;letter-spacing:-.2px;font-weight:600;">${SITE.name}</div>
    <div style="color:#c6a86b;font-size:12px;margin-top:3px;">Essex &amp; Suffolk</div>
  </td></tr>
  <tr><td style="padding:30px 28px 8px;">
    <h1 style="margin:0 0 14px;font-size:21px;line-height:1.3;font-weight:600;color:#10201a;">${opts.heading}</h1>
    <div style="font-size:15px;line-height:1.65;color:#3c4a44;">${opts.body}</div>
  </td></tr>
  ${
    opts.cta
      ? `<tr><td style="padding:20px 28px 30px;"><a href="${opts.cta.url}" style="display:inline-block;background:#0d3b2a;color:#ffffff;text-decoration:none;padding:13px 24px;border-radius:8px;font-weight:600;font-size:15px;">${opts.cta.label}</a></td></tr>`
      : `<tr><td style="height:24px"></td></tr>`
  }
  <tr><td style="padding:18px 28px 26px;border-top:1px solid #e2e7e3;font-size:12px;line-height:1.6;color:#5a6b63;">
    ${SITE.legalName} · Company no. ${SITE.companyNumber}<br>
    <a href="mailto:${SITE.email}" style="color:#1f7a55;">${SITE.email}</a> · ${SITE.phone}<br>
    We never take payment through the website. All payments are arranged directly with you.
  </td></tr>
</table>
</td></tr></table></body></html>`;
}
