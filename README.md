# So Fresh Cleaning Service — website

Next.js 15 (App Router) · Prisma · PostgreSQL · Tailwind v4 · Framer Motion

Built from the two Afrotron discovery forms (AFT-F-01 and AFT-F-02). Every promise on the
site — response times, the 72-hour cancellation window, the booking fee wording — comes from
the business's own answers, so nothing overstates what they can deliver.

---

## Getting it running

```bash
cp .env.example .env        # fill in DATABASE_URL, DIRECT_URL and AUTH_SECRET
pnpm install                # pnpm is pinned in package.json#packageManager
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Generate a session secret with:

```bash
openssl rand -base64 32
```

Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` before seeding, or no admin account is
created and `/admin` will be unreachable.

## What's where

```
prisma/schema.prisma      11 models. Deliberately no payment or card model.
prisma/seed.ts            The real service catalogue, areas, and site settings.
src/lib/                  Auth, email, WhatsApp, settings, SEO, validation, copy.
src/components/site/      Public UI, including the hero carousel and before/after seam.
src/components/booking/   The six-step booking wizard.
src/components/admin/     Dashboard forms.
src/app/(site)/           Public pages.
src/app/(auth)/           Sign in and sign up.
src/app/dashboard/        Customer view of their own bookings.
src/app/admin/            Business dashboard.
```

## The two things to do before launch

**Replace the placeholder images.** Everything in `public/images/` is a generated
placeholder with the word PLACEHOLDER printed on it. The business has real before-and-after
photos; those will outperform anything else on the site.

**Replace the placeholder review text.** `prisma/seed.ts` seeds six testimonials with the
real customers' names but bracketed placeholder text, because inventing review wording and
attributing it to a named person is not something to ship. Paste the genuine Google review
text in before launch.

## Deploying

Railway, via the committed `Dockerfile`, with Cloudflare R2 for customer photo
and video uploads. Everything platform-specific — environment variables, the
Docker image, database setup, R2 bucket and CORS, and the post-deploy checklist
— is in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Notifications

Nothing sends silently. Every email and WhatsApp message is written to `MessageLog` and
visible under Admin → Messages, including ones that were skipped because a service wasn't
configured.

- **Email** needs `SMTP_*` in `.env`. Without it, mail is logged as `SKIPPED` and the site
  still works.
- **WhatsApp forwarding** works with no setup at all — each booking gives you a one-tap
  `wa.me` link in the dashboard. Add `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN`
  (Meta Cloud API) to have it send by itself.

Which notifications fire is controlled by three switches in Admin → Settings, not by code.

## Not built, on purpose

- **No payments.** The business takes payment by bank transfer or a payment link, away from
  the website. There is no checkout and no card data anywhere in the schema.
- **No file uploads yet.** The `Attachment` model is in the schema and the booking flow
  points customers to WhatsApp for photos, which is how the business already works. Wiring
  up the upload flow with the already-configured Cloudflare R2 layer
(`src/lib/r2.ts`) is a contained piece of work when it's wanted — see
`docs/STATUS.md` item 6.
