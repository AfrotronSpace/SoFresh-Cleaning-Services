import Link from "next/link";
import type { Metadata } from "next";
import { Mail, MessageCircle, Phone, Clock, MapPin } from "lucide-react";
import { ContactForm } from "@/components/site/contact-form";
import { StickyContactBar } from "@/components/site/sticky-contact-bar";
import { JsonLd } from "@/components/site/json-ld";
import { loadSettings } from "@/lib/settings";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { formatUkNumber, telLink, whatsappLink } from "@/lib/utils";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Contact us",
  description:
    "Get in touch with So Fresh Cleaning Service. WhatsApp is fastest for quotes — send photos and we'll usually price the same day. Covering Colchester, Ipswich, Braintree and Clacton-on-Sea.",
  path: "/contact",
});

export default async function ContactPage() {
  const settings = await loadSettings();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />

      <header className="border-b border-border bg-mist">
        <div className="shell py-16 md:py-24">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-sage">
            <Link href="/" className="hover:text-forest">Home</Link>
            <span className="px-2 text-champagne">/</span>
            <span className="text-ink">Contact</span>
          </nav>
          <h1 className="max-w-3xl font-display text-[2.25rem] leading-[1.1] md:text-[3.25rem]">
            Talk to us
          </h1>
          <p className="mt-6 max-w-[62ch] text-[1.0625rem] leading-relaxed text-sage md:text-lg">
            {settings.responsePromise} WhatsApp is usually quickest, especially if you can send a few photos or a short
            walkthrough video.
          </p>
        </div>
      </header>

      <div className="shell grid gap-14 py-16 md:py-24 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
        <div>
          <h2 className="font-display text-2xl">Get in touch</h2>
          <ul className="mt-7 space-y-7">
            <ContactMethod
              icon={MessageCircle}
              label="WhatsApp"
              value={formatUkNumber(settings.whatsapp)}
              href={whatsappLink(settings.whatsapp, "Hi, I'd like a quote for a clean.")}
              note="Best for quotes. Send photos or a video and we can usually price the same day."
              external
            />
            <ContactMethod
              icon={Phone}
              label="Phone"
              value={settings.phone}
              href={telLink(settings.phone)}
              note="If you'd rather talk it through."
            />
            <ContactMethod
              icon={Mail}
              label="Email"
              value={settings.email}
              href={`mailto:${settings.email}`}
              note="Good for commercial enquiries and invoices."
            />
          </ul>

          <dl className="mt-10 space-y-6 border-t border-border pt-8">
            <div className="flex gap-3.5">
              <Clock className="mt-0.5 size-5 shrink-0 text-champagne" strokeWidth={1.75} />
              <div>
                <dt className="text-sm text-sage">When we clean</dt>
                <dd className="mt-0.5 text-[0.9375rem] text-ink">{settings.openingHours}</dd>
              </div>
            </div>
            <div className="flex gap-3.5">
              <MapPin className="mt-0.5 size-5 shrink-0 text-champagne" strokeWidth={1.75} />
              <div>
                <dt className="text-sm text-sage">Where we work</dt>
                <dd className="mt-0.5 text-[0.9375rem] leading-relaxed text-ink">
                  {settings.serviceAreas.join(", ")} and the surrounding area. Based in Colchester.
                </dd>
              </div>
            </div>
          </dl>

          <p className="mt-8 text-sm leading-relaxed text-sage">
            {SITE.legalName} is registered in England and Wales, company number {SITE.companyNumber}. We work from home and
            don&rsquo;t publish our registered office — every job is quoted to your address instead.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl">Or send a message</h2>
          <p className="mt-3 max-w-[54ch] text-[0.9375rem] leading-relaxed text-sage">
            If you already know what you need, the{" "}
            <Link href="/book" className="font-medium text-verdant underline underline-offset-4">booking form</Link> gathers
            everything we need to price it properly.
          </p>
          <div className="mt-8">
            <ContactForm />
          </div>
        </div>
      </div>

      <StickyContactBar whatsapp={settings.whatsapp} message="Hi, I'd like a quote for a clean." />
    </>
  );
}

function ContactMethod({
  icon: Icon,
  label,
  value,
  href,
  note,
  external,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  href: string;
  note: string;
  external?: boolean;
}) {
  return (
    <li className="flex gap-3.5">
      <Icon className="mt-1 size-5 shrink-0 text-champagne" strokeWidth={1.75} />
      <div>
        <p className="text-sm text-sage">{label}</p>
        <a
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="mt-0.5 block font-display text-xl text-ink transition-colors hover:text-verdant"
        >
          {value}
        </a>
        <p className="mt-1.5 max-w-[42ch] text-sm leading-relaxed text-sage">{note}</p>
      </div>
    </li>
  );
}
