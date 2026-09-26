import { z } from "zod";
import { GALLERY_KEY_PATTERN, MAX_FRAMES_PER_JOB } from "@/lib/gallery";

const phone = z
  .string()
  .trim()
  .min(7, "Enter a phone number we can reach you on")
  .max(24)
  .regex(/^[0-9+()\s-]+$/, "Use digits, spaces and + only");

const postcode = z
  .string()
  .trim()
  .min(4, "Enter your postcode")
  .max(10)
  .transform((v) => v.toUpperCase());

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: phone.optional().or(z.literal("")),
  password: z.string().min(8, "Use at least 8 characters").max(100),
  marketingOptIn: z.boolean().optional().default(false),
});

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: phone.optional().or(z.literal("")),
  postcode: z.string().trim().max(10).optional().or(z.literal("")),
  subject: z.string().trim().min(2, "What is this about?").max(120),
  message: z.string().trim().min(10, "Tell us a little more").max(4000),
  // Honeypot: real people never fill this in.
  company: z.string().max(0).optional(),
});

export const bookingItemSchema = z.object({
  serviceId: z.string().min(1),
  quantity: z.number().int().min(1).max(20).default(1),
  extras: z.array(z.string()).default([]),
  notes: z.string().max(1000).optional(),
});

export const bookingSchema = z
  .object({
    items: z.array(bookingItemSchema).default([]),
    isCustom: z.boolean().default(false),
    customBrief: z.string().max(4000).optional(),

    propertyKind: z.enum([
      "APARTMENT",
      "HOUSE",
      "OFFICE",
      "COMMERCIAL_UNIT",
      "GARAGE",
      "VEHICLE",
      "OUTDOOR",
      "OTHER",
    ]),
    bedrooms: z.number().int().min(0).max(30).optional(),
    bathrooms: z.number().int().min(0).max(30).optional(),
    occupancy: z.enum(["OCCUPIED", "EMPTY", "PARTIALLY_FURNISHED"]).default("OCCUPIED"),
    condition: z
      .enum(["LIGHT", "MODERATE", "HEAVY", "BUILD_DUST", "UNKNOWN"])
      .default("UNKNOWN"),

    addressLine1: z.string().trim().max(120).optional().or(z.literal("")),
    addressLine2: z.string().trim().max(120).optional().or(z.literal("")),
    city: z.string().trim().max(80).optional().or(z.literal("")),
    postcode,

    preferredDate: z.string().min(1, "Choose a preferred date"),
    alternativeDate: z.string().optional().or(z.literal("")),
    timePreference: z.string().max(40).optional().or(z.literal("")),
    datesFlexible: z.boolean().default(false),
    urgency: z.enum(["STANDARD", "SHORT_NOTICE", "EMERGENCY"]).default("STANDARD"),

    accessMethod: z
      .enum([
        "CUSTOMER_HOME",
        "SOMEONE_WILL_MEET",
        "KEY_LEFT",
        "KEY_SAFE",
        "AGENT_OR_LANDLORD",
        "TO_BE_ARRANGED",
      ])
      .default("CUSTOMER_HOME"),
    parkingNotes: z.string().max(500).optional().or(z.literal("")),
    petsOnSite: z.boolean().default(false),
    allergyNotes: z.string().max(500).optional().or(z.literal("")),
    notes: z.string().max(4000).optional().or(z.literal("")),

    contactName: z.string().trim().min(2, "Enter your name").max(80),
    contactEmail: z.string().trim().toLowerCase().email("Enter a valid email address"),
    contactPhone: phone,
    contactPreference: z.enum(["WHATSAPP", "PHONE", "EMAIL"]).default("WHATSAPP"),
    marketingOptIn: z.boolean().default(false),
    acceptedTerms: z.literal(true, {
      errorMap: () => ({ message: "Please accept the booking terms to continue" }),
    }),
    company: z.string().max(0).optional(), // honeypot
  })
  .refine((data) => data.items.length > 0 || (data.isCustom && (data.customBrief ?? "").length > 20), {
    message: "Choose at least one service, or describe the job you need doing",
    path: ["items"],
  });

export const serviceExtraSchema = z.object({
  name: z.string().trim().min(1).max(120),
  note: z.string().trim().max(200).optional().or(z.literal("")),
});

export const serviceFaqSchema = z.object({
  q: z.string().trim().min(3, "Needs a question").max(200),
  a: z.string().trim().min(3, "Needs an answer").max(2000),
});

export const serviceImageSchema = z.object({
  url: z.string().trim().min(1).max(500),
  alt: z.string().trim().max(160).optional().or(z.literal("")),
  caption: z.string().trim().max(240).optional().or(z.literal("")),
});

export const serviceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  summary: z.string().trim().min(10).max(300),
  body: z.string().trim().min(20).max(20000),
  group: z.enum(["SIGNATURE", "TRANSITION", "COMMERCIAL"]),
  propertyKind: z.enum([
    "APARTMENT",
    "HOUSE",
    "OFFICE",
    "COMMERCIAL_UNIT",
    "GARAGE",
    "VEHICLE",
    "OUTDOOR",
    "OTHER",
  ]),
  priceMode: z.enum(["FROM", "PER_HOUR", "FIXED", "QUOTE_ONLY"]),
  price: z.number().nonnegative().max(1_000_000).nullable().optional(),
  negotiable: z.boolean().default(false),
  minimumCharge: z.string().max(160).optional().or(z.literal("")),
  includes: z.array(z.string().max(300)).default([]),
  excludes: z.array(z.string().max(300)).default([]),
  extras: z.array(serviceExtraSchema).max(20).default([]),
  durationEstimate: z.string().max(160).optional().or(z.literal("")),
  noticeHours: z.number().int().min(0).max(2160).default(48),
  requiresSurvey: z.boolean().default(false),
  photosRecommended: z.boolean().default(true),
  icon: z.string().trim().max(40).optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  heroImage: z.string().max(500).optional().or(z.literal("")),
  images: z.array(serviceImageSchema).max(24).default([]),
  faqs: z.array(serviceFaqSchema).max(12).default([]),
  whatsappPrompt: z.string().max(300).optional().or(z.literal("")),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(9999).default(100),
  seoTitle: z.string().max(70).optional().or(z.literal("")),
  seoDescription: z.string().max(180).optional().or(z.literal("")),
});

export const settingsSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  tagline: z.string().trim().max(200),
  phone: z.string().trim().max(30),
  whatsapp: z.string().trim().max(30),
  email: z.string().trim().toLowerCase().email(),
  serviceAreas: z.array(z.string().max(80)).default([]),
  openingHours: z.string().max(200),
  responsePromise: z.string().max(300),
  quoteWindow: z.string().max(300),
  bookingFeeNote: z.string().max(600),
  cancellationHours: z.number().int().min(0).max(720),
  reclaimWindowHours: z.number().int().min(0).max(720),
  emailBookingToAdmin: z.boolean(),
  emailBookingToCustomer: z.boolean(),
  forwardBookingsToWhatsapp: z.boolean(),
  whatsappForwardNumber: z.string().max(30).optional().or(z.literal("")),
  adminNotifyEmail: z.string().trim().toLowerCase().email(),
  adminNotifyCc: z.string().max(160).optional().or(z.literal("")),
  announcementText: z.string().max(200).optional().or(z.literal("")),
  announcementActive: z.boolean(),
  googleReviewUrl: z.string().max(400).optional().or(z.literal("")),
  facebookUrl: z.string().max(400).optional().or(z.literal("")),
  instagramUrl: z.string().max(400).optional().or(z.literal("")),
  tiktokUrl: z.string().max(400).optional().or(z.literal("")),
});

const galleryKey = z.string().trim().max(300).regex(GALLERY_KEY_PATTERN, "That file isn't from the gallery uploader");

export const gallerySlotSchema = z.object({
  type: z.enum(["PHOTO", "VIDEO"]),
  key: galleryKey,
  poster: galleryKey.nullable().optional(),
  width: z.number().int().positive().max(20000).nullable().optional(),
  height: z.number().int().positive().max(20000).nullable().optional(),
  alt: z.string().trim().max(160).optional().or(z.literal("")),
});

/** One file as the inbox uploader records it. */
export const inboxUploadSchema = gallerySlotSchema.extend({
  originalName: z.string().trim().max(200).default(""),
});

export const inboxIdsSchema = z.array(z.string().min(1).max(40)).min(1).max(500);

/** Files the job editor sends back to the inbox instead of deleting. */
export const inboxReturnSchema = z.array(gallerySlotSchema).max(MAX_FRAMES_PER_JOB * 2);

export const galleryFrameSchema = z
  .object({
    layout: z.enum(["SINGLE", "BEFORE_AFTER"]),
    primary: gallerySlotSchema,
    secondary: gallerySlotSchema.nullable().optional(),
    caption: z.string().trim().max(240).optional().or(z.literal("")),
  })
  .refine((f) => (f.layout === "BEFORE_AFTER" ? Boolean(f.secondary) : !f.secondary), {
    message: "A before & after needs both files; a single photo or video has only one",
    path: ["media"],
  });

export const galleryJobSchema = z
  .object({
    title: z.string().trim().max(120).optional().or(z.literal("")),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    completedOn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date")
      .refine((v) => !Number.isNaN(Date.parse(v)), "Pick a real date")
      .optional()
      .or(z.literal("")),
    // Rule 1 extends to customers: a town, never a street, number or postcode.
    area: z
      .string()
      .trim()
      .max(80)
      .regex(/^[^0-9]*$/, "Town or area only — no house numbers or postcodes")
      .optional()
      .or(z.literal("")),
    serviceId: z.string().max(40).optional().or(z.literal("")),
    published: z.boolean().default(false),
    featured: z.boolean().default(false),
    media: z.array(galleryFrameSchema).max(MAX_FRAMES_PER_JOB, `Up to ${MAX_FRAMES_PER_JOB} items per job — split it into two`),
  })
  .refine((job) => !job.published || job.media.length > 0, {
    message: "Add at least one photo or video before putting this on the website",
    path: ["media"],
  });

export const messageSchema = z.object({
  recipientId: z.string().optional(),
  bookingId: z.string().optional(),
  toAddress: z.string().trim().min(3).max(160),
  channel: z.enum(["EMAIL", "WHATSAPP", "INTERNAL_NOTE"]).default("EMAIL"),
  subject: z.string().trim().max(160).optional().or(z.literal("")),
  body: z.string().trim().min(2).max(8000),
});

export type BookingInput = z.infer<typeof bookingSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
