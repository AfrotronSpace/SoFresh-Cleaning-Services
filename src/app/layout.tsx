import type { Metadata, Viewport } from "next";
import { Fraunces, Public_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SITE } from "@/lib/constants";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-public-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "So Fresh Cleaning Service — restoration deep cleans in Essex & Suffolk",
    template: `%s · ${SITE.name}`,
  },
  description:
    "Premium, detail-led cleaning across Colchester, Ipswich, Braintree and Clacton-on-Sea. Restoration deep cleans, end of tenancy, after-builders and commercial cleaning. Send photos, get a fixed price within 24 hours.",
  applicationName: SITE.name,
  authors: [{ name: SITE.legalName }],
  creator: SITE.legalName,
  publisher: SITE.legalName,
  keywords: [
    "deep clean",
    "end of tenancy cleaning",
    "end of tenancy cleaner",
    "move out clean",
    "move in clean",
    "house deep clean",
    "professional cleaner",
    "cleaner near me",
    "after builders cleaning",
    "one off deep clean",
    "office cleaning",
    "commercial cleaning",
    "oven cleaning",
    "cleaning Colchester",
    "cleaning Ipswich",
    "cleaning Braintree",
    "cleaning Clacton-on-Sea",
  ],
  formatDetection: { telephone: true, email: true, address: false },
  category: "Cleaning services",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: SITE.name,
    url: SITE.url,
  },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.webmanifest",
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0d3b2a" },
    { media: "(prefers-color-scheme: dark)", color: "#07271b" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${fraunces.variable} ${publicSans.variable}`}>
      <body className="min-h-dvh bg-background antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-forest focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to content
        </a>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
