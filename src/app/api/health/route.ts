import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Railway's health check. Deliberately does NOT touch the database.
 *
 * The rest of the site is built to render even when Postgres is unreachable
 * (see loadSettings() and every `.catch(() => [])` on a public page) — a
 * health check that queried the database would contradict that on the one
 * endpoint whose job is to say "is the process alive", and a brief database
 * hiccup would then get the whole container killed and restarted by Railway
 * for no good reason.
 */
export function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
