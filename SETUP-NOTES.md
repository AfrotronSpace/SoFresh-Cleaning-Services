# Notes for Mabel — things that need a decision

## 1. Which phone number is right? — resolved 2026-09-27

**07935 772485** is the single number for both calls and WhatsApp. It replaces
07386 528399 (calls) and 07399 505686 (WhatsApp) from the revised form. The site
defaults, the seed and a database migration (`20260927210000_single_contact_number`)
all use it. If it ever changes again, update Admin → Settings **and** `SITE` in
`src/lib/constants.ts` — some pages still print the number from there
(`docs/FINDINGS.md` #8).

## 2. The problem-report window — resolved 2026-10-10

Form AFT-F-02 said "within 15 hours of completion". The client has changed it to **48 hours**.
It is `reclaimWindowHours` in Admin → Settings; the booking terms and the Help Centre both read
it, so changing it again needs no deploy. Migration `20261010120000_price_policy_and_48h_window`
moves an existing database from 15 to 48.

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
| `priceMode` | The difference between "from £…", "£… per hour" and "quote only". Only Commercial & Office Cleaning has a price (£25 per hour); Mabel sets any other herself |
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
