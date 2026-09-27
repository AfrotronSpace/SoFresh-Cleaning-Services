/**
 * Gallery constants and types shared by the browser uploader, the presign
 * route and the server. No SDK imports here, so client components can use it.
 */

import type { PublicReview } from "@/lib/reviews";

export const GALLERY_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const GALLERY_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;
export const GALLERY_ACCEPT = [...GALLERY_IMAGE_TYPES, ...GALLERY_VIDEO_TYPES].join(",");

export const MAX_GALLERY_IMAGE_BYTES = 15 * 1024 * 1024;
/** Served to visitors straight from R2, so keep clips short; WhatsApp exports sit well under this. */
export const MAX_GALLERY_VIDEO_BYTES = 100 * 1024 * 1024;

export const MAX_FRAMES_PER_JOB = 60;
export const GALLERY_PAGE_SIZE = 24;

/** Every gallery object lives under this prefix in the public bucket. */
export const GALLERY_KEY_PATTERN = /^gallery\/(?!.*\.\.)[\w\-./]+$/;

export type GalleryMediaType = "PHOTO" | "VIDEO";
export type GalleryLayout = "SINGLE" | "BEFORE_AFTER";

export function mediaTypeFor(contentType: string): GalleryMediaType | null {
  if ((GALLERY_IMAGE_TYPES as readonly string[]).includes(contentType)) return "PHOTO";
  if ((GALLERY_VIDEO_TYPES as readonly string[]).includes(contentType)) return "VIDEO";
  return null;
}

export function maxBytesFor(type: GalleryMediaType) {
  return type === "VIDEO" ? MAX_GALLERY_VIDEO_BYTES : MAX_GALLERY_IMAGE_BYTES;
}

/** A slot as the public site renders it — URLs already resolved. */
export type PublicSlot = {
  type: GalleryMediaType;
  url: string;
  poster: string | null;
  width: number | null;
  height: number | null;
  alt: string;
};

export type PublicFrame = {
  id: string;
  layout: GalleryLayout;
  primary: PublicSlot;
  secondary: PublicSlot | null;
  caption: string | null;
};

export type PublicJob = {
  id: string;
  title: string;
  description: string | null;
  dateLabel: string | null;
  area: string | null;
  service: { slug: string; name: string } | null;
  frames: PublicFrame[];
  /** Approved reviews of this job. */
  reviews: Omit<PublicReview, "job">[];
};

/** A slot as the admin editor holds it: the key is what's saved, the URLs are for previews. */
export type EditorSlot = {
  type: GalleryMediaType;
  key: string;
  url: string;
  poster: string | null;
  posterUrl: string | null;
  width: number | null;
  height: number | null;
  alt: string;
};

/** An unsorted upload in the inbox, as the admin grid renders it. */
export type InboxItem = EditorSlot & { id: string; name: string };

/** Keys are `gallery/YYYY/MM/<uuid>-<name>`; this recovers `<name>`. */
export function displayNameFromKey(key: string) {
  const last = key.split("/").pop() ?? key;
  return /^[0-9a-f-]{36}-/i.test(last) ? last.slice(37) : last;
}

export type EditorFrame = {
  layout: GalleryLayout;
  primary: EditorSlot;
  secondary: EditorSlot | null;
  caption: string;
};
