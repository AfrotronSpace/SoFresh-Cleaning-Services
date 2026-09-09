import type { Metadata } from "next";
import { LegalPage, Clause } from "@/components/site/legal-page";
import { loadSettings } from "@/lib/settings";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Booking and cancellation terms",
  description:
    "How So Fresh Cleaning Service quotes, books, takes booking fees and handles cancellations, changes and complaints.",
  path: "/booking-terms",
});

export default async function BookingTermsPage() {
  const settings = await loadSettings();

  return (
    <LegalPage
      title="Booking and cancellation terms"
      intro="The terms that apply when you book a clean with us. Written plainly, so there are no surprises on the day."
      updated="2026-09-01"
    >
      <Clause heading="Quotes">
        <p>
          We quote a fixed price against an agreed scope of work, rather than an open-ended hourly rate. Most quotes are
          prepared from photos, a walkthrough video or detailed information you provide. Heavily soiled properties,
          after-builders cleans, larger properties and specialist jobs may require an in-person assessment first, which is free.
        </p>
        <p>
          {settings.quoteWindow} A quote is valid for 30 days. If the property turns out to be materially different from what
          was described or shown, we will tell you before starting and agree a revised price with you rather than proceeding
          and invoicing more later.
        </p>
      </Clause>

      <Clause heading="Booking fees">
        <p>{settings.bookingFeeNote}</p>
        <p>
          Your date is not held until the booking fee has been received and we have sent written confirmation. Submitting the
          form on this website is a request, not a confirmed appointment.
        </p>
      </Clause>

      <Clause heading="Payment">
        <p>
          Payment is by bank transfer or a secure payment link. No payment is taken through this website and there is no card
          checkout here. For one-off residential jobs the booking fee is paid in advance and the balance is normally due on
          completion. Commercial clients may be invoiced on agreed terms, normally up to 30 days.
        </p>
      </Clause>

      <Clause heading={`Cancelling: we need ${settings.cancellationHours} hours`}>
        <p>
          We ask for at least {settings.cancellationHours} hours&rsquo; notice to cancel. Booking fees are non-refundable for
          cancellations made inside that window.
        </p>
        <p>
          If our team has already travelled to the property, or we cannot gain access on the day, a charge may apply to cover
          staff time, travel and operational costs.
        </p>
      </Clause>

      <Clause heading="Moving your booking">
        <p>
          Bookings can be moved to another available date. We ask for at least {settings.cancellationHours} hours&rsquo; notice
          where possible. Changes are subject to availability. Late changes may result in loss of the booking fee, or an
          additional charge where staff and resources have already been committed.
        </p>
      </Clause>

      <Clause heading="Access, parking and preparation">
        <p>
          You can be there, arrange for someone to meet us, leave a key, or provide secure key-safe details. Please never send
          access codes through the website form — we will ask for these directly once your date is confirmed.
        </p>
        <p>
          Before we arrive, please remove unnecessary clutter, clear the surfaces you want cleaned, secure valuables and
          fragile items, and tell us about pets. For end of tenancy and move-out cleans, personal belongings should ideally be
          removed and cupboards emptied if you want their insides cleaned.
        </p>
        <p>
          Please tell us about parking restrictions or permits in advance. Exceptional parking, congestion or access charges
          required for the job may be added to the quote or charged separately by prior agreement.
        </p>
      </Clause>

      <Clause heading="Equipment and products">
        <p>
          We normally provide all products and equipment. If anyone at the property has allergies or sensitivities, or you have
          specific product preferences, tell us before booking so we can discuss suitable options.
        </p>
      </Clause>

      <Clause heading="If something isn't right">
        <p>
          Concerns about an agreed area of work should be reported within {settings.reclaimWindowHours} hours of completion,
          preferably with photos. We will assess promptly and, where appropriate, arrange for the affected area to be
          rectified.
        </p>
        <p>
          Complaints should be raised directly with us by phone, WhatsApp or email as soon as possible, with photos or video
          where relevant. They are reviewed by management and handled promptly and fairly.
        </p>
      </Clause>

      <Clause heading="What is not included">
        <p>
          Unless it is written into your quote, the following is outside the scope of a standard clean: carpet and upholstery
          cleaning, external windows, the insides of fridges, freezers, ovens and cupboards, wall washing, specialist mould
          remediation, high-access work, waste removal, and any restoration or repair work. Any of these can be added — just
          ask when you enquire.
        </p>
      </Clause>

      <Clause heading="Regular and commercial contracts">
        <p>
          For business clients, frequency, minimum term, cancellation notice and payment terms are agreed individually in a
          separate written agreement, which takes precedence over these terms where the two differ.
        </p>
      </Clause>

      <Clause heading="Insurance and liability">
        <p>
          We hold public liability insurance. Nothing in these terms limits our liability for death or personal injury caused
          by negligence, for fraud, or for anything else that cannot be limited by law. Your statutory rights as a consumer are
          not affected.
        </p>
        <p>
          These terms are governed by the law of England and Wales. Questions about them can go to{" "}
          <a href={`mailto:${settings.email}`} className="text-verdant underline underline-offset-2">{settings.email}</a>.{" "}
          {SITE.legalName}, company number {SITE.companyNumber}.
        </p>
      </Clause>
    </LegalPage>
  );
}
