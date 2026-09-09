import type { Metadata } from "next";
import Link from "next/link";
import { BookingWizard, type WizardService } from "@/components/booking/booking-wizard";
import { StickyContactBar } from "@/components/site/sticky-contact-bar";
import { prisma } from "@/lib/prisma";
import { loadSettings } from "@/lib/settings";
import { getSession } from "@/lib/auth";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Request a booking",
  description:
    "Tell us what needs cleaning and we'll send a fixed price, usually within 24 hours. Nothing is charged through the website and no date is held until you accept your quote.",
  path: "/book",
});

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service: preselected } = await searchParams;
  const [settings, session, services] = await Promise.all([
    loadSettings(),
    getSession(),
    prisma.service
      .findMany({
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, slug: true, name: true, summary: true, price: true, priceMode: true, negotiable: true, requiresSurvey: true, extras: true },
      })
      .catch(() => []),
  ]);

  const user = session ? await prisma.user.findUnique({ where: { id: session.id } }).catch(() => null) : null;

  const wizardServices: WizardService[] = services.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    summary: s.summary,
    price: s.price ? s.price.toString() : null,
    priceMode: s.priceMode,
    negotiable: s.negotiable,
    requiresSurvey: s.requiresSurvey,
    extras: Array.isArray(s.extras) ? (s.extras as { name: string }[]) : [],
  }));

  return (
    <>
      <header className="border-b border-border bg-mist">
        <div className="shell py-14 md:py-20">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-sage">
            <Link href="/" className="hover:text-forest">Home</Link>
            <span className="px-2 text-champagne">/</span>
            <span className="text-ink">Request a booking</span>
          </nav>
          <h1 className="max-w-3xl font-display text-[2.25rem] leading-[1.1] md:text-[3rem]">
            Tell us what needs doing
          </h1>
          <p className="mt-5 max-w-[62ch] text-[1.0625rem] leading-relaxed text-sage md:text-lg">
            Six short steps. We&rsquo;ll come back with a fixed price, normally within 24 hours of having everything we need. No
            payment is taken here and no date is held until you&rsquo;ve accepted the price.
          </p>
        </div>
      </header>

      <div className="shell max-w-3xl py-14 md:py-20">
        {wizardServices.length === 0 ? (
          <div className="rounded-2xl bg-mist p-8">
            <h2 className="font-display text-xl">The booking form isn&rsquo;t ready yet</h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-sage">
              No services have been published. Message us on WhatsApp and we&rsquo;ll sort it out directly.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-white p-6 md:p-9">
            <BookingWizard
              services={wizardServices}
              preselectedSlug={preselected}
              prefill={
                user
                  ? {
                      name: user.name,
                      email: user.email,
                      phone: user.phone ?? undefined,
                      postcode: user.postcode ?? undefined,
                      addressLine1: user.addressLine1 ?? undefined,
                      city: user.city ?? undefined,
                    }
                  : undefined
              }
              cancellationHours={settings.cancellationHours}
              bookingFeeNote={settings.bookingFeeNote}
            />
          </div>
        )}
      </div>

      <StickyContactBar whatsapp={settings.whatsapp} message="Hi, I'd like a quote for a clean." bookHref="/services" bookLabel="Browse services" />
    </>
  );
}
