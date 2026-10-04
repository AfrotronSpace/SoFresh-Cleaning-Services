"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, MessageCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sparkle } from "@/components/site/ornaments";
import { whatsappLink } from "@/lib/utils";

export type HeroSlide = { image: string; headline: string; sub: string };

const DURATION = 6800;

/**
 * The opening scene. The backdrop cross-fades with a slow push-in and drifts
 * against the scroll; the headline rises out of a mask line by line. Enter
 * motion is CSS (see .hero-line in globals.css) so it plays on first paint,
 * before hydration, and replays whenever a slide remounts. Framer only owns
 * the exit, the backdrop and the parallax.
 *
 * A headline's line breaks are the author's: when there are two or more
 * lines, the last is set in gold italic.
 */
export function Hero({ slides, whatsapp }: { slides: HeroSlide[]; whatsapp: string }) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const safeSlides = useMemo(() => (slides.length ? slides : FALLBACK_SLIDES), [slides]);
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const backdropY = useTransform(scrollYProgress, [0, 1], ["0%", reduceMotion ? "0%" : "14%"]);
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", reduceMotion ? "0%" : "-8%"]);

  useEffect(() => {
    if (reduceMotion || paused || safeSlides.length < 2) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % safeSlides.length), DURATION);
    return () => clearTimeout(timer);
  }, [reduceMotion, paused, safeSlides.length, index]);

  const slide = safeSlides[index];
  const lines = slide.headline.split("\n").map((l) => l.trim()).filter(Boolean);
  // Styles must match between server and client, so reduced motion is not
  // branched on here: the global CSS rule already collapses the animation.
  const autoplay = safeSlides.length > 1;

  return (
    <section
      ref={ref}
      className="relative isolate overflow-hidden bg-onyx"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Backdrop */}
      <motion.div className="absolute inset-x-0 -top-[4%] h-[112%]" style={{ y: backdropY }}>
        <AnimatePresence initial={false}>
          <motion.div
            key={slide.image + index}
            initial={{ opacity: 0, scale: 1.12 }}
            animate={{ opacity: 1, scale: 1.02 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 1.6, ease: [0.22, 1, 0.36, 1] }, scale: { duration: 9, ease: "linear" } }}
            className="absolute inset-0"
          >
            <Image src={slide.image} alt="" fill priority={index === 0} sizes="100vw" className="object-cover" />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Colour depth: emerald wash, a floor of near-black, a warm glow, then the dot texture. */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-onyx via-forest-deep/80 to-forest-deep/10" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-onyx/95 via-transparent to-forest-deep/40" />
      <div
        aria-hidden
        className="absolute -left-40 top-1/4 size-[46rem] animate-drift rounded-full bg-[radial-gradient(closest-side,rgb(31_122_85/0.4),transparent)]"
      />
      <div
        aria-hidden
        className="absolute -right-32 bottom-0 size-[38rem] animate-drift rounded-full bg-[radial-gradient(closest-side,rgb(198_168_107/0.16),transparent)] [animation-delay:-8s]"
      />
      <div aria-hidden className="grain-light absolute inset-0 opacity-70" />
      <div aria-hidden className="pointer-events-none absolute inset-3 hidden rounded-[1.25rem] border border-champagne/20 md:block lg:inset-5" />

      <motion.div
        style={{ y: copyY }}
        className="shell relative flex min-h-[40rem] flex-col justify-end pb-28 pt-24 md:min-h-[46rem] md:pb-36 md:pt-32 lg:min-h-[52rem]"
      >
        <div className="max-w-3xl">
          <p className="hero-fade mb-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.75rem] font-medium uppercase tracking-[0.24em] text-champagne-soft/90">
            <span className="inline-flex items-center gap-1" aria-label="Rated five stars on Google">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-3.5 fill-champagne text-champagne" />
              ))}
            </span>
            <span>Five-star rated on Google</span>
          </p>

          <div className="min-h-[13rem] md:min-h-[17rem] lg:min-h-[20rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={slide.headline}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -14 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1 className="font-display text-[2.75rem] font-medium leading-[1.02] text-white md:text-[4.25rem] lg:text-[5.25rem]">
                  {lines.map((line, i) => {
                    const accent = lines.length > 1 && i === lines.length - 1;
                    return (
                      <span key={line} className="-mb-[0.12em] block overflow-hidden pb-[0.16em]">
                        <span
                          className={accent ? "hero-line text-gold pr-[0.08em] italic" : "hero-line"}
                          style={{ "--i": i } as React.CSSProperties}
                        >
                          {line}
                        </span>
                      </span>
                    );
                  })}
                </h1>
                <p
                  className="hero-fade mt-6 flex max-w-xl items-start gap-4 text-[1.0625rem] leading-relaxed text-white/75 md:mt-7 md:text-[1.1875rem]"
                  style={{ "--i": lines.length + 1 } as React.CSSProperties}
                >
                  <span aria-hidden className="mt-[0.85em] h-px w-10 shrink-0 bg-gold" />
                  <span>{slide.sub}</span>
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="hero-fade mt-9 flex flex-col gap-3 sm:flex-row md:mt-11" style={{ "--i": 4 } as React.CSSProperties}>
            <Button asChild size="lg" variant="whatsapp" className="sm:w-auto">
              <a
                href={whatsappLink(whatsapp, "Hi, I'd like a quote for a clean. Here are some photos of the property:")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle />
                Send photos on WhatsApp
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              className="group border border-champagne/45 bg-white/5 bg-none text-white shadow-none backdrop-blur-md hover:border-champagne hover:bg-white/12 hover:shadow-none"
            >
              <Link href="/services">
                Browse the service list
                <ArrowRight className="transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          <p className="hero-fade mt-6 max-w-xl text-sm leading-relaxed text-white/55" style={{ "--i": 5 } as React.CSSProperties}>
            No payment is ever taken through this website. We quote, you approve, then we agree payment directly.
          </p>
        </div>

        {safeSlides.length > 1 && (
          <div className="hero-fade mt-12 flex items-center gap-4" role="tablist" aria-label="Hero slides" style={{ "--i": 6 } as React.CSSProperties}>
            {safeSlides.map((s, i) => {
              const active = i === index;
              return (
                <button
                  key={s.headline}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={s.headline.replace(/\s*\n\s*/g, " ")}
                  onClick={() => setIndex(i)}
                  className="group flex items-center gap-3 py-2"
                >
                  <span
                    className={`font-display text-lg italic transition-colors duration-500 ${
                      active ? "text-champagne" : "text-white/40 group-hover:text-white/75"
                    }`}
                  >
                    0{i + 1}
                  </span>
                  <span className={`relative block h-px overflow-hidden bg-white/20 transition-[width] duration-700 ${active ? "w-16 md:w-24" : "w-6 md:w-10"}`}>
                    {active && (
                      <span
                        key={`${index}-${paused}`}
                        className="absolute inset-0 origin-left bg-gold"
                        style={autoplay && !paused ? { animation: `hero-progress ${DURATION}ms linear both` } : undefined}
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </motion.div>

      <Sparkle className="absolute right-[9%] top-[18%] hidden size-5 animate-twinkle text-champagne lg:block" />
      <Sparkle className="absolute right-[15%] top-[27%] hidden size-2.5 animate-twinkle text-champagne-soft [animation-delay:-2s] lg:block" />
    </section>
  );
}

export const FALLBACK_SLIDES: HeroSlide[] = [
  {
    image: "/images/hero-kitchen.jpg",
    headline: "Some properties need more than a clean.",
    sub: "Our restoration deep clean is a team working methodically through every surface, edge and fitting until the property is genuinely refreshed and finished.",
  },
  {
    image: "/images/hero-bathroom.jpg",
    headline: "Ready for the inventory check.",
    sub: "End of tenancy cleans worked through to the standard letting agents actually inspect against, across Colchester, Ipswich and Braintree.",
  },
  {
    image: "/images/hero-window.jpg",
    headline: "Handed over, not just hoovered.",
    sub: "After the builders leave, we take out the dust that settles twice — then check it again before you see it.",
  },
];
