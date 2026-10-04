# Defect register

Reviewed 8 September 2026. Deployment configuration added 9 September 2026
(`docs/DEPLOYMENT.md`); findings #12 and #13 resolved as part of that work.
`npm run typecheck` passes clean. `npm run build` succeeds (34 routes) even
with Postgres unreachable. Everything below is a real defect, not a style
preference; each was confirmed by reading the code and, where marked
**[verified]**, by running it.

Severity: **S1** blocks launch · **S2** wrong in production · **S3** worth
fixing before the client sees it · **S4** cleanup.

---

## S1 — launch blockers

### 1. ~~`npm run db:seed` fails outright~~ — resolved

Fixed via the first option below: `hashPassword`/`verifyPassword` moved to
`src/lib/password.ts`, no `server-only` import. `scripts/create-admin.ts` uses
the same helper. The warning in the last paragraph was prescient — see #22,
a different script hitting a different wall in production.

<details>
<summary>Original write-up</summary>

`npm run db:seed` fails outright — the documented setup path is broken **[verified]**

`prisma/seed.ts:10` imports `hashPassword` from `../src/lib/auth`, and
`src/lib/auth.ts:1` is `import "server-only"`. Next.js aliases `server-only`
internally, but the package is **not installed and not in `package.json`** —
so `tsx` cannot resolve it.

```
$ npx tsx prisma/seed.ts
Error: Cannot find module 'server-only'
Require stack:
- src/lib/auth.ts
- prisma/seed.ts
```

Nothing seeds: no services, no areas, no site settings, no admin account. A
new developer following `README.md` gets an empty site and an unreachable
`/admin`.

**Fix (pick one):**
- Move `hashPassword`/`verifyPassword` into a `src/lib/password.ts` with no
  `server-only` import, and have both `auth.ts` and the seed import that. This
  is the cleanest — the bcrypt helpers are not server-secret, the session
  helpers are.
- Or `pnpm add server-only` so the bare specifier resolves outside Next too.
- Or call `bcrypt.hash` directly in the seed.

Any future script run outside Next (a cron job, a data migration, a backfill)
hits this same wall, so fixing it properly is worth the ten minutes.

### 2. ~~Every social share of a service page has a broken preview image~~ — resolved 28 Sep 2026 **[verified]**

The generated `src/app/opengraph-image.tsx` was replaced by the brand pack's
own OG image as a static `src/app/opengraph-image.png`. Next serves a static
metadata image at `/opengraph-image.png`, which is exactly the URL `seo.ts`
and `localBusinessJsonLd` already pointed at. Verified against a production
build: `GET /opengraph-image.png -> 200 image/png`, and `/help` and
`/services` both render an `og:image` pointing at it. If the image is ever
turned back into a generated `.tsx` route, this breaks again.

<details>
<summary>Original write-up</summary>



`src/lib/seo.ts:17` defaults the OG image to `/opengraph-image.png`. The route
Next actually generates is `/opengraph-image`:

```
GET /opengraph-image.png -> 404
GET /opengraph-image     -> 200 image/png
```

Rendered `<head>` on `/help`:
`<meta property="og:image" content="https://sofreshcleaning.co.uk/opengraph-image.png"/>`

The homepage is fine (it doesn't use `buildMetadata`, so Next injects the
correct hashed URL). **Every other page is broken** — all ten service pages,
all seven area pages, contact, help, book, and the three legal pages.
`localBusinessJsonLd` (`seo.ts:59`) points `image` at the same 404.

This matters more here than on most sites: WhatsApp is the client's primary
channel (AFT-F-01 E5), and a pasted service link will show no preview card.

**Fix:** in `seo.ts`, drop the `image` default entirely and let Next's
file-based metadata inherit — or, if an explicit default is wanted, use
`new URL("/opengraph-image", SITE.url)`. Same for the JSON-LD `image`.

</details>

### 3. Literal HTML entity rendered as text on 6 of 10 service pages **[verified]**

`src/app/(site)/services/[slug]/page.tsx:81`

```ts
: "Priced once we&rsquo;ve seen photos"
```

This is a JS string, not JSX — React escapes it, so the gold price badge in
the page hero literally reads **`Priced once we&rsquo;ve seen photos`**.

Affects every `QUOTE_ONLY` service that doesn't require a survey:
end-of-tenancy, probate & pre-sale, move-in, emergency, oven & appliance,
carpet. That includes **End-of-Tenancy Cleaning, the client's #2 priority
service** (AFT-F-01 C2).

**Fix:** `"Priced once we've seen photos"` — a plain apostrophe. The entity is
only needed in JSX text nodes, and even there only to satisfy a lint rule.

### 4. ~~Six fake-looking reviews ship on the homepage with real customers' names~~ — resolved 27 Sep 2026 **[verified]**

Reviews now carry a `status` (`PENDING` / `APPROVED` / `HIDDEN`) and only
`APPROVED` ones reach the site. The seed creates the six placeholders as
`PENDING`, and the `20260927120000_reviews` migration moves any existing
placeholder row (body starting `[Paste this customer`) to `PENDING` rather
than carrying `active = true` over as live. Approving a placeholder is refused
twice over: `adminReviewSchema` rejects it, and `setReviewStatusAction`
filters it out of the quick-approve update. The homepage wording no longer
claims every review is from Google, since customers can now leave one on the
site. What's left is item 3 in `STATUS.md`: pasting in the real text.

<details>
<summary>Original write-up</summary>


`prisma/seed.ts` seeds six testimonials with real first-name-plus-initial
attributions (Nicola R., Donna M., Sophie T., Katie L., Wendy P., Rebecca H.)
and a body of:

> `[Paste this customer's real Google review text here before launch — see Admin → Settings for the review link.]`

Directly above them, `src/components/site/reviews.tsx:16` states:

> "Every review below is from a real So Fresh customer on our Google Business Profile."

Nothing prevents this reaching production. `README.md` flags it as a to-do, but
a to-do is not a guard.

**Fix:** seed placeholders with `active: false`, so they are invisible until
the real text is pasted in and the row is switched on. One-line change in the
seed's `createMany`, and it makes the failure mode safe by default.

</details>

---

### 22. ~~`create-admin` and `db:seed` couldn't run in the deployed container~~ — resolved 27 Sep 2026 **[verified against a real built image]**

`Dockerfile`'s `runner` stage copied `node_modules`, `prisma/`, `.next` and
`public` — never `scripts/` or `src/`. `tsx` was present (it's inside
`node_modules`), but had nothing to run:

```
$ npm run create-admin -- admin@sofresh.com ...
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/app/scripts/create-admin.ts'
```

Caught live: the client couldn't create a production admin account after the
first deploy. `README.md`'s documented path (`npm run create-admin --`, run
inside the container via `railway ssh`) was broken for every deployment, not
just this one — nothing about it depends on this project's specific data.

**Fix:** the runner stage now also copies `scripts/`, `src/lib/password.ts`
(the one file both scripts import — a relative path, not the `@/*` alias, so
nothing else in `src/` is needed) and `tsconfig.json`. Verified by building
the real image and running both `create-admin` and `db:seed` inside it
against a live Postgres — the created row's password hash round-trips
through `verifyPassword`, and re-running the seed doesn't duplicate services.

## S2 — wrong in production

### 5. Signing up with someone else's email exposes their bookings

`src/app/dashboard/page.tsx:21`

```ts
where: { OR: [{ userId: session.id }, { contactEmail: session.email }] }
```

Guest bookings are claimed by email match. There is **no email verification**
anywhere in the codebase. So: a guest books as `alice@example.com` and never
registers; anyone who knows that address registers it and immediately sees
Alice's name, address, postcode, dates, quoted totals and booking history.

The convenience is genuinely good — it is worth keeping — but it needs a
verification step behind it.

**Fix:** either add an email-verification token before the `contactEmail`
branch is honoured, or drop the `contactEmail` match and replace it with an
explicit "claim this booking" flow keyed on the booking reference plus the
email. The second is much less work and is arguably better UX.

### 6. Open redirect on sign-in and sign-up

`src/app/actions/auth.ts:47` and `:64`

```ts
redirect(String(formData.get("next") || "/dashboard"));
```

`next` comes from `?next=` (`sign-in/page.tsx:13` → hidden input at
`auth-form.tsx:34`) and is never checked for being a relative path.
`/sign-in?next=https://evil.example/login` sends the user off-site
**after** a successful sign-in, which is exactly when they trust the page.

**Fix:** `const next = String(formData.get("next") || ""); const safe =
next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";`

### 7. The Help Centre and the booking terms will contradict each other

`src/lib/content.ts` hardcodes the two figures that `SiteSetting` exists to
control:

| | content.ts | booking-terms page |
|---|---|---|
| Cancellation | `"72 hours"` (lines 53, 63, 67) | `{settings.cancellationHours}` |
| Report a problem | `"15 hours"` (line 99) | `{settings.reclaimWindowHours}` |

`SETUP-NOTES.md` §2 explicitly invites the client to change
`reclaimWindowHours` from 15 to 48 in Admin → Settings. The moment she does,
the booking terms say 48 and the Help Centre still says 15 — **two
contradictory contractual promises on the same website**, one of which is also
published to Google as `FAQPage` structured data.

This breaks business rule 4 (notification and policy behaviour lives in
`SiteSetting`, not code).

**Fix:** make `FAQ_GROUPS` a function of settings —
`buildFaqs(settings)` — and interpolate the two numbers. The call sites
(`help/page.tsx`, `page.tsx`, the JSON-LD builders) already have `settings` in
scope.

### 8. Changing the WhatsApp number in Settings leaves stale numbers on the page

Six places render `SITE.whatsappDisplay` / `SITE.phone` / `SITE.email` from
the hardcoded `constants.ts` object while the adjacent `href` uses
`settings.*`:

- `src/app/(site)/page.tsx:289` — "Message 07935 772485" button
- `src/app/(site)/contact/page.tsx:57`
- `src/app/(site)/booking-received/[reference]/page.tsx:112`
- `src/components/site/site-footer.tsx:54`
- `src/app/api/bookings/route.ts:152` and `src/app/api/contact/route.ts:68`
  (customer emails)
- `src/lib/email.ts:119` (footer of every email)

Changing a number in Admin → Settings alone is therefore only half a fix: the
link updates, the visible number does not. This has already happened once: on
2026-09-27 both numbers moved to 07935 772485, and `constants.ts` had to be
edited by hand alongside a data migration.

**Fix:** derive the display string from `settings.whatsapp` with a small
`formatUkNumber()` helper, and pass `settings` into `emailShell()`.

### 9. Custom bookings with an unknown service id return a 500

`src/app/api/bookings/route.ts:45`

```ts
if (!data.isCustom && services.length !== data.items.length) { ...409... }
```

The guard is skipped when `isCustom` is true, but line 91 still runs
`services.find(s => s.id === item.serviceId)!` over `data.items` — a non-null
assertion on a value that can be `undefined`. A custom booking that also
carries a stale or invalid `serviceId` throws `TypeError: Cannot read
properties of undefined` and the customer loses the whole form.

**Fix:** drop the `!data.isCustom &&` condition — the length check should
apply whenever `items` is non-empty, regardless of `isCustom`.

### 10. ~~The before/after seam is misaligned until you drag it~~ — resolved 26 Sep 2026

Fixed with the clip-path approach below: both images now sit in identical
full-size layers and the top one is clipped, so no measuring is needed.
Checked visually — the seam lines up on first render and after dragging.


`src/components/site/before-after.tsx:52`

```tsx
<div className="relative h-full" style={{ width: containerRef.current?.offsetWidth ?? "100%" }}>
```

On first render `containerRef.current` is `null`, so the inner wrapper gets
`width: 100%` — 100% of the *clipped* parent, which is only `position`% of the
container. The "before" image is therefore squeezed into 52% of the width and
`object-cover` crops it differently from the "after" image behind it, so the
two halves don't line up. It only corrects itself once a drag forces a
re-render with a real `offsetWidth`.

This is the homepage's signature visual and the one place the design spends
real budget, so it's worth getting right.

**Fix:** measure with a `ResizeObserver` into state, or avoid the measurement
entirely — put both images in full-size absolutely positioned layers and clip
the top one with `clip-path: inset(0 calc(100% - var(--pos)) 0 0)`.

### 11. Both public POST routes are unauthenticated, unthrottled, and the
honeypot that was supposed to protect them is dead code **[verified]**

`company: z.string().max(0).optional()` rejects any non-empty value at the
schema level, so a bot that fills the honeypot gets a **422 with field errors**
— which tells it exactly which field to leave alone — and the
`if (data.company) return 200` branch in both routes is unreachable:

```
bot fills company="Acme":  safeParse.success === false   → 422, branch never reached
human leaves it blank:     data.company === ""           → falsy, branch never reached
```

`/api/reviews` (added 27 Sep 2026) does the honeypot properly — the field is
checked after parsing, so a bot gets a plain 200 — but it has no rate limiting
either. It is less exposed than the other two: it emails only the admin (and
only while `emailReviewToAdmin` is on), never the address typed into the form,
and everything it saves waits in the moderation queue. A flood would bury real
reviews in Admin → Reviews rather than reach the public site.

With no rate limiting, `/api/contact` and `/api/bookings` will each accept
unlimited submissions, and every one sends **two** emails once email is
configured — an open relay for anyone who wants to burn the client's sending
reputation, and since Zoho CPaaS bills per email, their credit too.

**Fix:** change the honeypot to `z.string().optional()` so the silent-200
branch actually runs, then add rate limiting. Cloudflare Turnstile is the
natural fit here and there is a `cloudflare:turnstile-spin` skill available
that wires it end-to-end.

---

## S3 — fix before the client sees it

### 12. ~~Two lockfiles, and the README documents the wrong package manager~~ — RESOLVED 2026-09-09

`package-lock.json` (136 KB) and `pnpm-lock.yaml` (108 KB) are both present
and both current. `node_modules/.pnpm` exists, so the working tree was
installed with **pnpm**, while `README.md` says `npm install`. Vercel and most
CI detect the package manager by lockfile and will pick one arbitrarily,
producing a different dependency tree from the one that was tested.

**Fix:** delete `package-lock.json`, keep `pnpm-lock.yaml`, and update the
README. (Or the reverse — but pick one.)

### 13. No `.gitignore` — RESOLVED 2026-09-09. The project is still not a git repo

`git rev-parse` reports this is not a work tree. `.next/`, `node_modules/` and
`tsconfig.tsbuildinfo` are sitting in the project root untracked and
un-ignored. The first `git init && git add .` will commit a build directory
and a dependency tree.

**Fix:** `git init`, and add a `.gitignore` covering `node_modules`, `.next`,
`.env*` (except `.env.example`), `*.tsbuildinfo`.

### 14. No committed migration

`prisma/migrations/` does not exist. `README.md` tells each developer to run
`prisma migrate dev --name init`, which means every environment generates its
own initial migration independently and they will drift.

**Fix:** generate the baseline migration once and commit it.

### 15. `public/robots.txt` silently overrides `src/app/robots.ts` **[verified]**

`curl /robots.txt` on a production build returns the static file — including
its own comment claiming it is "a static fallback only". The route handler is
dead. The `Disallow: /admin/` and `/dashboard/` trailing-slash variants and the
`host` directive defined in `robots.ts` never ship.

Impact is small (the two files are near-identical) but the file a developer
will edit is the one being ignored.

**Fix:** delete `public/robots.txt`.

### 16. Homepage area links use a different slug algorithm from everything else

`src/app/(site)/page.tsx:235` inlines
`area.toLowerCase().replace(/[^a-z0-9]+/g, "-")`, while
`areas/[slug]/page.tsx:23` resolves with `slugify()` from `lib/utils`, which
also strips apostrophes and trims leading/trailing hyphens.

For the seven seeded areas the two agree. For anything the client types into
Admin → Settings with an apostrophe — "Bishop's Stortford" → `bishop-s-stortford`
from the homepage, `bishops-stortford` from the resolver — the link 404s.

Two sources of truth compound this: the homepage links off free-text
`SiteSetting.serviceAreas`, while real pages live in the `AreaCovered` table.

**Fix:** use `slugify()` on the homepage, and ideally query `AreaCovered` for
the link list so the grid can only ever link to pages that exist.

### 17. `quotedTotal` accepts non-numeric input and stores `NaN` **[verified]**

`src/app/actions/admin.ts:146`

```ts
quotedTotal: rawQuote === "" ? null : new Prisma.Decimal(Number(rawQuote))
```

`new Prisma.Decimal(Number("abc"))` returns a Decimal of `NaN` rather than
throwing — Postgres `numeric` accepts `NaN`, so it persists. The booking then
shows a `NaN` quote and `formatMoney` returns `null`.

The form input is `type="number"`, but a server action accepts any FormData.

**Fix:** validate with Zod like every other input in the file. While there:
`status` on line 132 is a bare `as` cast with no validation, so a malformed
value reaches Prisma and throws an unhandled `PrismaClientValidationError`.

### 18. Customer-supplied text is interpolated into email HTML unescaped

`src/lib/email.ts:95` `emailShell()` takes `body` as a raw HTML string, and
callers interpolate directly:

- `api/bookings/route.ts:183-186` — `customBrief`, `notes`, `parkingNotes`, `allergyNotes`
- `api/contact/route.ts:53-55` — `name`, `subject`, `message`
- `actions/admin.ts:180` — `quoteNotes`

A customer who types `<img src=x onerror=...>` or just an unclosed tag into
the booking notes gets it rendered in the client's inbox. Most modern mail
clients strip scripts, so this is mail-client-dependent rather than a
guaranteed exploit — but the layout can certainly be broken, and it is
trivially avoidable.

**Fix:** an `escapeHtml()` helper applied at every interpolation of
user-supplied text. `.replace(/\n/g, "<br>")` should run *after* escaping.

### 19. `/booking-received/<reference>` is public and exposes customer details

No session check. The page renders contact first name, postcode, services and
preferred date to anyone with the URL. References are `SF-` plus six
characters from a 32-symbol alphabet — about 1.07 billion combinations, so not
casually guessable, but with no rate limiting (finding #11) it is enumerable
given time, and the URL will be sitting in browser history and email clients.

It is correctly `noIndex` and `Disallow`ed in robots.

**Fix:** acceptable as a capability URL if rate limiting lands; otherwise gate
on either an active session or a short-lived signed token in the query string.

### 20. The three social-link settings are write-only

`SiteSetting.facebookUrl`, `.instagramUrl` and `.tiktokUrl` are in the schema,
in `loadSettings()`, and in the Admin → Settings form — but grepping the whole
of `src/` finds no page that reads them. Only `googleReviewUrl` is rendered
(`page.tsx:212`). The client can save all three and see no change on the site.

**Fix:** render them in `site-footer.tsx`, hiding any that are unset.

### 21. `LocalBusiness` JSON-LD puts the opening hours in the `description` field

`src/lib/seo.ts:72-73`

```ts
openingHours: "Mo-Su",
description: settings.openingHours,   // "Monday to Sunday, by appointment"
```

Google will read the business description as "Monday to Sunday, by
appointment". `SiteSetting.tagline` is the field that belongs there.

---

## S4 — cleanup

22. ~~`--animate-marquee` and `@keyframes marquee` are defined and never
    used.~~ Resolved 4 Oct 2026: the home page area band uses them.
23. `src/app/(site)/booking-received/[reference]/page.tsx:17` sets a static
    canonical of `/booking-received` for every reference. Harmless while the
    page is noindexed, but wrong.
24. The booking wizard's review step (`booking-wizard.tsx:745`) prints the raw
    `YYYY-MM-DD` value while every other date on the site goes through
    `formatDate()`.
25. `const today = new Date().toISOString().slice(0, 10)` at
    `booking-wizard.tsx:51` is evaluated once at module scope and used as the
    date input's `min`. Server and client can disagree across midnight or a
    long-lived server process.
26. `booking-wizard.tsx:474` uses `CO4 3JT` as the postcode placeholder — that
    is the client's own registered-office postcode from AFT-F-01 A4. A
    district-level postcode is not the address and rule 1 is not breached, but
    a neutral example such as `CO1 1AA` costs nothing.
27. Admin list pages cap at 100 bookings / 200 customers / 60 messages with no
    pagination UI, so older records become unreachable rather than paged.

---

## Explicitly checked and correct

- **Registered office is not published anywhere.** Grepped the full source,
  seed, and `public/`. `localBusinessJsonLd` omits `streetAddress` deliberately.
- **No payment capture.** No checkout route, no card fields, no payment model,
  and the "no payment is taken through this website" line appears on the hero,
  the homepage process block, the booking wizard, the confirmation page and
  every email footer.
- **Runs with no email service and no WhatsApp API.** Verified by building and booting
  with neither configured; both paths write a `MessageLog` row with status
  `SKIPPED` and an explanatory `error` string.
- **Motion respects reduced-motion.** The one-animation rule was retired on
  4 Oct 2026 at the owner's request (see `CLAUDE.md`, Design rules). The hero,
  the area marquee, scroll reveals and the before/after hint all stop under
  `prefers-reduced-motion`, and scroll reveals leave the page fully visible
  with no JavaScript.
- **Design rules honoured** — white base, emerald and gold with depth,
  Cormorant Garamond + DM Sans, `.seam` motif used instead of horizontal
  rules, mobile-first breakpoints throughout.
- **`npm run typecheck` is clean** and `npm run build` produces 34 routes.
- Radix `Checkbox`/`Switch` form bubbling works; the admin booleans do save.
- `next.config.mjs` redirect targets both resolve to real seeded slugs.
- Security headers (`nosniff`, `Referrer-Policy`, `X-Frame-Options`,
  `Permissions-Policy`) are set for all paths.
- Passwords are bcrypt at cost 12; the session cookie is `httpOnly`,
  `sameSite=lax`, and `secure` in production.
