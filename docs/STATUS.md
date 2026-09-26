# Status — what is built, what is left

As of 9 September 2026. Typecheck clean, production build succeeds (34 routes).
Nothing has been deployed; there is no git history and no database has been
migrated in this working tree.

---

## Built and working

### Public site — 16 routes
| Route | Notes |
|---|---|
| `/` | Hero carousel, trust strip, catalogue, restoration showcase with before/after seam, process, reviews, areas, FAQ, CTA |
| `/services` · `/services/[slug]` | Catalogue grouped into the client's three headings; detail pages carry includes/excludes, FAQs, JSON-LD, up to four "Recent jobs" from the gallery, and an inline booking wizard |
| `/gallery` | Completed jobs ("Our work"). Filter chips per service, 24 per page, a viewer dialog with before/after sliders and click-to-play video. `?job=<id>` deep-links straight into a job. The homepage showcase uses the newest *featured* before/after photo pair (restoration first), falling back to the placeholder oven |
| `/areas` · `/areas/[slug]` | Seven seeded areas; the detail page falls back to `SiteSetting.serviceAreas` for anything not in `AreaCovered` |
| `/book` | Six-step wizard, `?service=slug` preselects, prefills from the signed-in user |
| `/booking-received/[reference]` | Confirmation with reference, next steps, WhatsApp photo prompt |
| `/contact` | Form + WhatsApp/phone/email cards |
| `/help` | Help Centre from the AFT-F-02 answers, with `FAQPage` structured data |
| `/privacy-policy` · `/booking-terms` · `/terms` | Substantive drafts written from the forms, not templates |
| `/sign-in` · `/sign-up` | JWT session, 30-day httpOnly cookie |
| `/dashboard` | Customer's own bookings with status, quote and recent events |

### Admin dashboard — 8 sections
Overview (counts, pipeline value, config warnings), Bookings (list + detail
with status/quote editor, event trail, WhatsApp forward), Services (full CRUD
over every catalogue field, including a header-image and gallery uploader
that presigns straight to R2's public bucket — see `docs/DEPLOYMENT.md` —
plus per-service FAQs, keyword tags and an icon), Gallery (see below), Customers, Enquiries,
Messages (every email and WhatsApp attempt, including skipped ones), Settings.

**Gallery (added 26 Sep 2026).** A `GalleryJob` (title, description, date,
town, optional service link — all optional) holds ordered `GalleryMedia`
frames. Each frame is `SINGLE` (primary slot only) or `BEFORE_AFTER` (primary
= before, secondary = after); each slot is a photo or video stored as an R2
key in the public bucket. The editor takes a whole batch of files by drag and
drop, sorts them by name (WhatsApp names are chronological), and lets you
tick two to pair them, then swap/split/reorder. Videos get a poster frame
grabbed in the browser at upload. Jobs start as drafts; deleting a job, or
removing a file from one, deletes the object from R2 too. A database CHECK
constraint rejects a frame whose slots don't match its layout.

**Gallery inbox (`/admin/gallery/inbox`).** For big unsorted batches: upload
everything at once, and each file is recorded (`GalleryInboxItem`) the moment
its upload finishes, so an interrupted batch loses nothing. Select files
(click, shift-click for a range, filter by photos/videos, preview) and either
create a draft job from them or add them to an existing job. Moving a file
never re-uploads it, because the same R2 object changes owner. The job
editor's *Send back to inbox* button takes a file out of a job without
deleting it, which is also how files move between jobs. R2 deletes only
happen for keys that no job or inbox row still references. Verified end
to end against a local Postgres and a stand-in bucket; **not yet tried
against real R2**, which needs the public bucket from `docs/DEPLOYMENT.md`.

### Platform
- 15 Prisma models, no payment or card model anywhere by design
- Zod validation shared by API routes and server actions
- Email via nodemailer, degrading to a logged `SKIPPED` with no SMTP
- WhatsApp in two modes: zero-setup `wa.me` deep links, or Meta Cloud API
- `sitemap.xml`, `robots.txt`, PWA manifest, generated OG image, JSON-LD
  (`HomeAndConstructionBusiness`, `Service`, `FAQPage`, `BreadcrumbList`)
- Security headers, bcrypt cost 12, soft-deleted services, frozen booking
  snapshots, settings cache with a database-down fallback

---

## Left to build

### Blocking launch
1. **Fix the four S1 defects** in `docs/FINDINGS.md` — broken seed, 404 OG
   images, the literal `&rsquo;` on six service pages, placeholder reviews
   presented as genuine.
2. **Real photography.** Everything in `public/images/` is a generated
   placeholder with the word PLACEHOLDER printed on it. The client has sent
   200+ photos and videos (via WhatsApp, unsorted) and confirmed customer
   consent to publish them. The `/gallery` pipeline to take them is built;
   what's left is creating the public R2 bucket, then uploading the whole
   batch to Admin → Gallery → Inbox and grouping it into jobs. Still worth a human pass over every photo for
   faces, house numbers, post, or a business client's logo (G3). Service hero
   images and the hero carousel are still placeholders.
3. **Real review text.** Six Google reviews, attributed as first name +
   initial per AFT-F-01 G1.
4. **Legal sign-off.** `SETUP-NOTES.md` §4 — the cancellation and booking-fee
   clauses have money attached and should be read by a solicitor.
5. **Decide the two open questions** in `SETUP-NOTES.md`: which phone number is
   the main line (the two forms disagree), and whether the 15-hour problem
   window in AFT-F-02 F2 was meant to be 48.

### Requested in the discovery forms but not built
6. **Photo / video upload on the booking form.** AFT-F-02 I4 asks for it
   explicitly — *"Please include an optional photo/video upload — strongly
   encouraged for accurate tailored quotes"* — and J1 confirms uploads are
   expected to be stored. Still the largest genuine feature gap against the
   brief, but it is now half-done:

   - **Done (9 Sep 2026):** `src/lib/r2.ts` — a tested Cloudflare R2 storage
     layer with presigned upload/download, type and size validation, and the
     same degrade-gracefully behaviour as email and WhatsApp. Bucket setup and
     CORS are documented in `docs/DEPLOYMENT.md`.
   - **Remaining:** an upload step in the booking wizard, a presign API route,
     writing `Attachment` rows, rendering them in the admin booking detail
     (`admin/bookings/[id]/page.tsx` already fetches `attachments: true` but
     never renders it), and a privacy-policy paragraph.

   Uploads must go browser → R2 directly — not a Vercel-specific constraint
   anymore, but still the right design: proxying customer video through the
   app's own container costs bandwidth and time for no benefit.
7. **Google Analytics and Search Console.** AFT-F-02 I3 — *"not currently set
   up; please include/setup these for the new website if part of the project
   scope."* `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` is already wired into the
   root layout; nothing else exists.
8. **Social links go nowhere.** `SiteSetting` has `facebookUrl`,
   `instagramUrl` and `tiktokUrl`, and Admin → Settings edits all three — but
   **no page on the public site reads them**. The client can fill them in and
   nothing appears. The footer is the obvious home. AFT-F-02 I3 says the page
   details will be supplied separately.
9. **Google review link.** `SiteSetting.googleReviewUrl` is empty; the reviews
   section hides its "read every review" link until it is set.
10. **Out-of-hours WhatsApp auto-reply.** AFT-F-02 H3 supplies the exact
    wording. This is a WhatsApp Business app setting rather than site code —
    worth confirming with the client rather than building.
11. **Competitor benchmarking.** AFT-F-02 K1 asks for research into Colchester,
    Ipswich, Clacton-on-Sea and Braintree cleaners ranking for deep-clean and
    end-of-tenancy terms. Not started.

### Engineering work worth doing
12. **Admin pagination.** Lists cap at 100/200/60 rows with no way to page
    back. Fine at launch, a problem within a year.
13. **Rate limiting on the two public POST routes** — see finding #11. The
    `cloudflare:turnstile-spin` skill wires Turnstile end-to-end.
14. **Email verification** — required before finding #5 (booking exposure via
    email match) can be considered closed.
15. **Static rendering.** Every public page is dynamically rendered, because
    `(site)/layout.tsx` calls `getSession()` and most pages set
    `dynamic = "force-dynamic"`. A marketing site that changes a few times a
    month is paying an SSR round trip plus 2–3 database queries on every view.
    Moving the session read into a small client island, or into middleware,
    would let the catalogue and area pages use ISR. Not urgent at current
    traffic; the single biggest available performance win when it matters.
16. **A test suite.** There is none. The booking POST route and the wizard's
    validation are the two places worth covering first.
17. **Baseline migration and `git init`** — findings #13, #14. `.gitignore` and
    the lockfile conflict were resolved on 9 Sep 2026; the repo still needs
    initialising before Railway can deploy from it (the repo is now connected —
    see `docs/DEPLOYMENT.md`).

---

## Suggested order for the next session

1. Findings #1–#4 (S1). Roughly an hour, and #1 unblocks everything else
   because nothing can be tested against a real database until the seed runs.
2. Findings #5, #6, #9, #11 (the security and data-integrity set).
3. Findings #7 and #8 — the two places where admin-editable settings are
   contradicted by hardcoded copy. These are business-rule violations, not
   bugs, and they will embarrass the client rather than crash anything.
4. Photo upload (item 6) — the one real feature still owed against the brief.
5. Everything else.
