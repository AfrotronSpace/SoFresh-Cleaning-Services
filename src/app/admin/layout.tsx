import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/auth";
import { signOutAction } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-dvh bg-haze lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="border-b border-border bg-white lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 px-5 py-4 lg:block lg:py-6">
            <Logo />
            <p className="mt-1 hidden text-xs text-sage lg:block">Business dashboard</p>
          </div>

          <AdminNav />

          <div className="hidden border-t border-border p-4 lg:block">
            <p className="truncate text-sm font-medium text-ink">{admin.name || admin.email}</p>
            <p className="truncate text-xs text-sage">{admin.email}</p>
            <div className="mt-3 flex gap-2">
              <Button asChild variant="ghost" size="sm" className="flex-1">
                <Link href="/">Website</Link>
              </Button>
              <form action={signOutAction} className="flex-1">
                <Button type="submit" variant="ghost" size="sm" className="w-full">Sign out</Button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      <main id="main" className="min-w-0 px-5 py-8 md:px-8 md:py-10">{children}</main>
    </div>
  );
}
