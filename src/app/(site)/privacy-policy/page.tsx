import type { Metadata } from "next";
import { LegalPage, Clause } from "@/components/site/legal-page";
import { loadSettings } from "@/lib/settings";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Privacy policy",
  description:
    "How So Fresh Cleaning Service collects, uses and protects your personal information. No payment details are ever collected or stored on this website.",
  path: "/privacy-policy",
});

export default async function PrivacyPolicyPage() {
  const settings = await loadSettings();

  return (
    <LegalPage
      title="Privacy policy"
      intro={`How ${SITE.legalName} handles the information you give us, written to match what this website actually does.`}
      updated="2026-09-01"
    >
      <Clause heading="Who we are">
        <p>
          {SITE.legalName} (&ldquo;So Fresh&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is a company registered in England and Wales, company number{" "}
          {SITE.companyNumber}. We are the data controller for the personal information described in this policy.
        </p>
        <p>
          We work from a home address and do not publish it. To contact us about privacy, email{" "}
          <a href={`mailto:${settings.email}`} className="text-verdant underline underline-offset-2">{settings.email}</a> or
          call {settings.phone}, and we will provide a postal address on request.
        </p>
      </Clause>

      <Clause heading="What we collect">
        <p>Through this website we collect only what you type into a form:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Your name, email address and phone number.</li>
          <li>The property address or postcode where the work would happen.</li>
          <li>Details about the job: property type, bedrooms and bathrooms, whether it is occupied or empty, its condition, the services you want, your preferred dates and how we should get in.</li>
          <li>Anything else you choose to write in a message or notes field, and any photos or video you send us voluntarily so we can quote.</li>
          <li>Whether you have asked to hear about offers.</li>
        </ul>
        <p>
          <strong>We never collect or store payment details.</strong> There is no card checkout on this website. Payments are
          arranged directly between you and us, by bank transfer or a secure payment link provided separately.
        </p>
        <p>
          If you create an account, we also store a securely hashed version of your password. We cannot see or recover your
          actual password.
        </p>
      </Clause>

      <Clause heading="Why we use it, and our lawful basis">
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>To answer your enquiry and prepare a quote.</strong> Steps taken at your request before entering a contract.</li>
          <li><strong>To carry out a booking.</strong> Performance of our contract with you.</li>
          <li><strong>To keep records for accounting and tax.</strong> Legal obligation.</li>
          <li><strong>To run and secure our business,</strong> including preventing spam and fraud. Our legitimate interests.</li>
          <li><strong>To send occasional offers,</strong> only where you have ticked to receive them. Consent, which you can withdraw at any time.</li>
        </ul>
      </Clause>

      <Clause heading="Who we share it with">
        <p>We share your details only where a job needs it, and only the parts that are needed:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>The cleaner or subcontracted cleaners assigned to your job, so they can find the property, gain access and understand the scope.</li>
          <li>Our accountant, for invoicing, bookkeeping and statutory accounts.</li>
          <li>Our email, hosting and booking software providers, who process data on our instructions.</li>
          <li>Payment providers, where a secure payment link is used. They handle payment details directly; we do not see or store them.</li>
        </ul>
        <p>We do not sell your personal information, and we do not share it with anyone for their own marketing.</p>
      </Clause>

      <Clause heading="How long we keep it">
        <p>
          Enquiries that do not turn into a job are kept for up to 24 months so we can pick up the conversation if you come
          back. Records of completed jobs, including invoices, are kept for seven years to meet HMRC requirements. Photos and
          video you send for quoting are deleted once the job is closed and any complaint window has passed, unless you have
          agreed we may use an image in our marketing.
        </p>
      </Clause>

      <Clause heading="Your rights">
        <p>
          Under UK data protection law you can ask us for a copy of your information, ask us to correct or delete it, object
          to or restrict how we use it, ask for it in a portable format, and withdraw consent to marketing at any time. Email{" "}
          <a href={`mailto:${settings.email}`} className="text-verdant underline underline-offset-2">{settings.email}</a> and we
          will respond within one month.
        </p>
        <p>
          If you are unhappy with how we have handled your information you can complain to the Information Commissioner&rsquo;s
          Office at ico.org.uk or on 0303 123 1113.
        </p>
      </Clause>

      <Clause heading="Cookies and analytics">
        <p>
          This website uses a single essential cookie to keep you signed in to your account. It is not used for advertising and
          is removed when you sign out.
        </p>
        <p>
          If website analytics are enabled, they help us understand which pages are useful and where people get stuck. Any such
          measurement is configured to avoid identifying you personally, and no analytics or advertising cookies are set
          without your agreement where one is required.
        </p>
      </Clause>

      <Clause heading="Changes to this policy">
        <p>
          If we change how we handle your information we will update this page and change the date at the top. Material changes
          affecting an active booking will also be sent to you by email.
        </p>
      </Clause>
    </LegalPage>
  );
}
