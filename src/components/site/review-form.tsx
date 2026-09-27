"use client";

import { useId, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { StarInput } from "@/components/site/star-input";
import { publicName } from "@/lib/reviews";

export type ReviewFormDefaults = { name: string; email: string };

export function ReviewForm({
  job,
  defaults,
  areas = [],
}: {
  /** The gallery job being reviewed, when the form is opened from one. */
  job?: { id: string; title: string } | null;
  defaults?: ReviewFormDefaults | null;
  areas?: string[];
}) {
  const uid = useId();
  const id = (field: string) => `${uid}-${field}`;
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    rating: 0,
    body: "",
    name: defaults?.name ?? "",
    email: defaults?.email ?? "",
    area: "",
    consent: false,
    company: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setState("sending");
    setErrors({});

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, jobId: job?.id ?? "" }),
    }).catch(() => null);

    if (!res) {
      setErrors({ form: "We couldn't reach the server. Please try again in a moment." });
      setState("idle");
      return;
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrors(data.fieldErrors ?? { form: data.error ?? "Something went wrong. Please try again." });
      setState("idle");
      return;
    }

    setState("sent");
  }

  if (state === "sent") {
    return (
      <div role="status" className="rounded-2xl border border-border bg-white p-6 md:p-8">
        <span className="inline-flex size-11 items-center justify-center rounded-full bg-champagne-soft">
          <Check className="size-5 text-forest" strokeWidth={2.5} />
        </span>
        <h3 className="mt-5 font-display text-2xl">Thank you for your review</h3>
        <p className="mt-3 max-w-[52ch] text-[0.9375rem] leading-relaxed text-sage">
          We&rsquo;ve got it. Every review is read by us before it goes on the website, so yours will appear once
          we&rsquo;ve checked it.
        </p>
      </div>
    );
  }

  const shownAs = publicName(form.name);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {job && (
        <p className="rounded-lg bg-mist px-4 py-3 text-sm text-forest">
          Reviewing: <strong className="font-semibold">{job.title}</strong>
        </p>
      )}

      <Field label="Your rating" required error={errors.rating}>
        <StarInput name="rating" idPrefix={id("rating")} value={form.rating} onChange={(v) => set("rating", v)} invalid={Boolean(errors.rating)} />
      </Field>

      <Field label="Your review" htmlFor={id("body")} required hint="What was the job, and how did it go?" error={errors.body}>
        <Textarea
          id={id("body")}
          value={form.body}
          onChange={(e) => set("body", e.target.value)}
          maxLength={2000}
          className="min-h-[8rem]"
          aria-invalid={Boolean(errors.body)}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Your name"
          htmlFor={id("name")}
          required
          hint={shownAs ? `Shown as “${shownAs}”` : "Shown as first name and initial"}
          error={errors.name}
        >
          <Input id={id("name")} value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" maxLength={80} aria-invalid={Boolean(errors.name)} />
        </Field>
        <Field label="Email" htmlFor={id("email")} required hint="Private — never shown" error={errors.email}>
          <Input
            id={id("email")}
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
          />
        </Field>
        <Field label="Town" htmlFor={id("area")} hint="Just the town — never your address" error={errors.area}>
          <Input id={id("area")} value={form.area} onChange={(e) => set("area", e.target.value)} list={id("areas")} maxLength={80} aria-invalid={Boolean(errors.area)} />
          <datalist id={id("areas")}>
            {areas.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </Field>
      </div>

      <div className="space-y-2">
        <label htmlFor={id("consent")} className="flex cursor-pointer items-start gap-3">
          <Checkbox
            id={id("consent")}
            checked={form.consent}
            onCheckedChange={(checked) => set("consent", checked === true)}
            aria-invalid={Boolean(errors.consent)}
            className="mt-0.5"
          />
          <span className="text-[0.9375rem] leading-relaxed text-ink">
            So Fresh can show this review on its website with my first name and initial{form.area ? " and town" : ""}.
          </span>
        </label>
        {errors.consent && (
          <p role="alert" className="text-[0.8125rem] font-medium text-destructive">
            {errors.consent}
          </p>
        )}
      </div>

      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={id("company")}>Company</label>
        <input id={id("company")} tabIndex={-1} autoComplete="off" value={form.company} onChange={(e) => set("company", e.target.value)} />
      </div>

      {(errors.form || errors.jobId) && (
        <p role="alert" className="text-[0.8125rem] font-medium text-destructive">
          {errors.form ?? errors.jobId}
        </p>
      )}

      <Button type="submit" size="lg" disabled={state === "sending"}>
        {state === "sending" && <Loader2 className="size-4 animate-spin" />}
        {state === "sending" ? "Sending" : "Send review"}
      </Button>
    </form>
  );
}
