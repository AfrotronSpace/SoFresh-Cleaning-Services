import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/site/auth-form";
import { getSession } from "@/lib/auth";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildMetadata({ title: "Create an account", path: "/sign-up", noIndex: true });

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const session = await getSession();
  if (session) redirect(session.role === "ADMIN" ? "/admin" : "/dashboard");
  const { next } = await searchParams;
  return <SignUpForm next={next} />;
}
