import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center bg-haze px-5 py-20">
      <div className="mx-auto max-w-[52ch] text-center">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-champagne">Page not found</p>
        <h1 className="mt-5 font-display text-[2.25rem] leading-tight md:text-[2.75rem]">
          That page isn&rsquo;t here
        </h1>
        <p className="mt-4 text-[1.0625rem] leading-relaxed text-sage">
          It may have moved, or the link may be out of date. Everything we do is on the services page, and the fastest way to
          get a price is still to message us.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/services">See our services</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/contact">Contact us</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
