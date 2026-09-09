import Link from "next/link";
import { Logo } from "@/components/site/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-5 py-8 md:px-10">
        <Logo />
        <main id="main" className="flex flex-1 items-center py-12">
          <div className="mx-auto w-full max-w-md">{children}</div>
        </main>
        <p className="text-sm text-sage">
          <Link href="/" className="hover:text-forest">Back to the website</Link>
        </p>
      </div>

      <aside className="relative hidden overflow-hidden bg-forest-deep lg:block">
        <div className="grain absolute inset-0 opacity-30" />
        <div className="relative flex h-full flex-col justify-end p-12">
          <blockquote className="max-w-md font-display text-[1.75rem] leading-snug text-white">
            &ldquo;Every booking, quote and date in one place — so you never have to dig through WhatsApp to find out what was
            agreed.&rdquo;
          </blockquote>
          <p className="mt-5 text-[0.9375rem] text-champagne-soft/80">Your So Fresh account</p>
        </div>
      </aside>
    </div>
  );
}
