import Link from "next/link";
import { formatDate } from "@/lib/utils";

/** Shared shell so all three policy pages read as one document family. */
export function LegalPage({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-border bg-mist">
        <div className="shell py-14 md:py-20">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-sage">
            <Link href="/" className="hover:text-forest">Home</Link>
            <span className="px-2 text-champagne">/</span>
            <span className="text-ink">{title}</span>
          </nav>
          <h1 className="max-w-3xl font-display text-[2rem] leading-[1.1] md:text-[2.75rem]">{title}</h1>
          <p className="mt-5 max-w-[62ch] text-[1.0625rem] leading-relaxed text-sage">{intro}</p>
          <p className="mt-5 text-sm text-sage">Last updated {formatDate(updated)}</p>
        </div>
      </header>

      <div className="shell max-w-[72ch] py-14 md:py-20">
        <div className="space-y-10">{children}</div>
      </div>
    </>
  );
}

export function Clause({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl leading-snug text-ink md:text-2xl">{heading}</h2>
      <div className="prose-sofresh mt-4 max-w-none text-[1.0625rem]">{children}</div>
    </section>
  );
}
