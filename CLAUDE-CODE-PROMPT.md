# Claude Code build prompt — So Fresh Cleaning Service

Paste everything below the line into Claude Code in an empty directory. It rebuilds this
project from scratch. If you'd rather start from the code that already exists, skip to the
short version at the bottom.

---

Build a complete production website for **So Fresh Cleaning Service Ltd**, a UK cleaning
company. Work through it in phases, running `npx tsc --noEmit` after each one. Don't stop for
approval between phases.

## Stack

Next.js 15 App Router (TypeScript, strict), Prisma + PostgreSQL, Tailwind v4 (CSS-first
`@theme inline`, no `tailwind.config.js`), Framer Motion, hand-written shadcn/ui components
(new-york style), zod, nodemailer, jose + bcryptjs for auth. No NextAuth — the backend must
stay light.

## The business (use these facts exactly; do not invent others)

- **So Fresh Cleaning Service Ltd**, trading as So Fresh Cleaning Service. Companies House
  **16423190**. Started trading **2025**. Registered in England & Wales.
- Domain `sofreshcleaning.co.uk`, email `info@sofreshcleaning.co.uk`.
- Phone and WhatsApp are the same number: **07935 772485** (`447935772485` in international form).
- Areas: **Colchester** (base), Ipswich, Dedham, Clacton-on-Sea, Braintree, Brentwood,
  Frinton-on-Sea. Growth priorities: Colchester, Ipswich, Clacton-on-Sea, Braintree.
- The registered office is a home address. **Never publish it.** Show service areas only.
- Positioning: premium and detail-led, not cheapest. Priced on the condition and scope of
  the property, not on bedroom count or hours.
- Restoration Deep Cleans **from £350**. Regular domestic cleaning **£25/hour, Colchester
  only, selective** — it is explicitly not the growth focus.
- Replies same day. Quote within **24 hours** of having what's needed. Prefers **48–72
  hours** booking notice. **72 hours** cancellation notice, booking fee non-refundable
  inside that. Concerns about an agreed area reported within **15 hours** of completion.
- Payment by bank transfer or secure payment link, arranged directly. Commercial clients
  invoiced up to 30 days. **No card checkout anywhere on the website.**
- WhatsApp is the preferred first contact. Photos and video drive pricing.
- Public liability insured; provider and cover level not yet confirmed, so don't state them.

## Design direction

Do not produce the default AI-website look. Specifically avoid: cream/beige backgrounds,
Inter + Playfair, purple gradients, uniform border radii, everything centred, decorative
motion on every section.

- **Palette** — white base. `--paper #ffffff`, `--mist #eff3f0`, `--haze #f6f8f6`,
  `--ink #10201a`, `--forest #0d3b2a`, `--forest-deep #07271b`, `--verdant #1f7a55`,
  `--sage #5a6b63`, `--champagne #c6a86b`, `--champagne-soft #eadfc7`, `--line #e2e7e3`.
  Green, white and a soft gold accent — the brand colours the client asked for.
- **Type** — Fraunces (display, variable, `SOFT 40`, `opsz 72`) and Public Sans (body/UI).
- **Motif** — a champagne hairline called `.seam`, standing for the join between before and
  after. Use it instead of plain dividers, in the logo, and as the handle of an interactive
  before/after image slider.
- **Motion discipline** — exactly one non-user-triggered animation on the whole site (the
  hero crossfade). Everything else is interaction-driven. Respect `prefers-reduced-motion`
  globally.
- Left-aligned editorial layout. Centre only the closing CTA. Vary radii by surface size.
- Mobile-first throughout; 16px minimum on inputs so iOS doesn't zoom.

## Phase 1 — Schema

`prisma/schema.prisma` with these models. **No payment or card model at all.**

- `User` — email, name, phone, passwordHash, role (CUSTOMER/ADMIN), saved address,
  marketingOptIn, lastLoginAt.
- `Service` — slug, name, summary, body, `group` (SIGNATURE/TRANSITION/COMMERCIAL),
  `propertyKind` (APARTMENT/HOUSE/OFFICE/COMMERCIAL_UNIT/GARAGE/VEHICLE/OUTDOOR/OTHER),
  `priceMode` (FROM/PER_HOUR/FIXED/QUOTE_ONLY), `price` Decimal, **`negotiable` Boolean**,
  minimumCharge, `includes[]`, `excludes[]`, `extras` Json, durationEstimate, noticeHours,
  requiresSurvey, photosRecommended, heroImage, gallery[], faqs Json, whatsappPrompt,
  featured, active, sortOrder, seoTitle, seoDescription.
- `Booking` — unique human reference, **nullable userId so guests can book**, contact
  fields, contactPreference, address, propertyKind, bedrooms, bathrooms, occupancy,
  condition, preferredDate, alternativeDate, timePreference, datesFlexible, urgency,
  accessMethod, parkingNotes, petsOnSite, allergyNotes, notes, `isCustom` + `customBrief`,
  status (IN_REVIEW/INFO_NEEDED/QUOTED/CONFIRMED/COMPLETED/CANCELLED/DECLINED), source,
  quotedTotal, quoteNotes, adminNotes, and three timestamps:
  `customerEmailSentAt`, `adminEmailSentAt`, `whatsappForwardedAt`.
- `BookingItem` — links to Service but **freezes `nameSnapshot` and `priceSnapshot`**, so
  changing a price later never rewrites history. Plus `extras[]`.
- `Attachment`, `BookingEvent` (audit trail), `Enquiry`, `MessageLog`, `Testimonial`,
  `AreaCovered`.
- `SiteSetting` — a singleton row (`id @default("singleton")`) holding everything the owner
  can change without a deploy: business details, service areas, opening hours, the promise
  strings, cancellationHours, reclaimWindowHours, heroSlides Json, announcement, social URLs,
  and the three notification switches: `emailBookingToCustomer`, `emailBookingToAdmin`,
  `forwardBookingsToWhatsapp` + `whatsappForwardNumber`.

## Phase 2 — lib

- `utils.ts` — `cn`, `formatMoney` (GBP, drop trailing `.00`), date formatters,
  `generateReference()` producing `SF-XXXXXX` from an alphabet with no ambiguous characters,
  `slugify`, `toWhatsAppNumber`, `whatsappLink`, `telLink`, `looksLikeUkPostcode`.
- `settings.ts` — `loadSettings()` via `unstable_cache` tagged `site-settings`, **with a
  complete fallback object so the site still renders if Postgres is down**.
- `auth.ts` — jose HS256 JWT in an httpOnly cookie (30 days) + bcrypt. `requireUser`,
  `requireAdmin`, `authenticate`. Sign-in failures must be deliberately vague.
- `email.ts` — nodemailer, but **every send writes a MessageLog row**
  (QUEUED → SENT/FAILED/SKIPPED). With no `SMTP_HOST`, log to console and mark SKIPPED —
  the site must work fully without mail configured.
- `whatsapp.ts` — dual mode. Without Meta credentials, build a `wa.me` deep link for one-tap
  forwarding. With `WHATSAPP_PHONE_NUMBER_ID` + `WHATSAPP_ACCESS_TOKEN`, POST to Graph API
  v21.0. Log both paths.
- `validations.ts` — zod schemas, with a honeypot field on every public form. The booking
  schema must refine to: **at least one service selected, or a custom brief of 20+ chars**.
- `seo.ts` — `buildMetadata`, `localBusinessJsonLd` (HomeAndConstructionBusiness,
  region-only address), `serviceJsonLd`, `faqJsonLd`, `breadcrumbJsonLd`.
- `content.ts` — around 20 FAQs in 6 groups, written from the business facts above.

## Phase 3 — Public site

- **Hero** — background image and headline crossfade *together* (AnimatePresence, ~5.6s),
  slow Ken Burns scale, progress-bar tabs, reduced-motion aware.
- **Below the hero, a question-style tagline** — "What needs bringing back to life?" —
  introducing the service catalogue grid. Featured service gets a double-width tile.
- Then: dark forest showcase of the Restoration Deep Clean with the before/after seam
  slider; a numbered "from first message to booked job" sequence; reviews; areas; FAQ
  accordion; centred closing CTA. Include a plain reassurance block that no payment is taken
  through the website.
- **Service detail page** — image hero with price badge and **Negotiable badge when
  `negotiable` is true**, prose body, What's included / Not included columns, sticky
  practical-details sidebar, per-service FAQs, Service + Breadcrumb + FAQ JSON-LD, and
  **the booking wizard embedded at `#book` pre-selected to that service**.
- Also: `/services`, `/book`, `/help` (full Help Centre with sticky section nav),
  `/contact`, `/areas` and `/areas/[slug]` per-town SEO pages, `/privacy-policy`,
  `/booking-terms`, `/terms`.
- Sticky mobile contact bar (WhatsApp + Book) with safe-area insets.

## Phase 4 — Booking wizard

Six steps: **Services → Property → Where and when → Access and details → Your details →
Check and send.** Multi-select services with per-service extras chips. A dashed champagne
"None of these quite fit" panel that switches to a free-text custom brief, so a customer can
fully specify their own job. Per-step validation, Framer Motion horizontal transitions, a
step indicator that's clickable backwards, honeypot, and a review screen that states plainly
this is a request rather than a confirmed appointment.

On submit it POSTs to `/api/bookings`, then routes to `/booking-received/[reference]` which
shows **"your booked session is in review"**, the reference, a summary, what happens next, a
"send photos on WhatsApp" CTA, and an account-creation prompt for guests.

## Phase 5 — API and server actions

`POST /api/bookings` must: validate with zod; return a silent 200 on honeypot hit; freeze
name and price snapshots; retry reference collisions 5×; create an initial BookingEvent;
refresh a signed-in user's saved address; then fan out **each notification gated by its
SiteSetting switch** — customer email, admin email (reply-to set to the customer), WhatsApp
forward — all inside `Promise.allSettled` so **a notification failure can never fail the
booking**. Revalidate the admin and dashboard paths.

Server actions for auth, and for admin: save/soft-delete service, update booking (status +
quote + optional customer email), forward to WhatsApp, send message, save settings (reject
turning WhatsApp forwarding on with no number, and revalidate the `site-settings` tag).

## Phase 6 — Dashboards

- **Customer** (`/dashboard`) — their bookings split into in-progress and past, each with
  customer-facing status wording ("We're reviewing your booking"), the quote when one exists,
  a short event history, and WhatsApp/email buttons.
- **Admin** (`/admin`) — sidebar nav; overview with counts, pipeline total and configuration
  warnings (no SMTP, forwarding on without the API, no services published); bookings list
  with search and status filters; booking detail with full property/access data, the status +
  quote editor, and WhatsApp forwarding; services CRUD **exposing the negotiable checkbox**;
  customers; enquiries; messages with a composer; and settings exposing the three
  notification switches.

## Phase 7 — Infrastructure

`robots.ts`, `sitemap.ts` (services and areas from the database, wrapped in try/catch so a
build without a database still succeeds), `manifest.ts`, `icon.svg`, `apple-icon.png`,
`opengraph-image.tsx` (`ImageResponse`), `public/robots.txt` fallback, `not-found.tsx`,
`error.tsx`, `loading.tsx`. Security headers and `remotePatterns` in `next.config.mjs`.

## Phase 8 — Seed

`prisma/seed.ts`, idempotent, with the real catalogue: Restoration Deep Clean (featured,
FROM £350, negotiable), End-of-Tenancy, After-Builders (requiresSurvey), Probate & Pre-Sale,
Move-In, Commercial/Office, Emergency, Oven & Appliance, Carpet (specialist partner),
Regular Domestic (PER_HOUR £25, Colchester only). Plus the seven areas and the settings
singleton.

**Do not invent testimonial text.** Seed the customers' names with clearly bracketed
placeholder bodies to be replaced with their genuine Google reviews.

## Rules that hold throughout

1. Never publish the registered office address.
2. No payment capture anywhere — not in the schema, not in the UI.
3. Every promise shown to a customer comes from the facts above. Don't invent a response
   time, a guarantee, or an accreditation.
4. Notifications are switches in the database, never hardcoded.
5. The site must run with no SMTP and no WhatsApp API configured.
6. Accessibility is not optional: focus-visible styles, `aria-current` on nav, keyboard
   support on the before/after slider, honest error announcement order in form fields.

---

## Short version — continuing from the existing code

> This is a Next.js 15 + Prisma site for So Fresh Cleaning Service, a premium UK cleaning
> company in Essex/Suffolk. Read `README.md` and `SETUP-NOTES.md` first, then
> `prisma/schema.prisma` and `src/lib/constants.ts` to pick up the conventions.
>
> Design rules: white base, forest green and champagne gold, Fraunces + Public Sans, the
> `.seam` hairline motif, one non-user-triggered animation on the site, mobile-first.
>
> Business rules: never publish the registered office; no payment capture anywhere; every
> customer-facing promise traces back to the discovery forms; notification behaviour lives in
> `SiteSetting`, not in code; the site must run with no SMTP and no WhatsApp API configured.
>
> [then your task]
