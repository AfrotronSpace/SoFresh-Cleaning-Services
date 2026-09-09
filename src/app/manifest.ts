import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — ${SITE.tagline}`,
    short_name: "So Fresh",
    description:
      "Premium, detail-led cleaning across Essex and Suffolk. Restoration deep cleans, end-of-tenancy, after-builders and commercial cleaning.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0d3b2a",
    lang: "en-GB",
    categories: ["business", "lifestyle"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Request a booking", short_name: "Book", url: "/book" },
      { name: "Our services", short_name: "Services", url: "/services" },
      { name: "Contact us", short_name: "Contact", url: "/contact" },
    ],
  };
}
