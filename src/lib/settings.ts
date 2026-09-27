import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/constants";

export type Settings = Awaited<ReturnType<typeof loadSettings>>;

const FALLBACK = {
  id: "singleton",
  businessName: SITE.name,
  legalName: SITE.legalName,
  companyNumber: SITE.companyNumber,
  tagline: "Premium, detail-led cleaning across Essex and Suffolk",
  phone: SITE.phone,
  whatsapp: SITE.whatsapp,
  email: SITE.email,
  serviceAreas: [
    "Colchester",
    "Ipswich",
    "Dedham",
    "Clacton-on-Sea",
    "Braintree",
    "Brentwood",
    "Frinton-on-Sea",
  ],
  openingHours: "Monday to Sunday, by appointment",
  responsePromise: "We reply the same day, usually much sooner during working hours.",
  quoteWindow: "Your fixed price arrives within 24 hours of us having everything we need.",
  bookingFeeNote:
    "A booking fee secures your date and comes off the final balance. We confirm the exact amount before you commit.",
  cancellationHours: 72,
  reclaimWindowHours: 15,
  emailBookingToAdmin: true,
  emailBookingToCustomer: true,
  forwardBookingsToWhatsapp: false,
  whatsappForwardNumber: null as string | null,
  adminNotifyEmail: SITE.email,
  adminNotifyCc: null as string | null,
  emailReviewToAdmin: true,
  announcementText: null as string | null,
  announcementActive: false,
  heroSlides: null as unknown,
  googleReviewUrl: null as string | null,
  facebookUrl: null as string | null,
  instagramUrl: null as string | null,
  tiktokUrl: null as string | null,
  updatedAt: new Date(),
};

/**
 * Settings are read on nearly every request, so they are cached and
 * invalidated by tag whenever the admin saves. If the database is
 * unreachable the site still renders with sane defaults rather than 500ing.
 */
export const loadSettings = unstable_cache(
  async () => {
    try {
      const row = await prisma.siteSetting.findUnique({ where: { id: "singleton" } });
      return row ? { ...FALLBACK, ...row } : FALLBACK;
    } catch {
      return FALLBACK;
    }
  },
  ["site-settings"],
  { tags: ["site-settings"], revalidate: 300 },
);
