import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { ServiceForm } from "@/components/admin/service-form";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Add a service", robots: { index: false, follow: false } };

export default async function NewServicePage() {
  await requireAdmin();

  return (
    <>
      <PageHeader
        title="Add a service"
        description="It appears in the catalogue and the booking form as soon as you publish it."
        action={
          <Button asChild variant="ghost">
            <Link href="/admin/services">Cancel</Link>
          </Button>
        }
      />
      <div className="max-w-3xl">
        <ServiceForm
          initial={{
            name: "", slug: "", summary: "", body: "",
            group: "SIGNATURE", propertyKind: "HOUSE",
            priceMode: "QUOTE_ONLY", price: "", negotiable: false, minimumCharge: "",
            includes: "", excludes: "", extras: [],
            durationEstimate: "", noticeHours: 48,
            requiresSurvey: false, photosRecommended: true,
            icon: "", tags: [],
            heroImage: "", images: [], faqs: [],
            whatsappPrompt: "",
            featured: false, active: true, sortOrder: 100,
            seoTitle: "", seoDescription: "",
          }}
        />
      </div>
    </>
  );
}
