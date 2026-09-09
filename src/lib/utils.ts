import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** £350 → "£350", £25.50 → "£25.50". Never shows trailing ".00". */
export function formatMoney(value: number | string | null | undefined, currency = "GBP") {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return null;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatDate(date: Date | string, opts: Intl.DateTimeFormatOptions = {}) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...opts,
  }).format(d);
}

export function formatDateTime(date: Date | string) {
  return formatDate(date, { hour: "2-digit", minute: "2-digit" });
}

/** Booking references people can read down the phone: SF-7K2QD4 */
export function generateReference() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `SF-${out}`;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Strips spaces and a leading 0/+ so wa.me links always work. */
export function toWhatsAppNumber(raw: string) {
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.startsWith("44")) return digits;
  if (digits.startsWith("0")) return `44${digits.slice(1)}`;
  return digits;
}

export function whatsappLink(number: string, message?: string) {
  const base = `https://wa.me/${toWhatsAppNumber(number)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function telLink(raw: string) {
  const digits = raw.replace(/[^0-9+]/g, "");
  return `tel:${digits}`;
}

/** Loose UK postcode check — permissive on purpose so we never block a real enquiry. */
export function looksLikeUkPostcode(value: string) {
  return /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(value.trim());
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function truncate(text: string, length = 140) {
  return text.length <= length ? text : `${text.slice(0, length - 1).trimEnd()}…`;
}
