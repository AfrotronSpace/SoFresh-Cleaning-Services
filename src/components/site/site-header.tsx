"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Phone, X, User } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { cn, telLink, whatsappLink } from "@/lib/utils";

const LINKS = [
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Our work" },
  { href: "/areas", label: "Areas we cover" },
  { href: "/help", label: "Help centre" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({
  phone,
  whatsapp,
  signedIn,
  isAdmin,
}: {
  phone: string;
  whatsapp: string;
  signedIn: boolean;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors duration-300",
        scrolled || open ? "border-border bg-white/95 backdrop-blur-md" : "border-transparent bg-white",
      )}
    >
      <div className="shell flex h-16 items-center justify-between gap-4 md:h-[4.5rem]">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-md px-3.5 py-2 text-[0.9375rem] font-medium transition-colors",
                  active ? "text-forest" : "text-sage hover:text-forest",
                )}
              >
                {link.label}
                {active && <span className="absolute inset-x-3.5 -bottom-px h-0.5 rounded-full bg-champagne" />}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={telLink(phone)}
            className="hidden items-center gap-2 rounded-md px-3 py-2 text-[0.9375rem] font-medium text-forest transition-colors hover:bg-mist md:inline-flex"
          >
            <Phone className="size-4" />
            {phone}
          </a>

          <Button asChild variant="whatsapp" size="sm" className="hidden sm:inline-flex">
            <a
              href={whatsappLink(whatsapp, "Hi, I'd like a quote for a clean.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              Message on WhatsApp
            </a>
          </Button>

          <Button asChild variant="ghost" size="icon" className="hidden lg:inline-flex" aria-label={signedIn ? "Your account" : "Sign in"}>
            <Link href={signedIn ? (isAdmin ? "/admin" : "/dashboard") : "/sign-in"}>
              <User className="size-5" />
            </Link>
          </Button>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex size-10 items-center justify-center rounded-md text-forest transition-colors hover:bg-mist lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden border-t border-border bg-white lg:hidden"
          >
            <nav aria-label="Mobile" className="shell flex flex-col py-3">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="border-b border-border/70 py-3.5 font-display text-lg text-forest last:border-0"
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pb-4 pt-4">
                <Button asChild variant="whatsapp" size="lg">
                  <a href={whatsappLink(whatsapp, "Hi, I'd like a quote for a clean.")} target="_blank" rel="noopener noreferrer">
                    Message on WhatsApp
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href={telLink(phone)}>Call {phone}</a>
                </Button>
                <Button asChild variant="ghost" size="lg">
                  <Link href={signedIn ? (isAdmin ? "/admin" : "/dashboard") : "/sign-in"}>
                    {signedIn ? "Go to your bookings" : "Sign in"}
                  </Link>
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
