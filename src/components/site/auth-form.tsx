"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { signInAction, signUpAction, type AuthState } from "@/app/actions/auth";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? "Just a moment" : label}
    </Button>
  );
}

export function SignInForm({ next }: { next?: string }) {
  const [state, action] = useActionState<AuthState, FormData>(signInAction, {});

  return (
    <div>
      <h1 className="font-display text-[2rem] leading-tight">Welcome back</h1>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-sage">
        Sign in to see your bookings, quotes and confirmed dates.
      </p>

      <form action={action} className="mt-8 space-y-5">
        <input type="hidden" name="next" value={next ?? ""} />

        <Field label="Email" htmlFor="email" required error={state.fieldErrors?.email}>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>

        <Field label="Password" htmlFor="password" required error={state.fieldErrors?.password}>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </Field>

        {state.error && (
          <p role="alert" className="rounded-md bg-[#fbe6e4] px-4 py-3 text-sm font-medium text-[#8f1e17]">
            {state.error}
          </p>
        )}

        <Submit label="Sign in" />
      </form>

      <p className="mt-6 text-[0.9375rem] text-sage">
        No account yet?{" "}
        <Link href="/sign-up" className="font-medium text-verdant underline underline-offset-4">Create one</Link>
      </p>
    </div>
  );
}

export function SignUpForm({ next }: { next?: string }) {
  const [state, action] = useActionState<AuthState, FormData>(signUpAction, {});

  return (
    <div>
      <h1 className="font-display text-[2rem] leading-tight">Create your account</h1>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-sage">
        Optional, but it keeps every booking, quote and date in one place — and the booking form remembers your details next
        time.
      </p>

      <form action={action} className="mt-8 space-y-5">
        <input type="hidden" name="next" value={next ?? ""} />

        <Field label="Your name" htmlFor="name" required error={state.fieldErrors?.name}>
          <Input id="name" name="name" autoComplete="name" required />
        </Field>

        <Field label="Email" htmlFor="email" required error={state.fieldErrors?.email}>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>

        <Field label="Phone" htmlFor="phone" error={state.fieldErrors?.phone}>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" />
        </Field>

        <Field label="Password" htmlFor="password" required hint="At least 8 characters." error={state.fieldErrors?.password}>
          <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
        </Field>

        <label className="flex cursor-pointer items-start gap-3.5">
          <Checkbox name="marketingOptIn" className="mt-0.5" />
          <span className="text-[0.9375rem] leading-relaxed text-sage">
            Send me occasional offers. We never pass your details to anyone else for marketing.
          </span>
        </label>

        {state.error && (
          <p role="alert" className="rounded-md bg-[#fbe6e4] px-4 py-3 text-sm font-medium text-[#8f1e17]">
            {state.error}
          </p>
        )}

        <Submit label="Create account" />
      </form>

      <p className="mt-6 text-[0.9375rem] text-sage">
        Already have one?{" "}
        <Link href="/sign-in" className="font-medium text-verdant underline underline-offset-4">Sign in</Link>
      </p>
      <p className="mt-4 text-[0.8125rem] leading-relaxed text-sage">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2">website terms</Link> and{" "}
        <Link href="/privacy-policy" className="underline underline-offset-2">privacy policy</Link>.
      </p>
    </div>
  );
}
