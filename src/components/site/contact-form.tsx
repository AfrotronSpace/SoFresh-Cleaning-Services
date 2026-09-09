"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";

const SUBJECTS = [
  "I'd like a quote",
  "Question about a booking",
  "Commercial or office cleaning",
  "Something else",
];

export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    postcode: "",
    subject: SUBJECTS[0],
    message: "",
    company: "",
  });

  const set = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setState("sending");
    setErrors({});

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).catch(() => null);

    if (!res) {
      setErrors({ form: "We couldn't reach the server. Please try WhatsApp instead." });
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
      <div className="rounded-2xl border border-border bg-white p-8 md:p-10">
        <span className="inline-flex size-11 items-center justify-center rounded-full bg-champagne-soft">
          <Check className="size-5 text-forest" strokeWidth={2.5} />
        </span>
        <h2 className="mt-5 font-display text-2xl">Message sent</h2>
        <p className="mt-3 max-w-[52ch] text-[0.9375rem] leading-relaxed text-sage">
          Thank you for contacting So Fresh Cleaning Service. We&rsquo;ve received your enquiry and a member of our team will be in
          touch shortly. If you&rsquo;ve requested a quote, we may ask for a few extra details, photos or a short video so we can
          give you an accurate, tailored price.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor="name" required error={errors.name}>
          <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" aria-invalid={Boolean(errors.name)} />
        </Field>
        <Field label="Phone" htmlFor="phone" error={errors.phone}>
          <Input id="phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" />
        </Field>
        <Field label="Email" htmlFor="email" required error={errors.email}>
          <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" aria-invalid={Boolean(errors.email)} />
        </Field>
        <Field label="Postcode" htmlFor="postcode" hint="Helps us confirm we cover you." error={errors.postcode}>
          <Input id="postcode" value={form.postcode} onChange={(e) => set("postcode", e.target.value.toUpperCase())} autoComplete="postal-code" />
        </Field>
      </div>

      <Field label="What's this about?" required error={errors.subject}>
        <div className="flex flex-wrap gap-2.5">
          {SUBJECTS.map((subject) => (
            <button
              key={subject}
              type="button"
              onClick={() => set("subject", subject)}
              aria-pressed={form.subject === subject}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                form.subject === subject
                  ? "border-forest bg-forest text-white"
                  : "border-border bg-white text-sage hover:border-forest/40 hover:text-forest"
              }`}
            >
              {subject}
            </button>
          ))}
        </div>
      </Field>

      <Field
        label="Your message"
        htmlFor="message"
        required
        hint="Tell us the property, roughly what condition it's in, and when you'd like it done."
        error={errors.message}
      >
        <Textarea
          id="message"
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          className="min-h-[9rem]"
          aria-invalid={Boolean(errors.message)}
        />
      </Field>

      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="contact-company">Company</label>
        <input id="contact-company" tabIndex={-1} autoComplete="off" value={form.company} onChange={(e) => set("company", e.target.value)} />
      </div>

      {errors.form && (
        <p role="alert" className="text-[0.8125rem] font-medium text-destructive">
          {errors.form}
        </p>
      )}

      <Button type="submit" size="lg" disabled={state === "sending"}>
        {state === "sending" && <Loader2 className="size-4 animate-spin" />}
        {state === "sending" ? "Sending" : "Send message"}
      </Button>

      <p className="text-[0.8125rem] leading-relaxed text-sage">
        We use your details only to answer your enquiry and, if it becomes a job, to deliver it. See our{" "}
        <a href="/privacy-policy" className="font-medium text-verdant underline underline-offset-2">privacy policy</a>.
      </p>
    </form>
  );
}
