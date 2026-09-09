import type { Metadata } from "next";
import { PageHeader, EmptyState } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Enquiries", robots: { index: false, follow: false } };

export default async function AdminEnquiriesPage() {
  await requireAdmin();
  const enquiries = await prisma.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <>
      <PageHeader
        title="Enquiries"
        description="Messages sent through the contact page. These aren't bookings — they're questions."
      />

      {enquiries.length === 0 ? (
        <EmptyState title="No enquiries yet" body="Anything sent through the contact form lands here." />
      ) : (
        <ul className="space-y-4">
          {enquiries.map((enquiry) => (
            <li key={enquiry.id} className="rounded-2xl border border-border bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{enquiry.subject}</p>
                  <p className="mt-1 text-sm text-sage">
                    {enquiry.name} · {enquiry.email}
                    {enquiry.phone ? ` · ${enquiry.phone}` : ""}
                    {enquiry.postcode ? ` · ${enquiry.postcode}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <Badge variant={enquiry.status === "NEW" ? "warn" : "neutral"}>{enquiry.status.toLowerCase()}</Badge>
                  <span className="text-sm text-sage">{formatDateTime(enquiry.createdAt)}</span>
                </div>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-sage">{enquiry.message}</p>

              <div className="mt-5 flex flex-wrap gap-4 text-sm">
                <a
                  href={`mailto:${enquiry.email}?subject=${encodeURIComponent(`Re: ${enquiry.subject}`)}`}
                  className="font-medium text-verdant underline underline-offset-4"
                >
                  Reply by email
                </a>
                {enquiry.phone && (
                  <a
                    href={`https://wa.me/${enquiry.phone.replace(/[^0-9]/g, "").replace(/^0/, "44")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-verdant underline underline-offset-4"
                  >
                    Reply on WhatsApp
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
