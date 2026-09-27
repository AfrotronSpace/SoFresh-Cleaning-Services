/**
 * Load Google reviews from scripts/data/google-reviews.json into the reviews
 * table. Safe to run again: rows are matched on Google's review id, so a
 * re-run only refreshes text and rating a customer has since edited — it
 * never touches an admin's status, featured, name or job-link choices.
 *
 *   npm run reviews:import             # new reviews wait for approval
 *   npm run reviews:import -- --approve  # new reviews go straight live
 *
 * Also removes the seeded "[Paste this customer's real …]" placeholders,
 * which these real reviews replace.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

type Row = { googleId: string; authorName: string; rating: number; body: string; postedAbout: string | null };

const prisma = new PrismaClient();
const PLACEHOLDER_PREFIX = "[Paste this customer";

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const approve = args.includes("--approve");
  const file = args.find((arg) => !arg.startsWith("--")) ?? join(__dirname, "data/google-reviews.json");
  const { reviews } = JSON.parse(readFileSync(file, "utf8")) as { reviews: Row[] };

  const bad = reviews.filter((r) => !r.googleId || !r.authorName || !r.body.trim() || !(r.rating >= 1 && r.rating <= 5));
  if (bad.length > 0) {
    console.error("Refusing to import — these rows are incomplete:", bad);
    process.exit(1);
  }

  let created = 0;
  let updated = 0;
  for (const r of reviews) {
    const existing = await prisma.testimonial.findUnique({ where: { externalId: r.googleId }, select: { id: true } });
    if (existing) {
      await prisma.testimonial.update({ where: { id: existing.id }, data: { body: r.body, rating: r.rating } });
      updated += 1;
    } else {
      await prisma.testimonial.create({
        data: {
          externalId: r.googleId,
          authorName: r.authorName,
          rating: r.rating,
          body: r.body,
          source: "GOOGLE",
          status: approve ? "APPROVED" : "PENDING",
          // Google only gives "5 months ago"; this approximate day keeps newest-first ordering right.
          createdAt: r.postedAbout ? new Date(`${r.postedAbout}T12:00:00.000Z`) : undefined,
        },
      });
      created += 1;
    }
  }

  const { count: placeholders } = await prisma.testimonial.deleteMany({
    where: { source: "GOOGLE", externalId: null, body: { startsWith: PLACEHOLDER_PREFIX } },
  });

  console.log(
    `${created} added (${approve ? "live" : "waiting for approval in Admin → Reviews"}), ${updated} refreshed, ${placeholders} placeholder${placeholders === 1 ? "" : "s"} removed.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
