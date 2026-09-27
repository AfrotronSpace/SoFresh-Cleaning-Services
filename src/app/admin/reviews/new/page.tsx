import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { AdminReviewForm } from "@/components/admin/review-form";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { loadSettings } from "@/lib/settings";
import { getJobOptions } from "@/lib/review-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Add a review", robots: { index: false, follow: false } };

export default async function NewReviewPage() {
  await requireAdmin("/admin/reviews/new");
  const [jobs, settings] = await Promise.all([getJobOptions(), loadSettings()]);

  return (
    <>
      <PageHeader
        title="Add a Google review"
        description="Copy a review across from your Google Business Profile so it shows on the website too."
        action={
          <Button asChild variant="ghost">
            <Link href="/admin/reviews">Back</Link>
          </Button>
        }
      />
      <div className="max-w-3xl">
        <AdminReviewForm
          jobs={jobs}
          areas={settings.serviceAreas}
          googleUrl={settings.googleReviewUrl}
          initial={{
            authorName: "",
            area: "",
            rating: 5,
            body: "",
            source: "GOOGLE",
            status: "APPROVED",
            jobId: "",
            featured: false,
            sortOrder: 100,
          }}
        />
      </div>
    </>
  );
}
