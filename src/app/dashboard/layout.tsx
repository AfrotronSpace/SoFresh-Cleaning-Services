import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { signOutAction } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();

  return (
    <div className="flex min-h-dvh flex-col bg-haze">
      <header className="border-b border-border bg-white">
        <div className="shell flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <Logo />
            <span className="hidden text-sm text-sage sm:inline">Your bookings</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">Website</Link>
            </Button>
            {session.role === "ADMIN" && (
              <Button asChild variant="subtle" size="sm">
                <Link href="/admin">Admin</Link>
              </Button>
            )}
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm">Sign out</Button>
            </form>
          </div>
        </div>
      </header>
      <main id="main" className="flex-1">{children}</main>
    </div>
  );
}
