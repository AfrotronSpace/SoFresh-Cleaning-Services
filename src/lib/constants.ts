import type { PropertyKind, ServiceGroup, PriceMode, BookingStatus } from "@prisma/client";

export const SITE = {
  name: "So Fresh Cleaning Service",
  legalName: "So Fresh Cleaning Service Ltd",
  companyNumber: "16423190",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://sofreshcleaning.co.uk",
  email: "info@sofreshcleaning.co.uk",
  phone: "07386 528399",
  whatsapp: "447399505686",
  whatsappDisplay: "07399 505686",
  founded: 2025,
  tagline: "Premium, detail-led cleaning across Essex and Suffolk",
} as const;

export const SERVICE_GROUPS: Record<ServiceGroup, { label: string; blurb: string }> = {
  SIGNATURE: {
    label: "Signature restoration & one-off cleaning",
    blurb: "For properties that need properly working through, not a surface tidy-up.",
  },
  TRANSITION: {
    label: "Moving & property transition",
    blurb: "Deposits, handovers, sales and probate — cleaned to inspection standard.",
  },
  COMMERCIAL: {
    label: "Commercial & regular cleaning",
    blurb: "Offices, lettings portfolios and agreed maintenance schedules.",
  },
};

export const PROPERTY_KINDS: Record<PropertyKind, string> = {
  APARTMENT: "Flat or apartment",
  HOUSE: "House",
  OFFICE: "Office",
  COMMERCIAL_UNIT: "Commercial unit",
  GARAGE: "Garage or outbuilding",
  VEHICLE: "Vehicle",
  OUTDOOR: "Outdoor space",
  OTHER: "Something else",
};

export const OCCUPANCY_LABELS = {
  OCCUPIED: "Someone is living there",
  EMPTY: "Empty and cleared",
  PARTIALLY_FURNISHED: "Part-furnished or mid-move",
} as const;

export const CONDITION_LABELS = {
  LIGHT: "Tidy — wants a proper deep clean",
  MODERATE: "Lived-in, with some build-up",
  HEAVY: "Heavily soiled, needs restoring",
  BUILD_DUST: "Covered in building dust",
  UNKNOWN: "Not sure — I'll send photos",
} as const;

export const ACCESS_LABELS = {
  CUSTOMER_HOME: "I'll be there",
  SOMEONE_WILL_MEET: "Someone else will let you in",
  KEY_LEFT: "I'll leave a key",
  KEY_SAFE: "Key safe — I'll share the code",
  AGENT_OR_LANDLORD: "Agent or landlord holds the keys",
  TO_BE_ARRANGED: "We'll sort it nearer the time",
} as const;

export const URGENCY_LABELS = {
  STANDARD: "Standard — I have a few days",
  SHORT_NOTICE: "Short notice — within 48 hours",
  EMERGENCY: "Emergency — today if possible",
} as const;

export const CONTACT_PREFERENCE_LABELS = {
  WHATSAPP: "WhatsApp",
  PHONE: "Phone call",
  EMAIL: "Email",
} as const;

/** Customer-facing wording. "In review" is the phrase the business uses. */
export const BOOKING_STATUS: Record<
  BookingStatus,
  { label: string; customer: string; tone: "neutral" | "warn" | "good" | "bad" }
> = {
  IN_REVIEW: { label: "In review", customer: "We're reviewing your booking", tone: "neutral" },
  INFO_NEEDED: { label: "Info needed", customer: "We need a little more from you", tone: "warn" },
  QUOTED: { label: "Quoted", customer: "Your price is ready", tone: "warn" },
  CONFIRMED: { label: "Confirmed", customer: "Confirmed and in the diary", tone: "good" },
  COMPLETED: { label: "Completed", customer: "Completed", tone: "good" },
  CANCELLED: { label: "Cancelled", customer: "Cancelled", tone: "bad" },
  DECLINED: { label: "Declined", customer: "We couldn't take this one on", tone: "bad" },
};

export const PRICE_MODE_SUFFIX: Record<PriceMode, string> = {
  FROM: "",
  PER_HOUR: "per hour",
  FIXED: "",
  QUOTE_ONLY: "",
};

export const PRICE_MODE_PREFIX: Record<PriceMode, string> = {
  FROM: "from",
  PER_HOUR: "",
  FIXED: "",
  QUOTE_ONLY: "",
};
