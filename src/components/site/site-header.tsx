"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Clock, Mail, Menu, MessageCircle, Phone, User, X } from "lucide-react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { Logo } from "@/components/site/logo";
import { cn, telLink, whatsappLink } from "@/lib/utils";

const LINKS = [
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Our work" },
  { href: "/reviews", label: "Reviews" },
  { href: "/areas", label: "Areas we cover" },
  { href: "/help", label: "Help centre" },
  { href: "/contact", label: "Contact" },
];

/**
 * Two tiers: a slim contact bar that scrolls away, then the sticky main bar
 * with the logo and page links only. Contact lives in the top bar at every
 * width, so the mobile menu is links alone.
 */
export function SiteHeader({
  phone,
  whatsapp,
  email,
  openingHours,
  signedIn,
  isAdmin,
}: {
  phone: string;
  whatsapp: string;
  email: string;
  openingHours: string;
  signedIn: boolean;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.4 });

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
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

  const accountHref = signedIn ? (isAdmin ? "/admin" : "/dashboard") : "/sign-in";
  const accountLabel = signedIn ? (isAdmin ? "Admin" : "Your bookings") : "Sign in";

  return (
    <>
      <div className="relative bg-gradient-to-r from-onyx via-forest-deep to-forest text-[0.8125rem] text-white/80">
        <div aria-hidden className="hairline-gold absolute inset-x-0 bottom-0 opacity-50" />
        <div className="shell flex h-10 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-5">
            <a href={telLink(phone)} className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-white transition-colors hover:text-champagne-soft">
              <Phone className="size-3.5" />
              {phone}
            </a>
            <a href={`mailto:${email}`} className="hidden items-center gap-1.5 truncate transition-colors hover:text-white md:inline-flex">
              <Mail className="size-3.5 shrink-0" />
              {email}
            </a>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <span className="hidden items-center gap-1.5 lg:inline-flex">
              <Clock className="size-3.5" />
              {openingHours}
            </span>
            <a
              href={whatsappLink(whatsapp, "Hi, I'd like a quote for a clean.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-b from-[#25a35a] to-[#1a8346] px-3.5 font-medium text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2)] transition-[filter] duration-300 hover:brightness-110"
            >
              <MessageCircle className="size-3.5" />
              <span className="sm:hidden">WhatsApp</span>
              <span className="hidden sm:inline">Message on WhatsApp</span>
            </a>
            <Link
              href={accountHref}
              aria-label={accountLabel}
              className="inline-flex items-center gap-1.5 whitespace-nowrap transition-colors hover:text-white"
            >
              <User className="size-4 md:size-3.5" />
              <span className="hidden md:inline">{accountLabel}</span>
            </Link>
          </div>
        </div>
      </div>

      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-500",
          scrolled || open
            ? "border-border/70 bg-white/85 shadow-[0_12px_40px_-24px_rgb(6_42_29/0.45)] backdrop-blur-xl"
            : "border-transparent bg-white",
        )}
      >
        <div className="shell flex h-16 items-center justify-between gap-6 md:h-[4.5rem]">
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
                    "group relative whitespace-nowrap rounded-md px-3.5 py-2 text-[0.8125rem] font-medium uppercase tracking-[0.14em] transition-colors duration-300",
                    active ? "text-forest" : "text-sage hover:text-forest",
                  )}
                >
                  {link.label}
                  <span
                    className={cn(
                      "absolute inset-x-3.5 bottom-0.5 h-px origin-left bg-gold transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                    )}
                  />
                </Link>
              );
            })}
          </nav>

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

        {/* Reading progress: a gold hairline that fills as the page scrolls. */}
        <motion.div aria-hidden style={{ scaleX: progress }} className="absolute inset-x-0 -bottom-px h-px origin-left bg-gold" />

        <AnimatePresence>
          {open && (
            <motion.div
              id="mobile-nav"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-border bg-white lg:hidden"
            >
              <nav aria-label="Mobile" className="shell flex flex-col py-3">
                {LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={pathname === link.href || pathname.startsWith(`${link.href}/`) ? "page" : undefined}
                    className="border-b border-border/70 py-3.5 font-display text-2xl text-forest last:border-0"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
