import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Clause } from "@/components/site/legal-page";
import { loadSettings } from "@/lib/settings";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Website terms of use",
  description: "The terms on which you may use the So Fresh Cleaning Service website.",
  path: "/terms",
});

export default async function TermsPage() {
  const settings = await loadSettings();

  return (
    <LegalPage
      title="Website terms of use"
      intro="These terms cover using this website. The terms covering an actual clean are set out separately."
      updated="2026-09-01"
    >
      <Clause heading="About this site">
        <p>
          This website is operated by {SITE.legalName}, a company registered in England and Wales, company number{" "}
          {SITE.companyNumber}. By using it you accept these terms. If you do not accept them, please do not use the site.
        </p>
      </Clause>

      <Clause heading="Bookings made here are requests">
        <p>
          Submitting the booking form sends us a request. It does not create a contract, hold a date, or oblige us to take the
          work on. A booking exists only once we have sent you a price, you have accepted it, and we have confirmed it in
          writing. See the{" "}
          <Link href="/booking-terms" className="text-verdant underline underline-offset-2">booking and cancellation terms</Link>.
        </p>
      </Clause>

      <Clause heading="No payments are taken here">
        <p>
          There is no card checkout, payment page or stored payment method on this website. Any page that appears to ask for
          card details is not ours — please tell us immediately at{" "}
          <a href={`mailto:${settings.email}`} className="text-verdant underline underline-offset-2">{settings.email}</a>.
        </p>
      </Clause>

      <Clause heading="Prices and information">
        <p>
          Prices shown are starting points or typical figures, not offers. Your actual price depends on the property&rsquo;s size,
          condition, scope and location, and is confirmed in a written quote. We try to keep everything here accurate and
          current but do not warrant that the site is error-free or continuously available.
        </p>
      </Clause>

      <Clause heading="Your account">
        <p>
          If you create an account, keep your password confidential and tell us if you think someone else has used it. We may
          suspend an account that is being used to send spam, abuse or fraudulent bookings.
        </p>
      </Clause>

      <Clause heading="Acceptable use">
        <p>
          Please do not attempt to gain unauthorised access to the site, submit false bookings, scrape it at volume, or use it
          in a way that damages it or disrupts anyone else&rsquo;s use of it.
        </p>
      </Clause>

      <Clause heading="Content and links">
        <p>
          The text, photographs, branding and design on this site belong to us or our licensors. You may view and print pages
          for your own use; please ask before reproducing anything elsewhere. Where we link to other sites, we are not
          responsible for their content.
        </p>
      </Clause>

      <Clause heading="Liability and law">
        <p>
          We do not exclude liability for death or personal injury caused by negligence, for fraud, or for anything else that
          cannot lawfully be excluded. Otherwise we are not liable for indirect or consequential loss arising from use of this
          website. These terms are governed by the law of England and Wales, and the courts of England and Wales have
          exclusive jurisdiction.
        </p>
      </Clause>
    </LegalPage>
  );
}
