import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validations";
import { loadSettings } from "@/lib/settings";
import { sendEmail, emailShell } from "@/lib/email";
import { SITE } from "@/lib/constants";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "We couldn't read that request." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json({ error: "Please check the highlighted fields.", fieldErrors }, { status: 422 });
  }

  const data = parsed.data;
  if (data.company) return NextResponse.json({ ok: true });

  const settings = await loadSettings();

  const enquiry = await prisma.enquiry.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      postcode: data.postcode || null,
      subject: data.subject,
      message: data.message,
    },
  });

  await Promise.allSettled([
    sendEmail({
      to: settings.adminNotifyEmail,
      cc: settings.adminNotifyCc,
      replyTo: data.email,
      subject: `Website enquiry: ${data.subject}`,
      html: emailShell({
        heading: "New enquiry from the website",
        body: `
          <p><strong>${data.name}</strong>${data.phone ? ` · ${data.phone}` : ""} · ${data.email}${data.postcode ? ` · ${data.postcode}` : ""}</p>
          <p><strong>${data.subject}</strong></p>
          <p>${data.message.replace(/\n/g, "<br>")}</p>
        `,
        cta: { label: "See all enquiries", url: `${SITE.url}/admin/enquiries` },
      }),
    }),
    sendEmail({
      to: data.email,
      subject: "Thanks for contacting So Fresh Cleaning Service",
      html: emailShell({
        preheader: "We've got your message and will be in touch shortly.",
        heading: `Thanks for getting in touch, ${data.name.split(" ")[0]}`,
        body: `
          <p>We've received your enquiry and a member of our team will be in touch shortly.</p>
          <p>If you've requested a quote, we may ask for a few additional details, photos or a short video so we can provide an accurate, tailored price. WhatsApp is usually the quickest way to send those: <a href="https://wa.me/${settings.whatsapp}">${SITE.whatsappDisplay}</a>.</p>
          <p>We look forward to helping you bring that So Fresh feeling back to your space.</p>
        `,
      }),
    }),
  ]);

  return NextResponse.json({ ok: true, id: enquiry.id }, { status: 201 });
}
