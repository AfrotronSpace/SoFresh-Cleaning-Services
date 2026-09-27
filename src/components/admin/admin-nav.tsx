"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarCheck, Sparkles, Images, Star, Users, Inbox, Send, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Overview", Icon: LayoutDashboard, exact: true },
  { href: "/admin/bookings", label: "Bookings", Icon: CalendarCheck },
  { href: "/admin/services", label: "Services", Icon: Sparkles },
  { href: "/admin/gallery", label: "Gallery", Icon: Images },
  { href: "/admin/reviews", label: "Reviews", Icon: Star },
  { href: "/admin/customers", label: "Customers", Icon: Users },
  { href: "/admin/enquiries", label: "Enquiries", Icon: Inbox },
  { href: "/admin/messages", label: "Messages", Icon: Send },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Dashboard" className="flex-1 overflow-x-auto px-3 pb-3 lg:overflow-visible lg:pb-0">
      <ul className="flex gap-1 lg:flex-col">
        {LINKS.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 whitespace-nowrap rounded-md px-3 py-2.5 text-[0.9375rem] font-medium transition-colors",
                  active ? "bg-mist text-forest" : "text-sage hover:bg-mist/60 hover:text-forest",
                )}
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
