/**
 * Seed data for So Fresh Cleaning Service.
 *
 * Everything here comes from the two Afrotron discovery forms (AFT-F-01 and
 * AFT-F-02). It is idempotent — run it as often as you like.
 *
 *   npm run db:seed
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

const AREAS = [
  { slug: "colchester", name: "Colchester", county: "Essex", priority: true, sortOrder: 10,
    blurb: "Our home patch. Colchester is the one area where we also take on selective regular domestic cleaning alongside the deep-clean work." },
  { slug: "ipswich", name: "Ipswich", county: "Suffolk", priority: true, sortOrder: 20,
    blurb: "We work across Ipswich regularly, mostly on end-of-tenancy and after-builders jobs where the property has to be handed over spotless." },
  { slug: "clacton-on-sea", name: "Clacton-on-Sea", county: "Essex", priority: true, sortOrder: 30,
    blurb: "Coastal properties, holiday lets and changeovers between tenants — all within our normal working area." },
  { slug: "braintree", name: "Braintree", county: "Essex", priority: true, sortOrder: 40,
    blurb: "Restoration deep cleans and move-out cleans across Braintree and the villages around it." },
  { slug: "dedham", name: "Dedham", county: "Essex", priority: true, sortOrder: 50,
    blurb: "Period and character properties in Dedham need patience and the right products. That is the kind of work we prefer." },
  { slug: "frinton-on-sea", name: "Frinton-on-Sea", county: "Essex", priority: true, sortOrder: 60,
    blurb: "Second homes, lettings and pre-sale cleans along the Frinton and Walton stretch." },
  { slug: "brentwood", name: "Brentwood", county: "Essex", priority: false, sortOrder: 70,
    blurb: "We cover Brentwood for larger jobs. Travel or a minimum booking may apply depending on the size of the work." },
];

type ServiceSeed = Omit<Prisma.ServiceCreateInput, "extras" | "faqs"> & {
  extras?: { name: string }[];
  faqs?: { q: string; a: string }[];
};

const SERVICES: ServiceSeed[] = [
  {
    slug: "restoration-deep-clean",
    name: "So Fresh Restoration Deep Clean",
    group: "SIGNATURE",
    propertyKind: "HOUSE",
    featured: true,
    sortOrder: 10,
    summary:
      "A labour-intensive, team-based clean for properties that need considerably more attention than a conventional deep clean.",
    body: `Our signature restoration service is for people who want the property cleaned properly, not simply made to look clean from a distance.

We allocate the team and the time according to the condition of the property rather than to a fixed hourly slot. We work methodically through the agreed areas, go back over stubborn details where they need it, and finish with a quality check before we hand the property back to you.

Depending on the property, this can include intensive kitchen and bathroom cleaning; degreasing and descaling; doors, frames, handles and banisters; skirting boards; switches, sockets and high-touch points; internal windows, frames and sills; cupboard and drawer exteriors; detailed appliance cleaning where included; extractor hoods and filters; removal of cobwebs and built-up dust; vacuuming and floor cleaning; targeted steam cleaning and sanitising where suitable; and careful attention to the corners, edges and fittings most people never get to.

The exact scope is agreed after we have seen photos, a short video or the property itself, so the team can concentrate on what your property genuinely needs. Larger or heavily soiled jobs may need three to five cleaners for seven to ten hours or more.`,
    priceMode: "FROM",
    price: "350",
    negotiable: true,
    minimumCharge: "Restoration deep cleans start at £350",
    durationEstimate: "Half a day to a full day, sometimes longer",
    noticeHours: 48,
    requiresSurvey: false,
    photosRecommended: true,
    whatsappPrompt: "Hi, I'd like a quote for a So Fresh Restoration Deep Clean.",
    heroImage: "/images/service-restoration.jpg",
    includes: [
      "Deep cleaning of every agreed room and surface",
      "Intensive kitchen and bathroom cleaning, degreasing and descaling",
      "Doors, frames, handles and banisters",
      "Skirting boards, switches, sockets and high-touch points",
      "Internal windows, frames and sills where included",
      "Extractor hoods and filters",
      "Cobweb removal and built-up dust",
      "Vacuuming and floor cleaning throughout",
      "Targeted steam cleaning and sanitising where suitable",
      "A final quality check before handover",
    ],
    excludes: [
      "Carpet and upholstery cleaning",
      "External windows",
      "Inside the fridge, freezer or oven",
      "Inside cupboards and wardrobes",
      "Wall washing",
      "Specialist mould treatment or remediation",
      "High-access work needing towers or ladders beyond normal reach",
      "Waste removal, repairs or restoration work",
    ],
    extras: [
      { name: "Inside the oven" },
      { name: "Inside the fridge or freezer" },
      { name: "Inside cupboards and wardrobes" },
      { name: "External windows" },
      { name: "Carpet cleaning (specialist partner)" },
      { name: "Upholstery cleaning" },
    ],
    faqs: [
      { q: "How is this different from a normal deep clean?",
        a: "A conventional deep clean is usually priced by hours or bedrooms. This is priced by condition. We bring more people, allow more time, and go back over things until they are actually clean rather than until the clock runs out." },
      { q: "Why do you want photos before quoting?",
        a: "Because condition drives the workload far more than the number of bedrooms does. Two identical three-bedroom houses can be a five-hour job and a two-day job. Photos or a short walkthrough video let us give you a fixed price we can stand behind." },
      { q: "Is the price negotiable?",
        a: "There is room to move on scope. If a fixed price is more than you want to spend, tell us your budget and we will tell you honestly what we can do properly within it — we would rather do fewer rooms well than every room badly." },
    ],
    seoTitle: "Restoration Deep Cleaning in Colchester & Essex",
    seoDescription:
      "A labour-intensive deep clean for properties that need more than a standard clean. Fixed prices from £350 across Colchester, Ipswich and Essex.",
  },
  {
    slug: "end-of-tenancy-cleaning",
    name: "End-of-Tenancy Cleaning",
    group: "TRANSITION",
    propertyKind: "HOUSE",
    sortOrder: 20,
    summary: "A thorough move-out clean for tenants, landlords and letting agents who need the property handed back properly.",
    body: `Most deposit disputes come down to cleaning. This service exists to take that argument off the table.

We work through the whole property in the condition it is actually in: kitchens degreased and descaled, bathrooms taken back to clean rather than tidy, appliances, cupboards, skirtings, switches, doors and frames, internal windows and sills, and floors throughout.

Because we price on condition rather than bedroom count, we ask for photos or a short walkthrough video first. That is also what lets us hold the price steady once we are on site.

If you are the outgoing tenant, tell us the date the keys are due back and we will work to it. If you are a landlord or agent, we can collect keys and work in an empty property without you needing to be there.`,
    priceMode: "QUOTE_ONLY",
    negotiable: false,
    durationEstimate: "Typically a full day for a family home",
    noticeHours: 48,
    requiresSurvey: false,
    photosRecommended: true,
    whatsappPrompt: "Hi, I'd like a quote for an End of Tenancy/Move-Out Clean.",
    heroImage: "/images/service-end-of-tenancy.jpg",
    includes: [
      "Every room cleaned top to bottom",
      "Kitchen degreasing, descaling and appliance exteriors",
      "Bathrooms, tiling, sanitaryware and limescale removal",
      "Inside cupboards and drawers where the property is empty",
      "Skirtings, doors, frames, handles and switches",
      "Internal windows, frames and sills",
      "Vacuuming and floor cleaning throughout",
    ],
    excludes: [
      "Carpet and upholstery cleaning unless quoted",
      "External windows",
      "Removal of belongings or rubbish",
      "Repairs, redecorating or damage restoration",
      "Garden, garage or loft clearance",
    ],
    extras: [
      { name: "Inside the oven" },
      { name: "Inside the fridge or freezer" },
      { name: "Carpet cleaning (specialist partner)" },
      { name: "External windows" },
    ],
    faqs: [
      { q: "Do belongings need to be out first?",
        a: "Ideally yes. Cupboards should be empty if you want them cleaned inside. We can work around some furniture, but anything we cannot reach is not something we can clean." },
      { q: "Will this satisfy my letting agent?",
        a: "We clean to the standard the inventory expects and we tell you plainly if something is damage rather than dirt, because no amount of cleaning fixes that. Report any concern about an agreed area within 15 hours and we will come back and put it right." },
    ],
    seoTitle: "End of Tenancy Cleaning in Colchester, Ipswich & Essex",
    seoDescription:
      "Move-out cleaning for tenants, landlords and agents across Essex and Suffolk. Fixed prices from photos, and a rectification window if anything is missed.",
  },
  {
    slug: "after-builders-cleaning",
    name: "Post-Renovation & After-Builders Cleaning",
    group: "SIGNATURE",
    propertyKind: "HOUSE",
    sortOrder: 30,
    summary: "Getting fine construction dust out of a property once the trades have finished — including the places it hides.",
    body: `Building dust is not ordinary dust. It is fine, it is abrasive, and it settles again hours after an ordinary clean. Doing this properly means working in stages and returning to surfaces more than once.

We remove dust and debris from surfaces, frames, ledges, radiators, skirtings and fittings, clean paint and adhesive residue where it can be removed safely, clean internal glass, and vacuum and wash floors — then go back over the areas where dust has settled again.

Because the workload depends entirely on how much dust was left behind and how well the site was protected, this service normally needs either detailed photos or an in-person assessment before we can give you a fixed price.`,
    priceMode: "QUOTE_ONLY",
    negotiable: false,
    durationEstimate: "A full day or more, depending on the site",
    noticeHours: 72,
    requiresSurvey: true,
    photosRecommended: true,
    whatsappPrompt: "Hi, I'd like a quote for an After-Builders Clean.",
    heroImage: "/images/service-after-builders.jpg",
    includes: [
      "Removal of fine construction dust from all agreed surfaces",
      "Frames, ledges, radiators, skirtings and fittings",
      "Paint and adhesive residue where it lifts safely",
      "Internal glass, frames and sills",
      "Detailed kitchen and bathroom cleaning",
      "Vacuuming and washing of all floors, with a second pass on settled dust",
    ],
    excludes: [
      "Removal of building waste, offcuts or packaging",
      "Cleaning that requires scaffolding or towers",
      "Sealing, polishing or finishing of new floors",
      "Anything that risks damaging uncured paint or new finishes",
    ],
    extras: [{ name: "Second-visit dust check" }, { name: "External windows" }, { name: "Carpet cleaning (specialist partner)" }],
    seoTitle: "After Builders Cleaning in Essex & Suffolk",
    seoDescription:
      "Post-renovation cleaning that actually removes construction dust, including the second pass most cleaners skip. Colchester, Ipswich and surrounding areas.",
  },
  {
    slug: "probate-and-pre-sale-cleaning",
    name: "Probate & Pre-Sale Property Cleaning",
    group: "TRANSITION",
    propertyKind: "HOUSE",
    sortOrder: 40,
    summary: "Careful, discreet cleaning of a property that is being sold or cleared, often after a bereavement.",
    body: `This work asks for more than cleaning. Properties being sold or cleared after a death are often untouched for a long time, and the people arranging it are usually dealing with a great deal else.

We work discreetly and at a pace that suits you. We can liaise with a solicitor, executor or estate agent instead of the family where that is easier, and we will always check before disposing of anything.

The result is a property that photographs well and shows well — which matters commercially as well as personally.`,
    priceMode: "QUOTE_ONLY",
    negotiable: true,
    durationEstimate: "Usually one to two days",
    noticeHours: 72,
    requiresSurvey: false,
    photosRecommended: true,
    whatsappPrompt: "Hi, I'd like to talk about a probate or pre-sale clean.",
    heroImage: "/images/service-probate.jpg",
    includes: [
      "Full deep clean of all agreed rooms",
      "Kitchens, bathrooms and appliances",
      "Dust, cobwebs and long-settled grime",
      "Internal windows, sills and frames",
      "Floors throughout",
      "Discreet working, and liaison with a solicitor, executor or agent if you prefer",
    ],
    excludes: [
      "House clearance or removal of furniture and belongings",
      "Disposal of anything without your express instruction",
      "Repairs, redecorating or garden work",
    ],
    extras: [{ name: "Inside the oven" }, { name: "Carpet cleaning (specialist partner)" }, { name: "Internal window detail" }],
    seoTitle: "Probate & Pre-Sale Cleaning in Essex and Suffolk",
    seoDescription:
      "Discreet, careful cleaning of properties being sold or cleared. We can deal with a solicitor, executor or agent instead of the family.",
  },
  {
    slug: "move-in-deep-clean",
    name: "Move-In & New Home Deep Cleaning",
    group: "TRANSITION",
    propertyKind: "HOUSE",
    sortOrder: 50,
    summary: "A full clean of your new home before your furniture arrives, so you start in a property that is genuinely yours.",
    body: `Nobody wants to unpack into someone else's grime. A move-in clean is easiest and cheapest while the property is still empty, because we can reach everything.

We clean inside cupboards and wardrobes, degrease and descale the kitchen, take the bathrooms back to properly clean, and go over skirtings, doors, frames, switches, internal glass and floors throughout.

Book it for the day before the removals van if you possibly can — it makes a considerable difference to what we can reach.`,
    priceMode: "QUOTE_ONLY",
    negotiable: false,
    durationEstimate: "Most of a day for a family home",
    noticeHours: 48,
    requiresSurvey: false,
    photosRecommended: true,
    whatsappPrompt: "Hi, I'd like a quote for a Move-In Deep Clean.",
    heroImage: "/images/service-move-in.jpg",
    includes: [
      "Inside cupboards, drawers and wardrobes",
      "Kitchen degreasing, descaling and appliance exteriors",
      "Bathrooms, tiling and limescale removal",
      "Skirtings, doors, frames, handles and switches",
      "Internal windows, frames and sills",
      "Vacuuming and floor cleaning throughout",
    ],
    excludes: ["Carpet and upholstery cleaning unless quoted", "External windows", "Unpacking or furniture moving", "Waste removal"],
    extras: [{ name: "Inside the oven" }, { name: "Inside the fridge or freezer" }, { name: "Carpet cleaning (specialist partner)" }],
    seoTitle: "Move-In Deep Cleaning in Colchester & Essex",
    seoDescription: "Have your new home properly cleaned before the furniture arrives. Fixed prices from photos across Essex and Suffolk.",
  },
  {
    slug: "commercial-office-cleaning",
    name: "Commercial & Office Cleaning",
    group: "COMMERCIAL",
    propertyKind: "OFFICE",
    sortOrder: 60,
    summary: "Offices, salons, surgeries, lettings and small commercial units — one-off deep cleans or an agreed regular schedule.",
    body: `We clean commercial premises where presentation matters and where the standard has to be the same every visit.

Scope, frequency and timing are agreed individually. Some clients want a single restoration-level clean to reset the premises; others want us in on a fixed schedule outside their working hours. We can work early, late or at weekends so nobody is stepping over a mop during business hours.

Frequency, minimum term, cancellation notice and payment terms are all agreed with you in writing before we start. Commercial clients can be invoiced, normally on terms up to 30 days.`,
    priceMode: "QUOTE_ONLY",
    negotiable: true,
    durationEstimate: "Agreed to the schedule",
    noticeHours: 72,
    requiresSurvey: true,
    photosRecommended: false,
    whatsappPrompt: "Hi, I'd like a quote for commercial or office cleaning.",
    heroImage: "/images/service-commercial.jpg",
    includes: [
      "Desks, surfaces and high-touch points",
      "Kitchens, staff areas and washrooms",
      "Internal glass, partitions and doors",
      "Floors, including vacuuming and hard-floor cleaning",
      "Waste emptied to your bin store",
      "An agreed, written scope so every visit is the same",
    ],
    excludes: [
      "Consumables such as hand towels and soap unless agreed",
      "External windows above ground floor",
      "Specialist industrial or hazardous cleaning",
      "IT equipment beyond exterior wiping",
    ],
    extras: [{ name: "Washroom consumables restocking" }, { name: "Carpet cleaning (specialist partner)" }, { name: "Internal window detail" }],
    faqs: [
      { q: "What is the minimum contract?",
        a: "There isn't a fixed one. Frequency, minimum term and notice are agreed with each client according to what the premises actually need." },
      { q: "Can we be invoiced?",
        a: "Yes. Commercial clients are normally invoiced on agreed terms, usually up to 30 days." },
    ],
    seoTitle: "Office & Commercial Cleaning in Colchester, Ipswich & Essex",
    seoDescription:
      "Contract and one-off commercial cleaning with an agreed written scope, out-of-hours working and invoicing on up to 30-day terms.",
  },
  {
    slug: "emergency-cleaning",
    name: "Emergency & Short-Notice Cleaning",
    group: "SIGNATURE",
    propertyKind: "OTHER",
    sortOrder: 70,
    summary: "Same-day and next-day cleaning when a viewing, check-out or inspection has been sprung on you.",
    body: `Sometimes the date moves and there is nothing to be done about it. If we have the capacity, we will take it on.

Tell us what has happened, send photos, and we will tell you straight away whether we can get a team to you and what it will cost. A short-notice or emergency call-out fee may apply, and we always confirm it before you commit to anything.

We would rather say no than promise a slot we cannot staff properly, so if we cannot do it well in the time available we will tell you that too.`,
    priceMode: "QUOTE_ONLY",
    negotiable: false,
    durationEstimate: "Depends entirely on the job",
    noticeHours: 0,
    requiresSurvey: false,
    photosRecommended: true,
    whatsappPrompt: "Hi, I need a clean at short notice. Are you available?",
    heroImage: "/images/service-emergency.jpg",
    includes: [
      "Same-day or next-day attendance where a team is free",
      "An honest answer within the hour about whether we can do it",
      "The same standard as any other So Fresh job",
    ],
    excludes: ["Any promise of availability before we have confirmed it", "Work we cannot complete properly in the time available"],
    extras: [],
    seoTitle: "Emergency & Same-Day Cleaning in Essex",
    seoDescription: "Short-notice and same-day cleaning across Colchester, Ipswich and Essex when a date has moved. A call-out fee may apply.",
  },
  {
    slug: "oven-and-appliance-cleaning",
    name: "Oven & Appliance Deep Cleaning",
    group: "SIGNATURE",
    propertyKind: "HOUSE",
    sortOrder: 80,
    summary: "Ovens, hobs, extractors, fridges and freezers stripped down and degreased properly.",
    body: `Ovens are the single most common thing that costs tenants their deposit, and the single most common thing people give up on.

We take out the removable parts, degrease the interior including the door glass where it can be separated safely, clean the racks and trays, and rebuild it. Hobs, extractors and filters, fridges and freezers can be done at the same time.

This can be booked on its own, or added to any other So Fresh clean while we are already there — which is almost always the cheaper way to do it.`,
    priceMode: "QUOTE_ONLY",
    negotiable: false,
    durationEstimate: "One to three hours",
    noticeHours: 48,
    requiresSurvey: false,
    photosRecommended: true,
    whatsappPrompt: "Hi, I'd like a quote for an oven or appliance deep clean.",
    heroImage: "/images/service-oven.jpg",
    includes: [
      "Removable parts taken out, soaked and cleaned",
      "Interior degreased, including door glass where it separates safely",
      "Racks, trays and shelves",
      "Hob, extractor and filters if included",
      "Fridge or freezer interior if included",
      "Everything rebuilt and checked",
    ],
    excludes: [
      "Repairs, replacement seals, bulbs or parts",
      "Appliances that are unsafe, faulty or already damaged",
      "Self-cleaning liners, which can be damaged by chemicals",
    ],
    extras: [{ name: "Hob and extractor" }, { name: "Fridge or freezer interior" }, { name: "Microwave" }, { name: "Dishwasher" }],
    seoTitle: "Oven Cleaning in Colchester, Ipswich & Essex",
    seoDescription: "Ovens, hobs, extractors and fridges stripped down and degreased. Book on its own or add it to any other So Fresh clean.",
  },
  {
    slug: "carpet-cleaning",
    name: "Carpet Cleaning",
    group: "SIGNATURE",
    propertyKind: "HOUSE",
    sortOrder: 90,
    summary: "Arranged through a specialist partner and coordinated around your clean so you only deal with us.",
    body: `We do not pretend to be carpet specialists. What we do is bring one in and coordinate the timing, so the carpets are done at the right point in the job rather than being walked over afterwards.

You deal with us throughout: one conversation, one schedule, one point of contact. The carpet work is quoted separately and clearly, so you can see exactly what you are paying for.`,
    priceMode: "QUOTE_ONLY",
    negotiable: false,
    durationEstimate: "Arranged with the partner",
    noticeHours: 96,
    requiresSurvey: false,
    photosRecommended: true,
    whatsappPrompt: "Hi, I'd like to add carpet cleaning to my quote.",
    heroImage: "/images/service-carpet.jpg",
    includes: ["A specialist partner arranged and scheduled by us", "Timed to fit around the rest of the clean", "Quoted separately and transparently"],
    excludes: ["Guarantees on permanent staining or pre-existing damage", "Carpet repair, stretching or replacement"],
    extras: [{ name: "Upholstery cleaning" }, { name: "Rugs" }, { name: "Stair carpet" }],
    seoTitle: "Carpet Cleaning Arranged with Your Deep Clean — Essex",
    seoDescription: "Carpet cleaning through a trusted specialist partner, scheduled around your So Fresh clean. One point of contact throughout.",
  },
  {
    slug: "regular-domestic-cleaning",
    name: "Selective Regular Domestic Cleaning",
    group: "COMMERCIAL",
    propertyKind: "HOUSE",
    sortOrder: 100,
    summary: "Colchester only, and only where we can maintain our standard. £25 per hour, subject to availability.",
    body: `Regular domestic cleaning is not our main focus, and we would rather be straight with you about that than take work we cannot do well.

We accept a small number of regular clients within Colchester, where the travel time makes it workable and where the property suits the way we clean. It is £25 per hour, with minimum booking requirements, and availability is genuinely limited.

If you are outside Colchester, or if what you need is a weekly two-hour tidy at the lowest price you can find, we are almost certainly not the right company for you — and we will say so rather than waste your time.`,
    priceMode: "PER_HOUR",
    price: "25",
    negotiable: false,
    minimumCharge: "Minimum booking requirements apply",
    durationEstimate: "Agreed with you, per visit",
    noticeHours: 48,
    requiresSurvey: false,
    photosRecommended: false,
    whatsappPrompt: "Hi, I'd like to ask about regular domestic cleaning in Colchester.",
    heroImage: "/images/service-regular.jpg",
    includes: [
      "An agreed list of rooms and tasks each visit",
      "Kitchens, bathrooms, floors and surfaces",
      "The same team wherever we can manage it",
    ],
    excludes: [
      "Areas outside Colchester",
      "Deep cleaning or restoration work, which is quoted separately",
      "Ironing, laundry or childcare",
      "Anything not on the agreed list",
    ],
    extras: [{ name: "Inside the oven (occasional)" }, { name: "Internal windows (occasional)" }],
    seoTitle: "Regular Domestic Cleaning in Colchester — £25 per hour",
    seoDescription:
      "A small number of regular domestic cleaning slots in Colchester at £25 per hour. Limited availability and minimum booking requirements apply.",
  },
];

/**
 * Review text is deliberately NOT invented here. The business has real
 * five-star Google reviews from these customers; paste the genuine wording in
 * from the Google Business Profile before the site goes live.
 */
const TESTIMONIAL_AUTHORS = [
  { authorName: "Nicola R.", area: "Colchester", featured: true, sortOrder: 10 },
  { authorName: "Donna M.", area: "Ipswich", featured: true, sortOrder: 20 },
  { authorName: "Sophie T.", area: "Braintree", featured: true, sortOrder: 30 },
  { authorName: "Katie L.", area: "Clacton-on-Sea", featured: false, sortOrder: 40 },
  { authorName: "Wendy P.", area: "Dedham", featured: false, sortOrder: 50 },
  { authorName: "Rebecca H.", area: "Colchester", featured: false, sortOrder: 60 },
];

const PLACEHOLDER_REVIEW =
  "[Paste this customer's real Google review text here before launch — see Admin → Settings for the review link.]";

async function main() {
  // ---------------------------------------------------------------- settings
  await prisma.siteSetting.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      serviceAreas: AREAS.map((a) => a.name),
      whatsappForwardNumber: "447399505686",
      adminNotifyEmail: process.env.SEED_ADMIN_EMAIL ?? "info@sofreshcleaning.co.uk",
      heroSlides: [
        {
          image: "/images/hero-kitchen.jpg",
          headline: "Cleaned properly.\nNot just made to look clean.",
          sub: "Restoration deep cleaning across Essex and Suffolk.",
        },
        {
          image: "/images/hero-bathroom.jpg",
          headline: "The places\nmost cleaners skip.",
          sub: "Priced on condition, not on bedroom count.",
        },
        {
          image: "/images/hero-window.jpg",
          headline: "Handing the keys\nback with confidence.",
          sub: "End-of-tenancy and move-out cleaning done to the inventory.",
        },
      ],
    },
  });

  // ------------------------------------------------------------------- admin
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "info@sofreshcleaning.co.uk";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (adminPassword) {
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: "ADMIN" },
      create: {
        email: adminEmail,
        name: "Mabel Onyeanusi",
        role: "ADMIN",
        passwordHash: await hashPassword(adminPassword),
      },
    });
    console.log(`  admin ready: ${adminEmail}`);
  } else {
    console.warn("  SEED_ADMIN_PASSWORD not set — skipping the admin account.");
  }

  // ------------------------------------------------------------------- areas
  for (const area of AREAS) {
    await prisma.areaCovered.upsert({ where: { slug: area.slug }, update: area, create: area });
  }

  // ---------------------------------------------------------------- services
  for (const { extras, faqs, ...service } of SERVICES) {
    const data = {
      ...service,
      extras: extras && extras.length > 0 ? extras : undefined,
      faqs: faqs && faqs.length > 0 ? faqs : undefined,
    } satisfies Prisma.ServiceCreateInput;

    await prisma.service.upsert({ where: { slug: service.slug }, update: data, create: data });
  }

  // ------------------------------------------------------------ testimonials
  const existingTestimonials = await prisma.testimonial.count();
  if (existingTestimonials === 0) {
    await prisma.testimonial.createMany({
      data: TESTIMONIAL_AUTHORS.map((author) => ({ ...author, body: PLACEHOLDER_REVIEW, source: "Google" })),
    });
    console.log("  testimonials created with placeholder text — replace before launch.");
  }

  console.log(`  ${SERVICES.length} services, ${AREAS.length} areas.`);
}

main()
  .then(() => console.log("Seed complete."))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
