import { formatMoney } from "@/lib/utils";

/**
 * The Help Centre content, taken from the business's own answers.
 * Kept in one file so the same wording powers the FAQ page, the
 * home-page accordion and the FAQPage structured data.
 *
 * It is a function, not a constant, because two promises and one price are
 * admin-editable: the cancellation and problem-report windows live in
 * SiteSetting, and an hourly rate lives on the Service row. Hardcoding any
 * of them here would let the Help Centre contradict the booking terms.
 */
export type Faq = { q: string; a: string };
export type FaqGroup = { title: string; intro: string; faqs: Faq[] };

export type FaqPolicy = { cancellationHours: number; reclaimWindowHours: number };
/** An active service priced per hour. `price` is a string: Decimal never crosses to the client. */
export type HourlyRate = { name: string; price: string };

export function buildFaqs(policy: FaqPolicy, hourlyRates: HourlyRate[]): { groups: FaqGroup[]; all: Faq[] } {
  const { cancellationHours, reclaimWindowHours } = policy;
  const hourlyNote = hourlyRates.length
    ? ` ${hourlyRates.map((r) => `${r.name} is charged at ${formatMoney(r.price)} per hour`).join(", and ")}.`
    : "";

  const groups: FaqGroup[] = [
    {
      title: "Getting a price",
      intro: "How we work out what a job costs, and how long that takes.",
      faqs: [
        {
          q: "Can you give me a price without visiting?",
          a: "Usually, yes. Send clear photos or a short walkthrough video and we can price most jobs remotely. Photos matter most for end of tenancy, move-in/move-out and restoration deep cleans, because the condition of a property affects the workload far more than its size does. Heavily soiled properties, after-builders cleans, larger homes and specialist jobs may still need us to come and look first.",
        },
        {
          q: "How long will I wait for my quote?",
          a: "Normally within 24 hours of us having everything we need to assess the job. Complex jobs can take a little longer, and we'll tell you if that's the case.",
        },
        {
          q: "How quickly do you reply to a new enquiry?",
          a: "We aim to respond the same day, and usually much sooner during normal working hours.",
        },
        {
          q: "Do you charge by the hour?",
          a: `For most work, no. We quote a fixed price against an agreed scope, so you know what you're paying before we start.${hourlyNote}`,
        },
        {
          q: "Why does the price depend on condition rather than bedrooms?",
          a: "A three-bed house that has been maintained and a three-bed house that has stood empty for a year are completely different jobs. We price on the condition, the scope, the level of detail and the result you need — which is why photos help so much.",
        },
      ],
    },
    {
      title: "Booking and payment",
      intro: "No payment is ever taken through this website.",
      faqs: [
        {
          q: "Do I pay a deposit?",
          a: "We take a booking fee to secure one-off appointments. The amount varies with the value and nature of the job, and it comes off the final balance. We always confirm the exact figure before you commit.",
        },
        {
          q: "How do I pay?",
          a: "Bank transfer or a secure payment link. Business and corporate customers can be invoiced. Nothing is paid through this website — there is no card checkout here.",
        },
        {
          q: "When is payment due?",
          a: "For one-off residential jobs, the booking fee is paid in advance and the balance is normally due on completion. Commercial clients may have agreed invoice terms, normally up to 30 days depending on the contract.",
        },
        {
          q: "How much notice do you need to book a job in?",
          a: "48 to 72 hours is preferred. Same-day and last-minute work is often possible where the team has capacity, though an emergency or short-notice call-out fee may apply. We confirm any such fee before booking.",
        },
      ],
    },
    {
      title: "Changing or cancelling",
      intro: "Plans change. Here is exactly where you stand.",
      faqs: [
        {
          q: "What if I need to cancel?",
          a: `We ask for at least ${cancellationHours} hours' notice. Booking fees are non-refundable for cancellations inside ${cancellationHours} hours. If our team has already travelled, or we cannot get access on the day, a charge may apply to cover staff, travel and operational costs.`,
        },
        {
          q: "Can I move my booking to another day?",
          a: `Yes. Bookings can be moved to another available date, and we ask for at least ${cancellationHours} hours' notice where possible. Changes are subject to availability. Late changes may mean losing the booking fee, or an additional charge where staff and resources have already been committed.`,
        },
      ],
    },
    {
      title: "On the day",
      intro: "What we need from you, and what you can expect from us.",
      faqs: [
        {
          q: "How do you get into the property?",
          a: "Whatever suits you. You can be there, arrange for someone to meet us, leave a key, or give us secure key-safe details. Commercial access arrangements can be agreed in advance. Please never send access codes through the website form — we'll ask for those directly once your date is confirmed.",
        },
        {
          q: "What should I do before you arrive?",
          a: "Remove unnecessary clutter, clear the surfaces you'd like cleaned, put valuables and fragile items somewhere safe, and tell us about any pets. For end of tenancy and move-out cleans, personal belongings should ideally be removed and cupboards emptied if you want the insides cleaned.",
        },
        {
          q: "What about parking?",
          a: "Please tell us about any parking restrictions or permits in advance. Exceptional parking, congestion or access charges needed for the job may be added to your quote, or charged separately by prior agreement.",
        },
        {
          q: "Do you bring your own equipment and products?",
          a: "Yes, we normally provide everything the job needs. If anyone in the property has allergies or sensitivities, or you'd prefer particular products, tell us before booking and we'll discuss suitable options.",
        },
      ],
    },
    {
      title: "Standards and problems",
      intro: "What happens if something isn't right.",
      faqs: [
        {
          q: "What if I'm not happy with the clean?",
          a: `Tell us. Concerns about an agreed area should be reported within ${reclaimWindowHours} hours of completion, ideally with photos. We assess promptly and, where appropriate, arrange for the affected area to be put right.`,
        },
        {
          q: "How do I make a complaint?",
          a: "Contact So Fresh Cleaning Service directly by phone, WhatsApp or email as soon as possible, with photos or video where relevant. Complaints are reviewed by management and handled promptly and fairly.",
        },
        {
          q: "Are you insured?",
          a: "Yes. We hold public liability insurance. We're also a limited company registered in England and Wales, company number 16423190.",
        },
      ],
    },
    {
      title: "Regular and commercial work",
      intro: "Ongoing arrangements for businesses and, occasionally, homes.",
      faqs: [
        {
          q: "Do you offer regular cleaning contracts for businesses?",
          a: "Yes, for suitable businesses. Frequency, minimum term, cancellation notice and payment terms are agreed individually according to what you need.",
        },
        {
          q: "Do you do regular domestic cleaning?",
          a: "Selectively, and only in Colchester, subject to availability and minimum booking requirements. Get in touch and we'll tell you whether we have room and what it would cost. Regular domestic work isn't our main focus — our speciality is the labour-intensive one-off jobs that most cleaners won't take on.",
        },
      ],
    },
  ];

  return { groups, all: groups.flatMap((group) => group.faqs) };
}

export const HOW_IT_WORKS = [
  {
    title: "Tell us what needs doing",
    body: "Message us on WhatsApp or fill in the booking form. The more you tell us about the condition, the better.",
  },
  {
    title: "Send photos or a short video",
    body: "This is the step that makes everything else fast. Condition drives the price, and we can only see it if you show us.",
  },
  {
    title: "Get a fixed price",
    body: "Usually within 24 hours. It's a fixed price against an agreed scope, not an hourly guess that grows on the day.",
  },
  {
    title: "We put you in the diary",
    body: "A booking fee secures your date and comes off the balance. We confirm everything in writing before the day.",
  },
];
