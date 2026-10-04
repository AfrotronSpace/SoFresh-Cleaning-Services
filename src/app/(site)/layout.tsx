import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { AnnouncementBar } from "@/components/site/announcement-bar";
import { JsonLd } from "@/components/site/json-ld";
import { ScrollReveal } from "@/components/site/scroll-reveal";
import { loadSettings } from "@/lib/settings";
import { getSession } from "@/lib/auth";
import { localBusinessJsonLd } from "@/lib/seo";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, session] = await Promise.all([loadSettings(), getSession()]);

  return (
    <div className="flex min-h-dvh flex-col">
      <JsonLd data={localBusinessJsonLd(settings)} />
      <ScrollReveal />
      {settings.announcementActive && settings.announcementText && (
        <AnnouncementBar text={settings.announcementText} />
      )}
      <SiteHeader
        phone={settings.phone}
        whatsapp={settings.whatsapp}
        email={settings.email}
        openingHours={settings.openingHours}
        signedIn={Boolean(session)}
        isAdmin={session?.role === "ADMIN"}
      />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter
        phone={settings.phone}
        whatsapp={settings.whatsapp}
        email={settings.email}
        areas={settings.serviceAreas}
        openingHours={settings.openingHours}
      />
    </div>
  );
}
