"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center bg-haze px-5 py-20">
      <div className="mx-auto max-w-[54ch] text-center">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-champagne">Something went wrong</p>
        <h1 className="mt-5 font-display text-[2.25rem] leading-tight md:text-[2.75rem]">
          We&rsquo;ve hit a problem at our end
        </h1>
        <p className="mt-4 text-[1.0625rem] leading-relaxed text-sage">
          Nothing you&rsquo;ve entered has been lost by us on purpose, but it may not have been saved. If you were in the middle of a
          booking, message us on WhatsApp and we&rsquo;ll take the details from you directly.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={reset}>Try again</Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/contact">Contact us</Link>
          </Button>
        </div>
        {error.digest && <p className="mt-8 text-sm text-sage">Reference: {error.digest}</p>}
      </div>
    </div>
  );
}
