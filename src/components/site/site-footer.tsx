import Link from "next/link";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { SITE } from "@/lib/constants";
import { telLink, whatsappLink } from "@/lib/utils";

const SERVICE_LINKS = [
  { href: "/services/restoration-deep-clean", label: "Restoration deep clean" },
  { href: "/services/end-of-tenancy-cleaning", label: "End of tenancy cleaning" },
  { href: "/services/after-builders-cleaning", label: "After-builders cleaning" },
  { href: "/services/probate-and-pre-sale-cleaning", label: "Probate & pre-sale cleaning" },
  { href: "/services/commercial-office-cleaning", label: "Commercial & office cleaning" },
];

const COMPANY_LINKS = [
  { href: "/services", label: "All services" },
  { href: "/gallery", label: "Our work" },
  { href: "/areas", label: "Areas we cover" },
  { href: "/help", label: "Help centre" },
  { href: "/contact", label: "Contact us" },
  { href: "/book", label: "Request a booking" },
];

const LEGAL_LINKS = [
  { href: "/privacy-policy", label: "Privacy policy" },
  { href: "/terms", label: "Website terms" },
  { href: "/booking-terms", label: "Booking & cancellation terms" },
];

export function SiteFooter({
  phone,
  whatsapp,
  email,
  areas,
  openingHours,
}: {
  phone: string;
  whatsapp: string;
  email: string;
  areas: string[];
  openingHours: string;
}) {
  return (
    <footer className="mt-24 bg-forest-deep text-white/70">
      <div className="shell grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-4">
          <Logo tone="light" />
          <p className="mt-5 max-w-xs text-[0.9375rem] leading-relaxed">
            Detail-led cleaning for properties that need putting right. Based in Colchester, working across Essex and Suffolk.
          </p>

          <div className="mt-7 space-y-3 text-[0.9375rem]">
            <a href={whatsappLink(whatsapp)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-white transition-colors hover:text-champagne">
              <MessageCircle className="size-4 shrink-0 text-champagne" />
              {SITE.whatsappDisplay} on WhatsApp
            </a>
            <a href={telLink(phone)} className="flex items-center gap-2.5 text-white transition-colors hover:text-champagne">
              <Phone className="size-4 shrink-0 text-champagne" />
              {phone}
            </a>
            <a href={`mailto:${email}`} className="flex items-center gap-2.5 text-white transition-colors hover:text-champagne">
              <Mail className="size-4 shrink-0 text-champagne" />
              {email}
            </a>
          </div>

          <p className="mt-6 text-sm">{openingHours}</p>
        </div>

        <div className="md:col-span-3">
          <h2 className="font-display text-base font-medium text-white">Services</h2>
          <ul className="mt-4 space-y-2.5 text-[0.9375rem]">
            {SERVICE_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-champagne">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          <h2 className="font-display text-base font-medium text-white">Company</h2>
          <ul className="mt-4 space-y-2.5 text-[0.9375rem]">
            {COMPANY_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-champagne">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-3">
          <h2 className="font-display text-base font-medium text-white">Where we work</h2>
          <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-2 text-[0.9375rem]">
            {areas.map((area) => (
              <li key={area}>
                <Link
                  href={`/areas/${area.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  className="transition-colors hover:text-champagne"
                >
                  {area}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm leading-relaxed">
            We do not publish our registered office. Every job is quoted to your address.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="shell flex flex-col gap-4 py-6 text-sm md:flex-row md:items-center md:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {SITE.legalName}. Registered in England &amp; Wales, company no. {SITE.companyNumber}.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-champagne">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
