"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * One observer for every [data-reveal] element on the page.
 *
 * Elements are only hidden ("armed") if they start below the fold when this
 * runs, so nothing that is already on screen flashes, and with no JavaScript
 * — or with reduced motion requested — the page is simply fully visible.
 * Server components opt in with a data attribute; no client wrapper needed.
 */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.revealState = "in";
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.01 },
    );

    const arm = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>("[data-reveal]:not([data-reveal-state])").forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
        el.dataset.revealState = "armed";
        io.observe(el);
      });
    };

    arm(document);

    // Streamed and client-navigated content arrives after this effect.
    const mo = new MutationObserver((records) => {
      if (records.some((r) => r.addedNodes.length)) arm(document);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
