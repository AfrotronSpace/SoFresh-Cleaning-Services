"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/utils";

/**
 * Mobile only. The business answers WhatsApp fastest, so on small screens
 * it stays one thumb-reach away without covering the page content.
 */
export function StickyContactBar({
  whatsapp,
  message,
  bookHref = "/book",
  bookLabel = "Request a booking",
}: {
  whatsapp: string;
  message: string;
  bookHref?: string;
  bookLabel?: string;
}) {
  return (
    <div className="sticky bottom-0 z-40 border-t border-border bg-white/95 backdrop-blur-md md:hidden">
      <div className="shell flex gap-2 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <a
          href={whatsappLink(whatsapp, message)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-md bg-[#1f8f4e] px-4 text-[0.9375rem] font-medium text-white"
        >
          <MessageCircle className="size-4" />
          WhatsApp
        </a>
        <Link
          href={bookHref}
          className="inline-flex h-12 flex-1 items-center justify-center rounded-md bg-forest px-4 text-[0.9375rem] font-medium text-white"
        >
          {bookLabel}
        </Link>
      </div>
    </div>
  );
}
