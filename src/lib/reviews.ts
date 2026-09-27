/** Browser-safe review types and helpers. No Prisma client imports here. */

export type ReviewStatus = "PENDING" | "APPROVED" | "HIDDEN";
export type ReviewSource = "GOOGLE" | "WEBSITE";

export type PublicReview = {
  id: string;
  authorName: string;
  area: string | null;
  body: string;
  rating: number;
  source: ReviewSource;
  job: { id: string; title: string } | null;
};

export const REVIEW_STATUS: Record<ReviewStatus, { label: string; tone: "warn" | "good" | "neutral" }> = {
  PENDING: { label: "Waiting for approval", tone: "warn" },
  APPROVED: { label: "Live", tone: "good" },
  HIDDEN: { label: "Hidden", tone: "neutral" },
};

export const REVIEW_SOURCE: Record<ReviewSource, string> = {
  GOOGLE: "Google",
  WEBSITE: "Our website",
};

export const REVIEWS_PAGE_SIZE = 24;

/** "nicola  roberts-smith" → "Nicola R." — first name + initial is the default attribution (BUSINESS-RULES.md, G1). */
export function publicName(raw: string) {
  const parts = raw.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const first = cap(parts[0]);
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  return last ? `${first} ${last.charAt(0).toUpperCase()}.` : first;
}
