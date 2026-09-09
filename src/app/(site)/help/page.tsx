import Link from "next/link";
import type { Metadata } from "next";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/site/json-ld";
import { FAQ_GROUPS, ALL_FAQS } from "@/lib/content";
import { buildMetadata, faqJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { loadSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Help centre",
  description:
    "How So Fresh Cleaning Service quotes, books, gets paid, and handles changes and complaints. Answers to the questions customers ask most, in plain English.",
  path: "/help",
});

export default async function HelpPage() {
  const settings = await loadSettings();

  return (
    <>
      <JsonLd
        data={[
          faqJsonLd(ALL_FAQS),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Help centre", path: "/help" },
          ]),
        ]}
      />

      <header className="border-b border-border bg-mist">
        <div className="shell py-16 md:py-24">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-sage">
            <Link href="/" className="hover:text-forest">Home</Link>
            <span className="px-2 text-champagne">/</span>
            <span className="text-ink">Help centre</span>
          </nav>
          <h1 className="max-w-3xl font-display text-[2.25rem] leading-[1.1] md:text-[3.25rem]">
            Everything you&rsquo;d otherwise have to phone and ask
          </h1>
          <p className="mt-6 max-w-[62ch] text-[1.0625rem] leading-relaxed text-sage md:text-lg">
            How we price, how you pay, what happens if plans change, and what we need from you on the day.
          </p>
        </div>
      </header>

      <div className="shell grid gap-12 py-16 md:py-24 lg:grid-cols-[0.3fr_1fr] lg:gap-16">
        <nav aria-label="Sections" className="lg:sticky lg:top-28 lg:self-start">
          <ul className="space-y-2.5">
            {FAQ_GROUPS.map((group) => (
              <li key={group.title}>
                <a
                  href={`#${group.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  className="text-[0.9375rem] text-sage transition-colors hover:text-forest"
                >
                  {group.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-14">
          {FAQ_GROUPS.map((group) => (
            <section key={group.title} id={group.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")} className="scroll-mt-28">
              <h2 className="font-display text-2xl leading-tight md:text-[2rem]">{group.title}</h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-sage">{group.intro}</p>
              <Accordion type="single" collapsible className="mt-6 border-t border-border">
                {group.faqs.map((faq) => (
                  <AccordionItem key={faq.q} value={faq.q}>
                    <AccordionTrigger>{faq.q}</AccordionTrigger>
                    <AccordionContent>{faq.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}

          <section className="rounded-2xl bg-mist p-8 md:p-10">
            <h2 className="font-display text-2xl leading-tight">Still not answered?</h2>
            <p className="mt-3 max-w-[54ch] text-[0.9375rem] leading-relaxed text-sage">
              Ask us directly. WhatsApp is usually fastest, particularly if you can send photos.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="whatsapp" size="lg">
                <a href={whatsappLink(settings.whatsapp, "Hi, I have a question about your cleaning services.")} target="_blank" rel="noopener noreferrer">
                  Ask on WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/contact">Send a message</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
