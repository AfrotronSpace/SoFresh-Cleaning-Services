import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings-form";
import { requireAdmin } from "@/lib/auth";
import { loadSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Settings", robots: { index: false, follow: false } };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await loadSettings();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Everything you can change without a developer. Saves take effect on the website immediately."
      />
      <SettingsForm
        smtpConfigured={Boolean(process.env.SMTP_HOST)}
        whatsappApiConfigured={Boolean(process.env.WHATSAPP_ACCESS_TOKEN)}
        initial={{
          businessName: settings.businessName,
          tagline: settings.tagline,
          phone: settings.phone,
          whatsapp: settings.whatsapp,
          email: settings.email,
          serviceAreas: settings.serviceAreas,
          openingHours: settings.openingHours,
          responsePromise: settings.responsePromise,
          quoteWindow: settings.quoteWindow,
          bookingFeeNote: settings.bookingFeeNote,
          cancellationHours: settings.cancellationHours,
          reclaimWindowHours: settings.reclaimWindowHours,
          emailBookingToAdmin: settings.emailBookingToAdmin,
          emailBookingToCustomer: settings.emailBookingToCustomer,
          forwardBookingsToWhatsapp: settings.forwardBookingsToWhatsapp,
          whatsappForwardNumber: settings.whatsappForwardNumber,
          adminNotifyEmail: settings.adminNotifyEmail,
          adminNotifyCc: settings.adminNotifyCc,
          announcementText: settings.announcementText,
          announcementActive: settings.announcementActive,
          googleReviewUrl: settings.googleReviewUrl,
          facebookUrl: settings.facebookUrl,
          instagramUrl: settings.instagramUrl,
          tiktokUrl: settings.tiktokUrl,
        }}
      />
    </>
  );
}
