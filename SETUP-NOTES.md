# Notes for Mabel — things that need a decision

## 1. Which phone number is right? — resolved 2026-09-27

**07935 772485** is the single number for both calls and WhatsApp. It replaces
07386 528399 (calls) and 07399 505686 (WhatsApp) from the revised form. The site
defaults, the seed and a database migration (`20260927210000_single_contact_number`)
all use it. If it ever changes again, update Admin → Settings **and** `SITE` in
`src/lib/constants.ts` — some pages still print the number from there
(`docs/FINDINGS.md` #8).

## 2. The 15-hour window

Form AFT-F-02 says concerns about an agreed area should be reported "within 15 hours of
completion". That's an unusual figure — 24 or 48 is more common — and it's used exactly as
written in the booking terms and on the website. If 48 was meant, change
`reclaimWindowHours` in Admin → Settings.

A short window is also harder to defend if a customer disputes it, since a clean finished at
6pm gives them until 9am the next morning.

## 3. Booking confirmation emails

The forms left both email questions undecided, so both are built as switches in
Admin → Settings rather than being fixed in code:

- Email the customer a confirmation — **on** by default
- Email you every new booking — **on** by default
- Forward new bookings to WhatsApp — **off** by default

## 4. Legal pages

The privacy policy, booking terms and website terms are substantive drafts written from the
answers on the forms, not generic templates. They correctly state that no payment details are
collected, name the categories of recipient (subcontracted cleaners, accountant), and give
the ICO complaint route. They should still be read by a solicitor before launch — particularly
the cancellation and booking-fee clauses, which have money attached.

## 5. Insurance and accreditations

The site says public liability insurance is held but does not state the provider or the level
of cover, because the form said those were to be confirmed. Nothing else on the H-section list
is published, since the form said only to publish what has documentary proof.

## 6. Extra service fields

The brief asked for type, amount and a negotiable toggle. These were added too — all of them
optional, and all editable in Admin → Services:

| Field | Why |
|---|---|
| `group` | Puts each service under the three headings the business asked for |
| `priceMode` | The difference between "from £350", "£25 per hour" and "quote only" |
| `minimumCharge` | For the regular-cleaning minimum booking rule |
| `includes` / `excludes` | The form said being clear here prevents disputes |
| `extras` | Optional add-ons customers can tick while booking |
| `durationEstimate`, `noticeHours` | Sets expectations before someone enquires |
| `requiresSurvey` | Switches the page from "get a price" to "book a free assessment" |
| `photosRecommended` | Prompts for the photos that drive the quote |
| `featured`, `sortOrder`, `active` | Control of the catalogue without a developer |
| `seoTitle`, `seoDescription` | Per-service control of the Google listing |
| `whatsappPrompt` | The pre-filled WhatsApp message, per service, as requested |

If any of these are more than you want to think about, ignore them — they all have sensible
defaults.
