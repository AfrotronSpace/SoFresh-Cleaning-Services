# So Fresh Cleaning Service — working notes for Claude

Next.js 15 (App Router) · React 19 · Prisma 6 / PostgreSQL · Tailwind v4 · Framer Motion 11.

Read this first, then `docs/STATUS.md` (what is and isn't built) and
`docs/FINDINGS.md` (the open defect register). `docs/BUSINESS-RULES.md` traces
every customer-facing promise back to the client's own answers.

---

## Commands

```bash
pnpm install                 # pnpm is pinned in package.json#packageManager
npx prisma migrate dev       # no migrations are committed yet; this creates the first
npm run db:seed              # CURRENTLY BROKEN — see docs/FINDINGS.md #1
npm run dev
npm run typecheck            # clean as of 2026-09-09
npm run build                # succeeds even with the database unreachable
```

Deploys to **Railway** as a Docker container (see `Dockerfile`), Postgres via
Railway's own plugin or an external provider, and uploads to **Cloudflare
R2**. Read `docs/DEPLOYMENT.md` before touching `Dockerfile`, `railway.json`,
`next.config.mjs`, the Prisma datasource block or `src/lib/r2.ts` — several
settings there work around specific, verified failures (a missing OpenSSL in
the base image, pnpm's node_modules layout defeating the standard
Prisma-in-Docker advice) and are commented as such.

There is no test suite and no linter config beyond `next lint`.

## The five rules that override normal judgement

These come from the client's discovery forms and are not negotiable without
asking. Breaking one is a business problem, not a style problem.

1. **Never publish the registered office.** Form AFT-F-01 E4 says service areas
   only. Currently honoured — `SiteSetting.serviceAreas` is public, the address
   is nowhere in the codebase, and `localBusinessJsonLd` omits `streetAddress`.
2. **No payment capture, anywhere.** No checkout, no card fields, no payment
   model in the schema. Money moves by bank transfer or a payment link, away
   from the site. Say so on the page rather than going quiet about it.
3. **Every customer-facing promise traces to a discovery-form answer.** If you
   are about to write a response time, a guarantee window or a fee rule, find
   it in `docs/BUSINESS-RULES.md` first. Do not invent one.
4. **Notification behaviour lives in `SiteSetting`, not in code.** The three
   switches (`emailBookingToCustomer`, `emailBookingToAdmin`,
   `forwardBookingsToWhatsapp`) plus `cancellationHours` and
   `reclaimWindowHours` are admin-editable. Never hardcode a branch on them.
5. **The site must run with no SMTP and no WhatsApp API configured.** Both
   integrations degrade to a `MessageLog` row with status `SKIPPED`. Never let
   a missing credential break a booking.

## Design rules

White base (white is a stated brand colour, not a default), forest green
structural, champagne gold only where the eye should stop — price, seam, one
CTA per screen. Fraunces display + Public Sans body. The `.seam` hairline
motif in `globals.css` replaces horizontal dividers. Mobile-first.

**One non-user-triggered animation on the whole site**: the hero cross-fade in
`src/components/site/hero.tsx`. Everything else moves only when someone acts.
If you add an autoplaying animation, you are breaking this rule.

## Conventions worth copying

- **Money** is `Decimal` in Prisma, `string` across the server/client boundary
  (`s.price.toString()`), formatted only by `formatMoney()`. Never pass a
  `Decimal` into a client component.
- **Booking history is frozen.** `BookingItem` stores `nameSnapshot` and
  `priceSnapshot` at submit time so catalogue edits never rewrite the past.
  Services are soft-deleted (`active: false`), never removed.
- **Settings are read on nearly every request** via `loadSettings()`, which is
  `unstable_cache`d under the tag `site-settings` and falls back to a hardcoded
  `FALLBACK` object if the database is unreachable. After writing settings,
  call `revalidateTag("site-settings")`.
- **Every page that touches the database wraps the query in `.catch(() => [])`
  or a try/catch.** This is deliberate: the marketing site renders even when
  Postgres is down. Keep doing it.
- **Server-side validation is Zod in `src/lib/validations.ts`.** API routes and
  server actions both `safeParse`, then flatten issues into
  `fieldErrors: Record<string, string>` keyed by the first path segment.
- **Radix `Checkbox`/`Switch` bubble a hidden input**, so `name` + `defaultChecked`
  plus `formData.get(name) === "on"` works. `SettingsForm` hand-rolls a hidden
  input for its switches; that is belt-and-braces, not a required pattern.

## Gotchas that will cost you an hour

- `src/lib/auth.ts`, `email.ts`, `whatsapp.ts` and `settings.ts` start with
  `import "server-only"`. Next aliases that package internally, but it is **not
  installed and not in package.json** — so any script run outside Next (`tsx`,
  a migration helper, a cron script) that imports them dies with
  `Cannot find module 'server-only'`. This is why the seed is broken.
- `next/font/google` fetches Fraunces and Public Sans **at build time**. A build
  machine with no network will fail here, not in your code.
- `public/robots.txt` silently wins over `src/app/robots.ts`. The route file is
  dead. Edit the static file, or delete it and keep the route — not both.
- The generated OG image is served at `/opengraph-image`, **not**
  `/opengraph-image.png`. `src/lib/seo.ts` gets this wrong; see findings #2.
- Everything under `(site)` is dynamically rendered because the layout calls
  `getSession()` (a `cookies()` read) and most pages set
  `export const dynamic = "force-dynamic"`. There is no ISR anywhere.
- The app runs as **one persistent container** on Railway, not per-request
  functions — `DATABASE_URL`/`DIRECT_URL` no longer need a pooler the way a
  serverless host would force. Still fine to point them at an external pooled
  Postgres if you use one.
- **Uploads still go straight to R2 from the browser**, not through the
  server. Railway has no small body-size ceiling the way Vercel did, but
  proxying customer video through your own container's bandwidth for no
  reason would be a worse design anyway. `src/lib/r2.ts` handles it.
- The two AWS SDK options in `r2.ts` (`requestChecksumCalculation` and
  `signableHeaders`) are load-bearing — removing either breaks uploads only
  against real R2, never locally. The reasons are in the file.

## Where things live

```
prisma/schema.prisma        11 models. Deliberately no payment or card model.
prisma/seed.ts              Real service catalogue, areas, settings, placeholder reviews.
src/lib/constants.ts        SITE object + all enum→label maps. Start here.
src/lib/validations.ts      Every Zod schema.
src/lib/settings.ts         loadSettings() — cached SiteSetting with a safe fallback.
src/lib/content.ts          Help Centre copy. Feeds the FAQ page, homepage accordion
                            AND the FAQPage structured data — one edit, three places.
src/lib/email.ts            sendEmail() + emailShell(). Always writes a MessageLog row.
src/lib/whatsapp.ts         Deep link (no setup) or Cloud API (credentials set).
src/lib/r2.ts               R2 presigned uploads/downloads. Configured and
                            tested; not yet wired to any UI.
src/app/(site)/             Public pages.
src/app/(auth)/             Sign in / sign up.
src/app/dashboard/          Customer's own bookings.
src/app/admin/              Business dashboard (7 sections).
src/app/api/                Two POST routes (bookings, contact) plus /api/health
                            for Railway's health check.
src/app/actions/            Server actions: auth.ts and admin.ts.
src/components/booking/     The six-step booking wizard (867 lines, the big one).
Dockerfile                  Three-stage build for Railway. Read the comments
                            before changing the runner stage — two real,
                            verified bugs (missing OpenSSL, pnpm's node_modules
                            layout) are fixed there and easy to reintroduce.
railway.json                Build/deploy config: Dockerfile builder, migrate
                            deploy as a pre-deploy step, health check path.
                            Deprecated by Railway in favour of Infrastructure
                            as Code, hard cutoff 2026-12-01 — see DEPLOYMENT.md.
```

## Before you touch anything

`docs/FINDINGS.md` has 27 open items ranked by severity, each with a file and
line reference and a suggested fix. Four of them are launch blockers. If you
are picking up work, start there rather than reading the codebase cold.
