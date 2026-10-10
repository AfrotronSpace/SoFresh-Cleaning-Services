import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { loadSettings } from "@/lib/settings";
import { getSession } from "@/lib/auth";
import { buildMetadata } from "@/lib/seo";
import { formatDate, formatUkNumber, whatsappLink } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Booking received",
  path: "/booking-received",
  noIndex: true,
});

export default async function BookingReceivedPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const [settings, session] = await Promise.all([loadSettings(), getSession()]);

  const booking = await prisma.booking
    .findUnique({ where: { reference: reference.toUpperCase() }, include: { items: true } })
    .catch(() => null);

  if (!booking) notFound();

  const services = booking.items.map((i) => i.nameSnapshot);

  return (
    <div className="shell max-w-2xl py-16 md:py-24">
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-champagne-soft">
        <Check className="size-6 text-forest" strokeWidth={2.5} />
      </span>

      <h1 className="mt-7 font-display text-[2.25rem] leading-[1.1] md:text-[3rem]">
        Your booked session is in review
      </h1>
      <p className="mt-5 text-[1.0625rem] leading-relaxed text-sage">
        Thank you, {booking.contactName.split(" ")[0]}. We&rsquo;ve got your request and a member of the team will be in touch
        shortly. {settings.responsePromise}
      </p>

      <dl className="mt-10 divide-y divide-border rounded-2xl border border-border bg-white">
        {[
          ["Reference", booking.reference],
          ["Service", services.length ? services.join(", ") : "Custom job — described by you"],
          ["Preferred date", formatDate(booking.preferredDate)],
          ["Postcode", booking.postcode],
        ].map(([term, value]) => (
          <div key={term} className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-4 md:px-6">
            <dt className="text-sm text-sage">{term}</dt>
            <dd className="font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 space-y-4 rounded-2xl bg-mist p-6 text-[0.9375rem] leading-relaxed text-sage md:p-8">
        <h2 className="font-display text-lg text-ink">What happens next</h2>
        <p>
          This is a request, not a confirmed appointment. Nothing is reserved and no payment is due until we&rsquo;ve sent your
          price and you&rsquo;ve accepted it.
        </p>
        <p>
          <strong className="font-semibold text-ink">Send photos now and you&rsquo;ll get your price faster.</strong> Condition
          affects the workload far more than room count, so a few clear photos or a short walkthrough video usually means we
          can quote the same day.
        </p>
        {booking.urgency !== "STANDARD" && (
          <p>
            You&rsquo;ve flagged this as short notice. We&rsquo;ll check team capacity first and confirm any call-out fee before you
            commit to anything.
          </p>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" variant="whatsapp">
          <a
            href={whatsappLink(
              settings.whatsapp,
              `Hi, I've just submitted booking ${booking.reference}. Here are some photos of the property:`,
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            Send photos on WhatsApp
          </a>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href={session ? "/dashboard" : "/sign-up"}>
            {session ? "See it in your dashboard" : "Create an account to track it"}
          </Link>
        </Button>
      </div>

      {!session && (
        <p className="mt-5 text-sm leading-relaxed text-sage">
          You don&rsquo;t need an account — we&rsquo;ll email you either way. Signing up just means your bookings, quotes and dates
          live in one place, and the form remembers your details next time.
        </p>
      )}

      <p className="mt-10 text-sm leading-relaxed text-sage">
        Need to change something? Message {formatUkNumber(settings.whatsapp)} on WhatsApp or email{" "}
        <a href={`mailto:${settings.email}`} className="font-medium text-verdant underline underline-offset-4">
          {settings.email}
        </a>{" "}
        quoting {booking.reference}.
      </p>
    </div>
  );
}
