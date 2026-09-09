"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/lib/utils";

export type HeroSlide = { image: string; headline: string; sub: string };

const DURATION = 5600;

/**
 * The one piece of non-user-triggered motion on the site: the headline and
 * its backdrop cross-fade together, so the sentence and the picture always
 * agree. Everything else on the page moves only when someone acts.
 */
export function Hero({ slides, whatsapp }: { slides: HeroSlide[]; whatsapp: string }) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const safeSlides = useMemo(() => (slides.length ? slides : FALLBACK_SLIDES), [slides]);

  useEffect(() => {
    if (reduceMotion || safeSlides.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % safeSlides.length), DURATION);
    return () => clearInterval(timer);
  }, [reduceMotion, safeSlides.length]);

  const slide = safeSlides[index];

  return (
    <section className="relative isolate overflow-hidden bg-forest-deep">
      {/* Backdrop */}
      <div className="absolute inset-0">
        <AnimatePresence initial={false}>
          <motion.div
            key={slide.image}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 1.1 }, scale: { duration: 7, ease: "linear" } }}
            className="absolute inset-0"
          >
            <Image
              src={slide.image}
              alt=""
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-forest-deep via-forest-deep/85 to-forest-deep/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/90 via-transparent to-forest-deep/40" />
      </div>

      <div className="shell relative flex min-h-[34rem] flex-col justify-end pb-12 pt-24 md:min-h-[40rem] md:pb-20 md:pt-32 lg:min-h-[44rem]">
        <div className="max-w-2xl">
          <p className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-champagne-soft/90">
            <span className="inline-flex items-center gap-1" aria-label="Rated five stars on Google">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-3.5 fill-champagne text-champagne" />
              ))}
            </span>
            <span>Five-star rated on Google</span>
          </p>

          <div className="min-h-[9.5rem] md:min-h-[13rem] lg:min-h-[14.5rem]">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.headline}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -10 }}
                transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
              >
                <h1 className="font-display text-[2.25rem] font-medium leading-[1.08] text-white md:text-[3.5rem] lg:text-[4rem]">
                  {slide.headline}
                </h1>
                <p className="mt-4 max-w-lg text-[1.0625rem] leading-relaxed text-white/75 md:mt-5 md:text-lg">
                  {slide.sub}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row md:mt-10">
            <Button asChild size="lg" variant="whatsapp" className="sm:w-auto">
              <a
                href={whatsappLink(whatsapp, "Hi, I'd like a quote for a clean. Here are some photos of the property:")}
                target="_blank"
                rel="noopener noreferrer"
              >
                Send photos on WhatsApp
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              className="border border-white/25 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
            >
              <Link href="/services">Browse the service list</Link>
            </Button>
          </div>

          <p className="mt-5 text-sm text-white/55">
            No payment is ever taken through this website. We quote, you approve, then we agree payment directly.
          </p>
        </div>

        {safeSlides.length > 1 && (
          <div className="mt-10 flex items-center gap-2.5" role="tablist" aria-label="Hero slides">
            {safeSlides.map((s, i) => (
              <button
                key={s.headline}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={s.headline}
                onClick={() => setIndex(i)}
                className="group h-1 w-10 rounded-full bg-white/20 transition-colors hover:bg-white/40 md:w-14"
              >
                <span
                  className={`block h-full rounded-full bg-champagne transition-all duration-500 ${
                    i === index ? "w-full" : "w-0"
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export const FALLBACK_SLIDES: HeroSlide[] = [
  {
    image: "/images/hero-kitchen.jpg",
    headline: "Some properties need more than a clean.",
    sub: "Our restoration deep clean is a team, a full day, and a methodical route through every surface — for homes that have got beyond a normal tidy-up.",
  },
  {
    image: "/images/hero-bathroom.jpg",
    headline: "Get the deposit back in full.",
    sub: "End of tenancy cleans finished to the standard letting agents actually inspect against, across Colchester, Ipswich and Braintree.",
  },
  {
    image: "/images/hero-window.jpg",
    headline: "Handed over, not just hoovered.",
    sub: "After the builders leave, we take out the dust that settles twice — then check it again before you see it.",
  },
];
