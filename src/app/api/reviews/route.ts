import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { reviewSubmissionSchema } from "@/lib/validations";
import { loadSettings } from "@/lib/settings";
import { sendEmail, emailShell } from "@/lib/email";
import { publicName } from "@/lib/reviews";
import { SITE } from "@/lib/constants";

export const runtime = "nodejs";

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "We couldn't read that request." }, { status: 400 });
  }

  const parsed = reviewSubmissionSchema.safeParse(payload);
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

  const job = data.jobId
    ? await prisma.galleryJob.findFirst({ where: { id: data.jobId, published: true }, select: { id: true, title: true } })
    : null;
  if (data.jobId && !job) {
    return NextResponse.json({ error: "That job is no longer on our gallery. Your review can still be sent without it." }, { status: 422 });
  }

  const [session, settings] = await Promise.all([getSession(), loadSettings()]);
  const authorName = publicName(data.name);

  // Always PENDING: nothing a visitor sends reaches the public site until the admin approves it.
  const review = await prisma.testimonial.create({
    data: {
      authorName,
      area: data.area || null,
      rating: data.rating,
      body: data.body,
      source: "WEBSITE",
      status: "PENDING",
      email: data.email,
      jobId: job?.id ?? null,
      userId: session?.id ?? null,
    },
  });

  revalidatePath("/admin/reviews");

  if (settings.emailReviewToAdmin) {
    await sendEmail({
      to: settings.adminNotifyEmail,
      cc: settings.adminNotifyCc,
      replyTo: data.email,
      subject: `New ${data.rating}-star review waiting for approval`,
      html: emailShell({
        heading: "A customer has left a review",
        body: `
          <p><strong>${"★".repeat(data.rating)}${"☆".repeat(5 - data.rating)}</strong> from ${escape(authorName)}${data.area ? `, ${escape(data.area)}` : ""} · ${escape(data.email)}</p>
          ${job ? `<p>Reviewing the gallery job: ${escape(job.title ?? "Untitled job")}</p>` : ""}
          <p>${escape(data.body).replace(/\n/g, "<br>")}</p>
          <p>It isn't on the website until you approve it.</p>
        `,
        cta: { label: "Review and approve", url: `${SITE.url}/admin/reviews/${review.id}` },
      }),
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
