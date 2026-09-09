"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { signInSchema, signUpSchema } from "@/lib/validations";
import { authenticate, createSession, destroySession, hashPassword } from "@/lib/auth";

export type AuthState = { error?: string; fieldErrors?: Record<string, string> };

function collect(issues: { path: (string | number)[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export async function signUpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    password: formData.get("password"),
    marketingOptIn: formData.get("marketingOptIn") === "on",
  });

  if (!parsed.success) return { fieldErrors: collect(parsed.error.issues) };

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { fieldErrors: { email: "There's already an account with that email. Try signing in." } };
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      passwordHash: await hashPassword(parsed.data.password),
      marketingOptIn: parsed.data.marketingOptIn ?? false,
    },
  });

  await createSession({ id: user.id, email: user.email, name: user.name, role: user.role });
  redirect(String(formData.get("next") || "/dashboard"));
}

export async function signInAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { fieldErrors: collect(parsed.error.issues) };

  const user = await authenticate(parsed.data.email, parsed.data.password);
  // Deliberately vague: don't reveal which accounts exist.
  if (!user) return { error: "That email and password don't match an account." };

  await createSession(user);
  const next = String(formData.get("next") || "");
  redirect(next || (user.role === "ADMIN" ? "/admin" : "/dashboard"));
}

export async function signOutAction() {
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/");
}
