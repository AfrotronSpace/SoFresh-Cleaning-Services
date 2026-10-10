import { prisma } from "@/lib/prisma";
import { loadSettings } from "@/lib/settings";
import { buildFaqs, type HourlyRate } from "@/lib/content";

/** Active services with an hourly rate. Empty if there are none, or if the database is down. */
async function getHourlyRates(): Promise<HourlyRate[]> {
  const rows = await prisma.service
    .findMany({
      where: { active: true, priceMode: "PER_HOUR", price: { not: null } },
      orderBy: { sortOrder: "asc" },
      select: { name: true, price: true },
    })
    .catch(() => []);
  return rows.flatMap((row) => (row.price ? [{ name: row.name, price: row.price.toString() }] : []));
}

/**
 * The Help Centre, built from the live settings and the live hourly rate, so it
 * can never disagree with the booking terms or the service pages.
 */
export async function loadFaqs() {
  const [settings, hourlyRates] = await Promise.all([loadSettings(), getHourlyRates()]);
  return buildFaqs(settings, hourlyRates);
}
