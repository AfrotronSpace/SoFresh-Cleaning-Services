# Business rules and their source

Every customer-facing promise on this site traces to an answer on one of two
Afrotron discovery forms, both completed and signed by Mabel Onyeanusi (Owner):

- **AFT-F-01** *Business Information* — 19 August 2026 (revised)
- **AFT-F-02** *How Your Business Works* — 26 August 2026

**If you are about to write a response time, a guarantee, a fee rule or a
coverage claim, find it in this table first. If it is not here, ask — do not
invent it.** The client's own note on AFT-F-01 H is the governing principle:
*publish only what there is documentary proof for.*

---

## Identity

| Fact | Value | Source |
|---|---|---|
| Trading name | So Fresh Cleaning Service | A1 |
| Legal name | So Fresh Cleaning Service Ltd | A1 |
| Company number | 16423190 | A2 |
| Trading since | 2025 | A3 |
| Registered office | 48 Acacia Avenue, Colchester CO4 3JT — **NEVER PUBLISH** | A4 / E4 |
| Positioning | Premium, detail-led, labour-intensive restoration deep cleans, end-of-tenancy and commercial across Essex and Suffolk. Explicitly *not* competing as a low-cost regular domestic cleaner. | A5, brand note |

E4 is unambiguous: *"Only service areas should be shown publicly. Please do not
publish the full registered/home address."* This is why
`localBusinessJsonLd()` omits `streetAddress`, and why the privacy policy
offers a postal address "on request" rather than printing one.

## Contact

| Fact | Value | Source | Note |
|---|---|---|---|
| Main phone | 07386 528399 | E1 (revised) | The original form said 07935 772485. **Unresolved** — see `SETUP-NOTES.md` §1 |
| WhatsApp | 07399 505686 / +44 7399 505686 | E2 (revised) | Stored as `447399505686` |
| Email | info@sofreshcleaning.co.uk | E3, G1 | No CC recipient at present (G1) |
| Preferred first contact | **WhatsApp**, then phone, then the form | E5 | This is why the WhatsApp button is the primary CTA everywhere and the mobile sticky bar exists |
| Domain | sofreshcleaning.co.uk (owned, registrar TBC) | I1 | |
| Hours | Monday–Sunday by appointment | F1 | Weekends and bank holidays accepted subject to availability (F2) |

## Services — the ten from C1, all seeded

Grouped exactly as requested in C3: **Signature Restoration & One-Off** /
**Moving & Property Transition** / **Commercial & Regular**.

Top three for homepage prominence (C2): Restoration Deep Cleaning,
End-of-Tenancy Cleaning, Commercial / Office Cleaning.

| Service | Price | Source |
|---|---|---|
| So Fresh Restoration Deep Clean | from £350, negotiable | S8 |
| Selective Regular Domestic Cleaning | £25/hour, **Colchester only**, minimum booking, limited availability | S9, F4 |
| All others | quote only | B1 |

S8 is the governing pricing rule: *"Fixed quotation after photos, video or
site assessment… Final price reflects property size, condition, scope,
location, team size and labour required."* Pricing is on **condition, not
bedroom count** — this is repeated in the brand note and is a core
differentiator, so it belongs in copy.

Restoration scale (S7): half a day to a full day; large jobs 3–5 cleaners for
7–10+ hours.

## Areas

Colchester, Ipswich, Dedham, Clacton-on-Sea, Braintree, Brentwood,
Frinton-on-Sea and surrounding (D1). Based in Colchester. *"Travel, minimum
booking requirements or a higher quote may apply depending on distance and job
size."*

Priority growth areas differ between the two form versions — D2 gives
Colchester, Ipswich, Clacton-on-Sea, Braintree; the original gives Colchester,
Dedham, Frinton-on-Sea, Brentwood, Braintree, Ipswich. The seed marks all
except Brentwood as `priority: true`, which covers both.

## Promises — all admin-editable in `SiteSetting`

| Promise | Wording | Setting | Source |
|---|---|---|---|
| Reply speed | "We reply the same day, usually much sooner during working hours." | `responsePromise` | A2 |
| Quote speed | "within 24 hours of us having everything we need" | `quoteWindow` | B2 |
| Booking fee | Varies with job value/nature, deducted from the balance, confirmed before booking | `bookingFeeNote` | B3 |
| Cancellation | at least **72 hours**; fees non-refundable inside that | `cancellationHours` | D1 |
| Report a problem | within **15 hours** of completion, ideally with photos | `reclaimWindowHours` | F2 |
| Notice to book | 48–72 hours preferred; same-day possible with a call-out fee | — (copy) | S11, F3 |

> **The 15-hour figure is unusual** and used exactly as written. 24 or 48 is
> the norm, and a clean finishing at 6pm gives the customer until 9am. It is
> also harder to defend in a dispute. `SETUP-NOTES.md` §2 flags this for the
> client to confirm. Because it is a `SiteSetting`, changing it must not
> require a deploy — **which finding #7 currently breaks**, since
> `src/lib/content.ts` hardcodes both 15 and 72.

## Payment — the hard rule

C1–C3 and the form's own preamble: bank transfer or a secure payment link;
business customers may be invoiced on up to 30 days. Booking fee in advance for
one-off residential, balance on completion.

**No payment is taken through the website. There is no card checkout, no
payment page, and no card or token model in the schema.** The form states this
as a given, not a preference. Every page that discusses money says so
explicitly, and so does the footer of every email.

## Data protection

- Form collects (I4): name, phone, email, postcode, service, property type,
  bedrooms, bathrooms, preferred date, occupied/empty, brief description —
  **plus an optional photo/video upload, which is not yet built** (see
  `docs/STATUS.md` item 6).
- Also kept (J1): property/service details, preferred date, uploaded media.
- Shared with (J2), and therefore named in the privacy policy: the
  subcontracted cleaner(s) assigned to the job, and professional providers
  such as the accountant and booking/payment providers.
- J3: no pre-existing policy — the three legal pages were written from these
  answers and still need a solicitor's read (`SETUP-NOTES.md` §4).

## Credentials — publish nothing beyond this

AFT-F-01 H: public liability insurance **yes**, but *"provider and level of
cover to be confirmed before publication"*. Everything else on the H list —
employer's liability, VAT, ICO, DBS, uniforms, accreditations — *"only publish
where documentary proof/permission is supplied."*

So the site says insurance is held and names neither provider nor amount. Do
not add a figure, a logo, or an accreditation badge without the client
supplying proof. Likewise G3: an office client exists but **logo permission is
not confirmed — do not display any client logo.**

## Reviews

G1: extensive genuine five-star Google reviews exist. Named examples: Nicola,
Donna, Sophie, Katie, Wendy, Julie, Rebecca, Bonnie, Rachel, Paul. Attribution
should be **first name + initial** unless full-name permission is confirmed.

The seed uses six of those names with bracketed placeholder body text, because
inventing review wording and attributing it to a named real person is not
shippable. They are seeded as `PENDING` and cannot be approved while the
placeholder text is still there (finding #4, resolved).

Customers can also leave reviews on the site. Those follow the same rules:
the name they type is stored as first name + initial, the town field rejects
house numbers and postcodes (rule 1), and nothing is public until the admin
approves it. The only promise the site makes about moderation is that every
review is read before it goes up — no turnaround time is stated, because the
forms don't give one.

## SEO vocabulary — the client's customers' words, not industry terms

K2, verbatim: deep clean · end of tenancy cleaning · end of tenancy cleaner ·
move-out clean · moving out clean · move-in clean · house deep clean ·
professional cleaner · cleaner near me · after-builders cleaning · one-off
deep clean · office cleaning · commercial cleaning · oven cleaning.

*"'Restoration Deep Clean' is our branded service name, but SEO should also use
common 'deep cleaning' terms."* These are already in the root layout's
`keywords` and should stay in body copy and service `seoTitle`s.

## Supplied copy to use verbatim

**Enquiry auto-reply (G3)** — used in `api/contact/route.ts` and the contact
form's success state:

> Thank you for contacting So Fresh Cleaning Service. We've received your
> enquiry and a member of our team will be in touch shortly. If you've
> requested a quote, we may ask for a few additional details, photos or a short
> video so we can provide an accurate, tailored price. We look forward to
> helping you bring that So Fresh feeling back to your space.

**Out-of-hours WhatsApp reply (H3)** — not yet used anywhere:

> Thank you for contacting So Fresh Cleaning Service. We've received your
> message outside our usual response hours. Please leave the service you
> require, your postcode and preferred date, and we'll get back to you as soon
> as possible.

**WhatsApp prompts (H2)**: one per service, e.g. *"Hi, I'd like a quote for a
So Fresh Restoration Deep Clean."* Stored per-service in
`Service.whatsappPrompt` and editable in Admin → Services.

## Project contacts

Mabel Onyeanusi (Owner / Operations) is the sole contact and has final
approval on all design, wording and content (L1, L2). No secondary contact.
L3: no fixed launch date — *"Quality and proper completion are more important
than an arbitrary rushed launch date."*
