import Link from "next/link";
import type { Metadata } from "next";
import type { BookingStatus, Prisma } from "@prisma/client";
import { PageHeader, EmptyState } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/site/status-badge";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { BOOKING_STATUS } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bookings", robots: { index: false, follow: false } };

const STATUSES = Object.keys(BOOKING_STATUS) as BookingStatus[];

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdmin();
  const { status, q } = await searchParams;

  const where: Prisma.BookingWhereInput = {};
  if (status && STATUSES.includes(status as BookingStatus)) where.status = status as BookingStatus;
  if (q) {
    where.OR = [
      { reference: { contains: q, mode: "insensitive" } },
      { contactName: { contains: q, mode: "insensitive" } },
      { contactEmail: { contains: q, mode: "insensitive" } },
      { postcode: { contains: q, mode: "insensitive" } },
    ];
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: true },
  });

  return (
    <>
      <PageHeader
        title="Bookings"
        description="Every request that's come through the website, newest first. Open one to send a price or change its status."
      />

      <form className="mb-5 flex flex-wrap gap-2" action="/admin/bookings">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search name, reference, email or postcode"
          className="h-10 w-full max-w-sm rounded-md border border-input bg-white px-3.5 text-[0.9375rem] placeholder:text-sage/70 focus-visible:border-verdant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verdant/25"
        />
        {status && <input type="hidden" name="status" value={status} />}
        <button type="submit" className="h-10 rounded-md bg-forest px-4 text-sm font-medium text-white">
          Search
        </button>
      </form>

      <nav aria-label="Filter by status" className="mb-6 flex flex-wrap gap-2">
        <FilterChip href="/admin/bookings" label="All" active={!status} />
        {STATUSES.map((s) => (
          <FilterChip
            key={s}
            href={`/admin/bookings?status=${s}`}
            label={BOOKING_STATUS[s].label}
            active={status === s}
          />
        ))}
      </nav>

      {bookings.length === 0 ? (
        <EmptyState
          title="Nothing here"
          body={q || status ? "No bookings match that filter. Try clearing it." : "No bookings have come in yet."}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <ul className="divide-y divide-border">
            {bookings.map((booking) => (
              <li key={booking.id}>
                <Link
                  href={`/admin/bookings/${booking.id}`}
                  className="flex flex-wrap items-center gap-x-6 gap-y-2 p-5 transition-colors hover:bg-haze/60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{booking.contactName}</p>
                    <p className="mt-0.5 truncate text-sm text-sage">
                      {booking.items.map((i) => i.nameSnapshot).join(", ") || "Custom job"}
                    </p>
                  </div>
                  <div className="text-sm text-sage">
                    <p className="text-ink">{booking.postcode}</p>
                    <p>{formatDate(booking.preferredDate, { day: "numeric", month: "short" })}</p>
                  </div>
                  <div className="w-24 text-sm">
                    <p className="font-medium text-forest">
                      {booking.quotedTotal ? formatMoney(Number(booking.quotedTotal)) : "—"}
                    </p>
                    <p className="text-sage">{booking.reference}</p>
                  </div>
                  <StatusBadge status={booking.status} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function FilterChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active ? "border-forest bg-forest text-white" : "border-border bg-white text-sage hover:border-forest/40 hover:text-forest",
      )}
    >
      {label}
    </Link>
  );
}
