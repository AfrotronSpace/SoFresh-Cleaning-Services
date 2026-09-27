# Deployment — Railway + Cloudflare R2 + Zoho CPaaS

Reconfigured 9 September 2026 (moved from an earlier Vercel setup). Every claim
below was verified by actually building and running the Docker image against a
real Postgres — not written from memory — because a Dockerfile that "should
work" and one that does are different things. Where a line exists to work
around a specific failure, the failure is described so nobody removes it later
without knowing why.

---

## What is configured in the repo

| File | What it does |
|---|---|
| `Dockerfile` | Three-stage build: install, build, run. See **The Docker image** below — two real bugs were found and fixed while testing this. |
| `.dockerignore` | Keeps `node_modules`, `.git`, `.next` and docs out of the build context. |
| `railway.json` | Tells Railway to build via the Dockerfile, run `prisma migrate deploy` before each deploy takes traffic, and health-check `/api/health`. |
| `src/app/api/health/route.ts` | Railway's health check target. Deliberately does not touch the database — see the file. |
| `next.config.mjs` | `output: "standalone"` — produces a self-contained `server.js` rather than relying on the `next` CLI at runtime. |
| `prisma/schema.prisma` | `binaryTargets = ["native", "debian-openssl-3.0.x"]`, plus the `directUrl` split (still useful, see **Database** below). |
| `prisma/migrations/` | The baseline migration — didn't exist before this session (`docs/FINDINGS.md` #14). Generated and applied against a real Postgres, not hand-written. |
| `package.json` | `prisma` (the CLI, not just `@prisma/client`) moved from `devDependencies` to `dependencies` — it has to survive into the production image now that `prisma migrate deploy` runs there. |
| `.env.example` | Rewritten for Railway's variable-reference syntax and its single-container connection model. |

`vercel.json` has been removed. Nothing else Vercel-specific was left in the
app code — the earlier session never used any Vercel-only feature (Blob, KV,
Cron, Edge Config), so this migration touched only hosting configuration.

---

## The Docker image

Three stages — `deps`, `builder`, `runner` — on `node:20-bookworm-slim`
throughout (Debian, not Alpine: see **why Debian** below).

### Two things that were wrong until they were tested

**1. OpenSSL is not in the `slim` base image at all.** Running the built
container against a real database produced this on every start:

```
prisma:warn Prisma failed to detect the libssl/openssl version to use...
Defaulting to "openssl-1.1.x".
```

It kept working anyway, by accident — a stale `openssl-1.1.x` engine binary
from an earlier local `prisma generate` was still sitting in the pnpm store
alongside the correct `debian-openssl-3.0.x` one. On a clean environment
(exactly what Railway's build gives you) there is no such accident to fall
back on, and this would have failed outright. Fixed with one line in the base
stage:

```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
```

Verified: rebuilt from scratch, the warning is gone, and a raw query
(`prisma.$queryRaw\`SELECT 1\``) executes against a live Postgres inside the
running container.

**2. `output: "standalone"`'s file-tracing correctly finds the Prisma
*client*, but never includes the Prisma *CLI`.** This project needs the CLI at
runtime because Railway runs `prisma migrate deploy` against the same built
image. Next's tracer is right to leave it out — nothing in the request path
imports it — but the deploy design needs it anyway. The first fix attempt
(explicitly copying `node_modules/.prisma` and `node_modules/@prisma/client`
from the builder stage, the standard advice for npm/yarn projects) failed
outright:

```
ERROR: failed to calculate checksum... "/app/node_modules/.prisma": not found
```

This is a pnpm project. Real package contents live inside
`node_modules/.pnpm/<name>@<version>_<hash>/...`, with plain symlinks at the
top level — there is no top-level `node_modules/.prisma` to copy. Cherry-picking
the hashed pnpm-store paths instead would work but is fragile: the hash changes
on every dependency bump. The fix that shipped copies the builder stage's
**entire** `node_modules` in one shot instead, which keeps every relative
symlink intact with no path-guessing:

```dockerfile
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
```

This makes the image bigger than a "pure" standalone build. At this project's
scale — a small business marketing site, not a monorepo — that costs nothing
that matters. Don't "optimize" it back to a partial copy without re-solving
the CLI problem above.

### Why Debian, not Alpine

Alpine's musl libc is a well-documented source of Prisma engine mismatches
(wrong binary target, segfaults, "engine not found" errors that are hard to
diagnose from the symptom alone). `bookworm-slim` avoids that whole class of
problem for the cost of a slightly larger base image. Not worth revisiting.

### Build-time ARGs

The builder stage sets dummy values for `DATABASE_URL`, `DIRECT_URL`,
`AUTH_SECRET` and `NEXT_PUBLIC_SITE_URL` before running `pnpm build`. This is
safe and necessary: `prisma generate` needs the variables to be *present* but
never validates the connection, and every public page in this app is
`force-dynamic` so nothing queries the database during the build. The real
values are supplied by Railway as runtime environment variables and take over
completely once the container starts — the build-time values never reach
production. (Docker will warn `SecretsUsedInArgOrEnv` about `AUTH_SECRET` here;
that warning is about leaking real secrets into image layers, which doesn't
apply to a placeholder string that's never the real value.)

---

## Database

The app runs as **one persistent container**, unlike Vercel's per-request
functions — so the aggressive connection pooling that setup required is no
longer a hard requirement. Prisma keeps its own small connection pool inside
that single process regardless of which Postgres you point it at.

The schema still declares two URLs:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

**Using Railway's own Postgres plugin** (the simple default — one platform,
one bill): add the plugin, then set both variables to the same reference:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
DIRECT_URL=${{Postgres.DATABASE_URL}}
```

**Using an external provider** (Neon, Supabase) instead: use the pooled
endpoint for `DATABASE_URL` and the direct endpoint for `DIRECT_URL` —
migrations still can't run through a transaction-mode pooler regardless of how
many container replicas you're running.

If you ever scale this service to multiple replicas, the original
many-connections concern comes back proportionally — an external pooled
Postgres becomes worth it again at that point, not before.

---

## Railway setup

### 1. Create the project

New Project → **Deploy from GitHub repo** → this repository. Railway detects
the `Dockerfile` automatically (log line: *"Using detected Dockerfile!"*) and
reads `railway.json` for the rest.

### 2. Add Postgres

**+ New → Database → PostgreSQL** in the same project. Railway wires up its
own `DATABASE_URL` variable on the Postgres service — reference it from the
web service as shown above rather than copy-pasting the value, so it never
goes stale if the database is ever migrated or restarted.

### 3. Environment variables

Web service → Variables.

**Required:**

| Variable | Value |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (or an external pooled URL) |
| `DIRECT_URL` | same reference (or an external direct URL) |
| `AUTH_SECRET` | `openssl rand -base64 32` — a real one, not the build placeholder |
| `NEXT_PUBLIC_SITE_URL` | `https://sofreshcleaning.co.uk` once the domain is attached; Railway's own `*.up.railway.app` domain until then |

**Optional — each degrades cleanly if absent, exactly as in local dev:**

`ZOHO_CPAAS_TOKEN` · `ZOHO_CPAAS_API_URL` · `EMAIL_FROM`
`WHATSAPP_PHONE_NUMBER_ID` · `WHATSAPP_ACCESS_TOKEN`
`R2_ACCOUNT_ID` · `R2_ACCESS_KEY_ID` · `R2_SECRET_ACCESS_KEY` · `R2_BUCKET`
`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` · `NEXT_PUBLIC_R2_PUBLIC_HOST`

**Do not set** `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` here. Seeding is a
one-off you run yourself against the production database (see below); a
standing admin password sitting in the deploy environment is a liability with
no upside.

> `NEXT_PUBLIC_*` variables are baked into the JavaScript bundle at build time.
> Changing one means redeploying, not just restarting.

### 4. First deploy

Push to the branch Railway is watching. It will:

1. Build the Docker image
2. Run `preDeployCommand` (`npx prisma migrate deploy`) against the database,
   applying the committed baseline migration
3. Start the container, wait for `/api/health` to return 200, then route
   traffic to it

Then seed the catalogue, areas, settings and the admin account — **from your
own machine**, against the production `DATABASE_URL`:

```bash
DATABASE_URL="..." DIRECT_URL="..." \
SEED_ADMIN_EMAIL="info@sofreshcleaning.co.uk" SEED_ADMIN_PASSWORD="..." \
npm run db:seed
```

> ⚠ **This currently fails** — `prisma/seed.ts` imports `src/lib/auth.ts`,
> which does `import "server-only"`, a package that's aliased by Next.js but
> not actually installed. Nothing about this Railway reconfiguration touches
> that bug; it's `docs/FINDINGS.md` #1 and needs fixing before the catalogue
> can be populated. Ask if you want it fixed now.

### 5. Domain

Web service → Settings → Networking → **Custom Domain**. Add
`sofreshcleaning.co.uk` and create the CNAME Railway shows you. If the domain
also sits in Cloudflare for R2's sake, set that record to **DNS-only (grey
cloud)** — proxying Cloudflare in front of Railway's own edge is two CDNs
fighting over the same traffic and is a reliable source of stale pages and
redirect loops.

### A heads-up on `railway.json` itself

Railway's Config as Code (`railway.json` / `railway.toml`) is deprecated in
favour of a CLI-driven **Infrastructure as Code** format
(`.railway/railway.ts`, applied via `railway config plan` / `apply`).
Confirmed directly against Railway's current docs: existing Config as Code
files keep working for services already using them until a hard cutoff of
**2026-12-01**, after which they stop being read. That's about three months
from when this was written. Nothing needs to change today, but plan a
migration to Infrastructure as Code before that date — Railway's own
migration guide is linked from their Infrastructure as Code docs.

---

## Cloudflare R2

Unchanged by the move from Vercel — R2 is a plain S3-compatible HTTPS API with
no host affinity, and `src/lib/r2.ts` doesn't know or care what's running it.

**A Vercel function would have rejected any upload body over 4.5 MB, which is
why photos and walkthrough videos go browser → R2 directly rather than through
the server.** Railway's persistent container has no such limit (its own cap is
a 5-minute request *timeout*, not a body-size ceiling) — but the direct-upload
design is still the right call here, not just a legacy of the old host:
proxying a customer's video through your own container burns its bandwidth and
compute for no benefit. Keep the architecture as built.

### Bucket setup

1. **Create a private bucket** (e.g. `sofresh-uploads`). Do not enable the
   public development URL and do not attach a public custom domain — these are
   photographs of the inside of customers' homes, and the privacy policy
   commits to sharing them only with the assigned cleaner and named
   professional providers (AFT-F-02 J2). They're read back through short-lived
   presigned GET URLs instead.

2. **Create a scoped API token**: R2 → Manage API tokens → **Object Read &
   Write**, scoped to this one bucket. `R2_ACCESS_KEY_ID` /
   `R2_SECRET_ACCESS_KEY` come from here; `R2_ACCOUNT_ID` is your Cloudflare
   account ID.

3. **Add a CORS policy** — without it the browser blocks every presigned
   upload even though the URL itself is valid:

```json
[
  {
    "AllowedOrigins": [
      "https://sofreshcleaning.co.uk",
      "https://www.sofreshcleaning.co.uk"
    ],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

   Add Railway's own `*.up.railway.app` domain too if you want uploads to work
   before a custom domain is attached.

4. **Set a lifecycle rule** if you want abandoned uploads cleaned up. Objects
   are written before the booking row is confirmed, so a customer who closes
   the tab mid-upload leaves an orphan.

### A second, PUBLIC bucket for service photos and the gallery

Admin → Services → photos (hero image + gallery) and Admin → Gallery (the
completed-jobs page at `/gallery`, photos **and video**) use a separate
bucket from the private one above — these are marketing images, not customers' homes, and
are meant to be rendered directly in `<img>`/`next/image` tags at full speed
rather than through an expiring presigned URL.

1. **Create a second bucket** (e.g. `sofresh-public`) and this time **do**
   enable its Public Development URL, or attach a custom domain such as
   `media.sofreshcleaning.co.uk`. Never do this to the `sofresh-uploads`
   bucket.
2. **Widen the existing API token's scope** to cover this bucket too (or
   issue a second Object Read & Write token) — `R2_ACCOUNT_ID` /
   `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` are shared with the private
   bucket.
3. **Add a CORS policy** to this bucket as well (step 3 above, same shape).
4. Set `R2_PUBLIC_BUCKET` to the bucket name and `NEXT_PUBLIC_R2_PUBLIC_HOST`
   to whichever host serves it — the public URL is built as
   `https://${NEXT_PUBLIC_R2_PUBLIC_HOST}/<key>`. With either unset,
   `isR2PublicConfigured()` is false and the admin form falls back to typing
   in an image URL by hand instead of uploading — same degrade-gracefully
   pattern as everything else, so nothing breaks with this unconfigured.

### What `src/lib/r2.ts` gives you

```ts
isR2Configured()                              // false with any credential missing
presignUpload({ reference, filename, contentType, size })
presignDownload(key, expiresIn?)              // short-lived admin read URL
deleteObject(key)                             // never throws
MAX_UPLOAD_BYTES                              // 100 MB
ALLOWED_MIME_TYPES                            // jpeg/png/webp/heic/heif, mp4/mov/webm

isR2PublicConfigured()                        // the public bucket above
presignPublicImageUpload({ folder, filename, contentType, size })  // services/<slug>/…
presignPublicGalleryUpload({ filename, contentType, size })       // gallery/YYYY/MM/…
publicObjectUrl(key)                          // https://<public host>/<key>, or null
deletePublicObject(key)                       // never throws
MAX_IMAGE_UPLOAD_BYTES                        // 15 MB
ALLOWED_IMAGE_MIME_TYPES                      // jpeg/png/webp
// gallery limits live in src/lib/gallery.ts: photos 15 MB, video 100 MB (mp4/webm/mov)
```

Two AWS SDK options in that file are load-bearing, found by inspecting real
presigned output rather than trusting the defaults — do not remove them
(the file itself explains why): `requestChecksumCalculation: "WHEN_REQUIRED"`
and `signableHeaders: new Set(["content-type", "content-length"])`.

### Still to build

The PRIVATE bucket (customer booking photos/video) is configured and tested,
but nothing calls it yet. Wiring the feature up means: an upload step in the
booking wizard, a presign API route, writing `Attachment` rows, rendering
them in the admin booking detail (which already fetches `attachments: true`
but never renders it), and a short privacy-policy paragraph. Tracked as item
6 in `docs/STATUS.md`.

The gallery stores object **keys**, not URLs, so moving the bucket to a
custom domain later only means changing `NEXT_PUBLIC_R2_PUBLIC_HOST` (and
rebuilding — `next.config.mjs` reads it for `images.remotePatterns`). Videos
are served straight from R2 to visitors, which is fine because R2 has no
egress fees; `<video preload="none">` means nothing downloads until someone
presses play. Uploaded-but-never-saved files (someone closes the editor
mid-batch) are left behind — the editor warns before leaving, but a lifecycle
rule isn't possible here because live objects share the same prefix.

The PUBLIC bucket (service catalogue photos, above) is wired end to end —
`/api/admin/uploads` presigns, Admin → Services uploads hero + gallery images
straight to it, and the service detail page renders the result. It still
needs the bucket itself creating and its Public Development URL turning on
before it does anything in production; until then `isR2PublicConfigured()`
is false and the admin form falls back to a plain URL field.

---

## Email — Zoho CPaaS

Notification email goes out through **Zoho CPaaS** (formerly ZeptoMail) over
its HTTPS API, called with plain `fetch` from `src/lib/email.ts`. There is no
SMTP anywhere, and that is deliberate: **Railway blocks outbound SMTP on the
Free, Trial and Hobby plans** (it only opens on Pro), so an SMTP client such
as nodemailer would work on a laptop and then time out on every send in
production. Do not bring nodemailer back unless the project moves to Railway
Pro.

**Cost.** The first credit is free: 10,000 emails, valid for 6 months. After
that, credits are bought in blocks of 10,000 emails, each also valid for 6
months, with no subscription. Every recipient counts, so a CC'd admin email
is two. At this site's volume (2 emails per booking, 2 per contact form, 1
per review) one block should last the full 6 months.

### Setup

1. Sign up at zoho.com/cpaas. New accounts go through a short review before
   they can send freely, so start this well before launch.
2. **Add and verify the sending domain** (`sofreshcleaning.co.uk`). Zoho
   shows a DKIM `TXT` record and a bounce-address `CNAME`; add both at
   whoever hosts the domain's DNS and wait for Zoho to mark them verified.
   Nothing sends until they are. This is separate from any Zoho Mail inbox
   records the domain already has, so leave those alone.
3. Create a **Mail Agent** for the site and copy its **Send Mail token**
   into `ZOHO_CPAAS_TOKEN`. The console copies it with a `Zoho-enczapikey `
   prefix, and the code accepts it with or without.
4. **Set `ZOHO_CPAAS_API_URL="https://cpaas.zoho.eu/v1.1/email"`.** The
   client's account is on Zoho's **EU** data centre (confirmed 27 Sep 2026:
   the token is accepted only by `cpaas.zoho.eu`). Left unset, the code
   defaults to the US host, which rejects the token with
   `401 TM_4001 Invalid API Token found`, so every email logs as `FAILED`.
   The URL is also shown on the Mail Agent's Setup Info → API tab.
5. Set `EMAIL_FROM` to an address on the verified domain, e.g.
   `So Fresh Cleaning Service <info@sofreshcleaning.co.uk>`. Replies go to
   `SITE.email` (or the customer, on admin notifications), not to this address.

### How failures show up

Every attempt writes a `MessageLog` row before the API call, so Admin →
Messages always shows what happened:

| Status | Meaning |
|---|---|
| `SENT` | Zoho accepted the message |
| `SKIPPED` | `ZOHO_CPAAS_TOKEN` is unset |
| `FAILED` | Zoho refused it, with the HTTP status and Zoho's error code in the `error` column (e.g. `HTTP 401 TM_3201: … Invalid API Token found`), or the API didn't answer within 15 seconds |

A failure never blocks a booking, contact message or review from saving.
"Accepted" means Zoho queued it. Bounces and spam-folder delivery only show
up in the Zoho console's reports, not in `MessageLog`.

---

## Post-deploy checklist

- [ ] Deployment log shows `preDeployCommand` applying the migration, then the
      container passing its health check
- [ ] `/api/health` returns `{"ok":true}`
- [ ] `/` renders and the hero carousel runs
- [ ] `/sitemap.xml` lists all services and areas — proves the database
      connection works from inside the container
- [ ] Create the first production admin — `railway ssh` into the deployed
      container, then `npm run create-admin -- you@example.com 'a-strong-password' "Your Name"`
      — then sign in at `/admin`. (Or run the seed instead, if you want the
      full demo catalogue too — it also creates an admin when
      `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` are set.)
- [ ] Submit a real booking; confirm it appears in Admin → Bookings
- [ ] Admin → Messages shows the notification attempts as `SENT` (or
      `SKIPPED` if email isn't set up yet), and the customer email actually
      arrives in the inbox, not spam
- [ ] `curl -I https://sofreshcleaning.co.uk` shows the four security headers
- [ ] Paste a **service** page link into WhatsApp and check the preview card —
      currently broken regardless of host, `docs/FINDINGS.md` #2

## Known issues that affect deployment

| Issue | Impact |
|---|---|
| `docs/FINDINGS.md` #1 — seed is broken | You cannot populate the production database until this is fixed. Blocks launch. |
| `docs/FINDINGS.md` #2 — OG image 404s | Every shared service link has no preview image. WhatsApp is the client's primary channel. |
| Config as Code deprecation, 2026-12-01 | `railway.json` stops being read after that date — migrate to Infrastructure as Code before then. |
| Every route is `ƒ` (dynamic) | No page is cached. Fine at launch volume; the largest available performance win later (`docs/STATUS.md` item 15). |
