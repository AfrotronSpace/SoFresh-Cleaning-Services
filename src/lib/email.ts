import "server-only";
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

type Mailbox = { address: string; name?: string };

/**
 * Mail goes out over Zoho CPaaS's HTTPS API (formerly ZeptoMail), not SMTP:
 * Railway blocks outbound SMTP ports, so a nodemailer transport would time
 * out in production while working fine on a laptop.
 *
 * The API host depends on the data centre the Zoho account lives in. The
 * exact URL is under Mail Agents → (agent) → Setup Info → API in the Zoho
 * console; override the US default with ZOHO_CPAAS_API_URL if it differs.
 */
const DEFAULT_API_URL = "https://cpaas.zoho.com/v1.1/email";
const TIMEOUT_MS = 15_000;

/** The Send Mail token, with the `Zoho-enczapikey` prefix the API expects. */
function authHeader() {
  const token = process.env.ZOHO_CPAAS_TOKEN?.trim();
  if (!token) return null;
  // The console's copy button includes the prefix; accept it with or without.
  return token.startsWith("Zoho-enczapikey") ? token : `Zoho-enczapikey ${token}`;
}

export function isEmailConfigured() {
  return authHeader() !== null;
}

/** "Name <addr@x>" or a bare "addr@x" → the API's { address, name } shape. */
function parseMailbox(value: string): Mailbox {
  const match = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (!match) return { address: value.trim() };
  const name = match[1].replace(/^"|"$/g, "");
  return name ? { address: match[2].trim(), name } : { address: match[2].trim() };
}

/** The admin CC field is free text, so allow several addresses in it. */
function splitAddresses(value: string | null | undefined) {
  return (value ?? "").split(/[,;\s]+/).filter(Boolean);
}

/** Zoho's error body → one readable line for MessageLog.error. */
async function describeFailure(res: Response) {
  const raw = await res.text().catch(() => "");
  try {
    const body = JSON.parse(raw);
    const err = body.error ?? body.data ?? {};
    const detail = Array.isArray(err.details) ? err.details.map((d: { message?: string }) => d.message).filter(Boolean).join("; ") : "";
    const code = err.code ?? err.error_code;
    const message = [err.message ?? body.message, detail].filter(Boolean).join(" — ");
    if (code || message) return `HTTP ${res.status}${code ? ` ${code}` : ""}: ${message || "no message"}`;
  } catch {
    // Not JSON — fall through to the raw text.
  }
  return `HTTP ${res.status}: ${raw.slice(0, 300) || res.statusText}`;
}

/**
 * Sends an email and records it in MessageLog either way, so the admin
 * can always see what was attempted. With no ZOHO_CPAAS_TOKEN the message
 * is logged to the console and marked SKIPPED — development stays quiet
 * and nothing silently disappears.
 */
export async function sendEmail(args: SendArgs) {
  const auth = authHeader();

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

  if (!auth) {
    console.info(`[email skipped — no ZOHO_CPAAS_TOKEN] to=${args.to} subject="${args.subject}"`);
    await prisma.messageLog.update({
      where: { id: log.id },
      data: { status: "SKIPPED", error: "Email API not configured" },
    });
    return { ok: false as const, skipped: true as const };
  }

  const from = parseMailbox(process.env.EMAIL_FROM || `${SITE.name} <${SITE.email}>`);
  const cc = splitAddresses(args.cc);

  try {
    const res = await fetch(process.env.ZOHO_CPAAS_API_URL || DEFAULT_API_URL, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        from,
        to: [{ email_address: { address: args.to } }],
        ...(cc.length ? { cc: cc.map((address) => ({ email_address: { address } })) } : {}),
        reply_to: [{ address: args.replyTo ?? SITE.email }],
        subject: args.subject,
        htmlbody: args.html,
        textbody: args.text ?? args.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      }),
      // A hung API call must never hold a booking request open.
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(await describeFailure(res));

    await prisma.messageLog.update({
      where: { id: log.id },
      data: { status: "SENT", sentAt: new Date() },
    });
    return { ok: true as const, skipped: false as const };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.name === "TimeoutError"
          ? `Email API did not respond within ${TIMEOUT_MS / 1000}s`
          : error.message
        : "Unknown mail error";
    console.error("[email failed]", message);
    await prisma.messageLog.update({
      where: { id: log.id },
      data: { status: "FAILED", error: message },
    });
    return { ok: false as const, skipped: false as const };
  }
}

/** Single email shell so every message looks like the website. */
export function emailShell(opts: {
  preheader?: string;
  heading: string;
  body: string;
  cta?: { label: string; url: string };
  /** The live contact details from Settings. Falls back to the built-in ones. */
  contact?: { email: string; phone: string };
}) {
  const contact = opts.contact ?? SITE;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${opts.heading}</title></head>
<body style="margin:0;padding:0;background:#eff3f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#10201a;">
${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${opts.preheader}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff3f0;padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 32px -20px rgba(7,39,27,.5)">
  <tr><td style="padding:24px 28px 20px;border-bottom:1px solid #e2e7e3;">
    <img src="${SITE.url}/brand/web/logo-horizontal.png" width="200" height="53" alt="${SITE.name}" style="display:block;border:0;width:200px;height:auto;color:#1e6b34;font-size:18px;font-weight:600;">
    <div style="color:#5a6b63;font-size:12px;margin-top:8px;">Essex &amp; Suffolk</div>
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
    <a href="mailto:${contact.email}" style="color:#1f7a55;">${contact.email}</a> · ${contact.phone}<br>
    We never take payment through the website. All payments are arranged directly with you.
  </td></tr>
</table>
</td></tr></table></body></html>`;
}
