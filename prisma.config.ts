// Prisma CLI configuration (replaces the deprecated package.json#prisma block).
//
// Once this file exists the Prisma CLI stops loading .env by itself — it
// prints "Prisma config detected, skipping environment variable loading" —
// so dotenv does it here, or `prisma migrate dev` loses DATABASE_URL. On
// Railway there is no .env and this is a no-op: the real variables are
// already in the environment, and dotenv never overrides those.
//
// The Dockerfile copies this into the runtime image because Railway's
// preDeployCommand (`prisma migrate deploy`) runs there.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
