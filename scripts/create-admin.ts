/**
 * Create or promote an admin account. Idempotent — running it again for the
 * same email updates the password/role instead of failing.
 *
 *   npm run create-admin -- <email> <password> [name]
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const [email, password, name] = args;

  if (!email || !password || !EMAIL_RE.test(email)) {
    console.error("Usage: npm run create-admin -- <email> <password> [name]");
    console.error(`Got: ${JSON.stringify(args)}`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: { role: "ADMIN", passwordHash },
    create: {
      email: normalizedEmail,
      name: name ?? "Admin",
      role: "ADMIN",
      passwordHash,
    },
  });

  console.log(`Admin ready: ${user.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
