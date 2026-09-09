import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader, EmptyState } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Customers", robots: { index: false, follow: false } };

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const { q } = await searchParams;

  const customers = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
              { postcode: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { _count: { select: { bookings: true } } },
  });

  return (
    <>
      <PageHeader
        title="Customers"
        description="Everyone who has created an account. Guests who booked without signing up appear under Bookings instead."
      />

      <form className="mb-5 flex gap-2" action="/admin/customers">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search name, email or postcode"
          className="h-10 w-full max-w-sm rounded-md border border-input bg-white px-3.5 text-[0.9375rem] placeholder:text-sage/70"
        />
        <button type="submit" className="h-10 rounded-md bg-forest px-4 text-sm font-medium text-white">Search</button>
      </form>

      {customers.length === 0 ? (
        <EmptyState title="No customers yet" body="Accounts are optional, so plenty of bookings arrive without one." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <ul className="divide-y divide-border">
            {customers.map((customer) => (
              <li key={customer.id}>
                <Link
                  href={`/admin/customers/${customer.id}`}
                  className="flex flex-wrap items-center gap-x-6 gap-y-1.5 p-5 transition-colors hover:bg-haze/60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{customer.name}</p>
                    <p className="mt-0.5 truncate text-sm text-sage">{customer.email}</p>
                  </div>
                  <p className="text-sm text-sage">{customer.postcode ?? "—"}</p>
                  <p className="text-sm text-sage">Joined {formatDate(customer.createdAt, { month: "short" })}</p>
                  <Badge variant={customer._count.bookings > 0 ? "good" : "neutral"}>
                    {customer._count.bookings} booking{customer._count.bookings === 1 ? "" : "s"}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
