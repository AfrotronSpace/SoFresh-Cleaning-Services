"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import {
  ACCESS_LABELS,
  CONDITION_LABELS,
  CONTACT_PREFERENCE_LABELS,
  OCCUPANCY_LABELS,
  PROPERTY_KINDS,
  URGENCY_LABELS,
} from "@/lib/constants";
import { cn, formatMoney, looksLikeUkPostcode } from "@/lib/utils";

export type WizardService = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  price: string | null;
  priceMode: "FROM" | "PER_HOUR" | "FIXED" | "QUOTE_ONLY";
  negotiable: boolean;
  requiresSurvey: boolean;
  extras: { name: string; note?: string }[];
};

type Prefill = { name?: string; email?: string; phone?: string; postcode?: string; addressLine1?: string; city?: string };

type Selection = { serviceId: string; extras: string[] };

const STEPS = [
  { id: "services", title: "What needs doing" },
  { id: "property", title: "About the property" },
  { id: "when", title: "Where and when" },
  { id: "access", title: "Access and details" },
  { id: "you", title: "Your details" },
  { id: "review", title: "Check and send" },
] as const;

const today = new Date().toISOString().slice(0, 10);

export function BookingWizard({
  services,
  preselectedSlug,
  prefill,
  cancellationHours,
  bookingFeeNote,
}: {
  services: WizardService[];
  preselectedSlug?: string;
  prefill?: Prefill;
  cancellationHours: number;
  bookingFeeNote: string;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const preselected = services.find((s) => s.slug === preselectedSlug);

  const [selections, setSelections] = useState<Selection[]>(
    preselected ? [{ serviceId: preselected.id, extras: [] }] : [],
  );
  const [customMode, setCustomMode] = useState(false);
  const [form, setForm] = useState({
    customBrief: "",
    propertyKind: "HOUSE",
    bedrooms: "",
    bathrooms: "",
    occupancy: "OCCUPIED",
    condition: "UNKNOWN",
    addressLine1: prefill?.addressLine1 ?? "",
    addressLine2: "",
    city: prefill?.city ?? "",
    postcode: prefill?.postcode ?? "",
    preferredDate: "",
    alternativeDate: "",
    timePreference: "flexible",
    datesFlexible: false,
    urgency: "STANDARD",
    accessMethod: "CUSTOMER_HOME",
    parkingNotes: "",
    petsOnSite: false,
    allergyNotes: "",
    notes: "",
    contactName: prefill?.name ?? "",
    contactEmail: prefill?.email ?? "",
    contactPhone: prefill?.phone ?? "",
    contactPreference: "WHATSAPP",
    marketingOptIn: false,
    acceptedTerms: false,
    company: "", // honeypot
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const chosen = useMemo(
    () =>
      selections
        .map((sel) => ({ ...sel, service: services.find((s) => s.id === sel.serviceId) }))
        .filter((x): x is Selection & { service: WizardService } => Boolean(x.service)),
    [selections, services],
  );

  const anyRequiresSurvey = chosen.some((c) => c.service.requiresSurvey);

  function toggleService(id: string) {
    setSelections((prev) =>
      prev.some((s) => s.serviceId === id)
        ? prev.filter((s) => s.serviceId !== id)
        : [...prev, { serviceId: id, extras: [] }],
    );
    setErrors((prev) => {
      const next = { ...prev };
      delete next.items;
      return next;
    });
  }

  function toggleExtra(serviceId: string, extra: string) {
    setSelections((prev) =>
      prev.map((s) =>
        s.serviceId === serviceId
          ? { ...s, extras: s.extras.includes(extra) ? s.extras.filter((e) => e !== extra) : [...s.extras, extra] }
          : s,
      ),
    );
  }

  function validateStep(index: number) {
    const next: Record<string, string> = {};
    if (index === 0) {
      if (customMode) {
        if (form.customBrief.trim().length < 20) next.customBrief = "Give us a couple of sentences so we can price it";
      } else if (selections.length === 0) {
        next.items = "Choose at least one service, or describe the job yourself";
      }
    }
    if (index === 2) {
      if (!form.postcode.trim()) next.postcode = "We need a postcode to check we cover you";
      else if (!looksLikeUkPostcode(form.postcode)) next.postcode = "That doesn't look like a UK postcode";
      if (!form.preferredDate) next.preferredDate = "Choose the date you'd like";
    }
    if (index === 4) {
      if (form.contactName.trim().length < 2) next.contactName = "Enter your name";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.contactEmail)) next.contactEmail = "Enter a valid email address";
      if (form.contactPhone.replace(/[^0-9]/g, "").length < 7) next.contactPhone = "Enter a phone number we can reach you on";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  async function submit() {
    if (!form.acceptedTerms) {
      setErrors({ acceptedTerms: "Please accept the booking terms to continue" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: customMode
            ? []
            : selections.map((s) => ({ serviceId: s.serviceId, quantity: 1, extras: s.extras })),
          isCustom: customMode,
          customBrief: customMode ? form.customBrief : undefined,
          propertyKind: form.propertyKind,
          bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
          bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
          occupancy: form.occupancy,
          condition: form.condition,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2,
          city: form.city,
          postcode: form.postcode,
          preferredDate: form.preferredDate,
          alternativeDate: form.alternativeDate,
          timePreference: form.timePreference,
          datesFlexible: form.datesFlexible,
          urgency: form.urgency,
          accessMethod: form.accessMethod,
          parkingNotes: form.parkingNotes,
          petsOnSite: form.petsOnSite,
          allergyNotes: form.allergyNotes,
          notes: form.notes,
          contactName: form.contactName,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone,
          contactPreference: form.contactPreference,
          marketingOptIn: form.marketingOptIn,
          acceptedTerms: true,
          company: form.company,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.fieldErrors) setErrors(data.fieldErrors);
        toast.error(data.error ?? "We couldn't send that. Please try again or message us on WhatsApp.");
        setSubmitting(false);
        return;
      }
      router.push(`/booking-received/${data.reference}`);
    } catch {
      toast.error("Something went wrong sending your request. Please try WhatsApp instead.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <StepIndicator step={step} onJump={(i) => i < step && setStep(i)} />

      <div className="mt-8 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={STEPS[step].id}
            initial={{ opacity: 0, x: reduceMotion ? 0 : 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduceMotion ? 0 : -24 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          >
            <h2 className="font-display text-2xl font-medium md:text-[1.75rem]">{STEPS[step].title}</h2>

            {/* ---------------------------------------------- 1. services */}
            {step === 0 && (
              <div className="mt-6 space-y-6">
                <p className="max-w-[62ch] text-[0.9375rem] leading-relaxed text-sage">
                  Pick everything you need. Choosing more than one is fine — we price the whole visit together.
                </p>

                <div className="grid gap-3">
                  {services.map((service) => {
                    const active = selections.some((s) => s.serviceId === service.id);
                    const selection = selections.find((s) => s.serviceId === service.id);
                    return (
                      <div
                        key={service.id}
                        className={cn(
                          "rounded-xl border transition-colors",
                          active ? "border-forest bg-mist/60" : "border-border bg-white hover:border-forest/30",
                          customMode && "pointer-events-none opacity-40",
                        )}
                      >
                        <label className="flex cursor-pointer items-start gap-3.5 p-4 md:p-5">
                          <Checkbox
                            checked={active}
                            onCheckedChange={() => toggleService(service.id)}
                            className="mt-0.5"
                            aria-describedby={`${service.id}-summary`}
                          />
                          <span className="flex-1">
                            <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                              <span className="font-display text-lg font-medium text-ink">{service.name}</span>
                              {service.negotiable && <Badge variant="accent">Negotiable</Badge>}
                              {service.requiresSurvey && <Badge variant="outline">Assessment first</Badge>}
                            </span>
                            <span id={`${service.id}-summary`} className="mt-1.5 block text-[0.9375rem] leading-relaxed text-sage">
                              {service.summary}
                            </span>
                            <span className="mt-2 block text-sm font-semibold text-forest">
                              {service.priceMode === "QUOTE_ONLY" || !service.price
                                ? "Priced once we've seen it"
                                : service.priceMode === "PER_HOUR"
                                  ? `${formatMoney(service.price)} per hour`
                                  : service.priceMode === "FROM"
                                    ? `from ${formatMoney(service.price)}`
                                    : formatMoney(service.price)}
                            </span>
                          </span>
                        </label>

                        {active && service.extras.length > 0 && (
                          <div className="border-t border-border/70 px-4 pb-4 pt-3.5 md:px-5">
                            <p className="text-sm font-medium text-ink">Add anything else you&rsquo;d like included</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {service.extras.map((extra) => {
                                const on = selection?.extras.includes(extra.name);
                                return (
                                  <button
                                    key={extra.name}
                                    type="button"
                                    onClick={() => toggleExtra(service.id, extra.name)}
                                    aria-pressed={on}
                                    className={cn(
                                      "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                                      on
                                        ? "border-forest bg-forest text-white"
                                        : "border-border bg-white text-sage hover:border-forest/40 hover:text-forest",
                                    )}
                                  >
                                    {extra.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {errors.items && (
                  <p role="alert" className="text-[0.8125rem] font-medium text-destructive">
                    {errors.items}
                  </p>
                )}

                <div className="rounded-xl border border-dashed border-champagne/70 bg-champagne-soft/20 p-4 md:p-5">
                  <label className="flex cursor-pointer items-start gap-3.5">
                    <Checkbox
                      checked={customMode}
                      onCheckedChange={(v) => {
                        setCustomMode(Boolean(v));
                        if (v) setSelections([]);
                      }}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="block font-medium text-ink">None of these quite fit</span>
                      <span className="mt-1 block text-[0.9375rem] leading-relaxed text-sage">
                        Describe the job in your own words instead and we&rsquo;ll build a price around it.
                      </span>
                    </span>
                  </label>

                  {customMode && (
                    <div className="mt-4">
                      <Field
                        label="Tell us what needs doing"
                        htmlFor="customBrief"
                        required
                        hint="Rooms, condition, anything unusual, and roughly when you need it."
                        error={errors.customBrief}
                      >
                        <Textarea
                          id="customBrief"
                          value={form.customBrief}
                          onChange={(e) => set("customBrief", e.target.value)}
                          aria-invalid={Boolean(errors.customBrief)}
                          placeholder="Three-bed house that's been empty a while. Kitchen and both bathrooms need the most work…"
                          className="min-h-[9rem]"
                        />
                      </Field>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ---------------------------------------------- 2. property */}
            {step === 1 && (
              <div className="mt-6 space-y-7">
                <Field label="What are we cleaning?" required>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {Object.entries(PROPERTY_KINDS).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => set("propertyKind", value)}
                        aria-pressed={form.propertyKind === value}
                        className={cn(
                          "rounded-lg border px-3.5 py-3 text-left text-sm font-medium transition-colors",
                          form.propertyKind === value
                            ? "border-forest bg-forest text-white"
                            : "border-border bg-white text-sage hover:border-forest/40 hover:text-forest",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Bedrooms" htmlFor="bedrooms" hint="Leave blank if it isn't a home.">
                    <Input
                      id="bedrooms"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={30}
                      value={form.bedrooms}
                      onChange={(e) => set("bedrooms", e.target.value)}
                    />
                  </Field>
                  <Field label="Bathrooms and toilets" htmlFor="bathrooms">
                    <Input
                      id="bathrooms"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={30}
                      value={form.bathrooms}
                      onChange={(e) => set("bathrooms", e.target.value)}
                    />
                  </Field>
                </div>

                <Field label="Is anyone living there at the moment?" required>
                  <RadioGroup value={form.occupancy} onValueChange={(v) => set("occupancy", v)}>
                    {Object.entries(OCCUPANCY_LABELS).map(([value, label]) => (
                      <label key={value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-white px-4 py-3 text-[0.9375rem] transition-colors has-[button[data-state=checked]]:border-forest has-[button[data-state=checked]]:bg-mist/60">
                        <RadioGroupItem value={value} id={`occ-${value}`} />
                        <span>{label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </Field>

                <Field
                  label="How would you describe the condition?"
                  required
                  hint="Be honest — it changes how many cleaners and hours we allocate, and an accurate answer means an accurate price."
                >
                  <RadioGroup value={form.condition} onValueChange={(v) => set("condition", v)}>
                    {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                      <label key={value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-white px-4 py-3 text-[0.9375rem] transition-colors has-[button[data-state=checked]]:border-forest has-[button[data-state=checked]]:bg-mist/60">
                        <RadioGroupItem value={value} id={`cond-${value}`} />
                        <span>{label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </Field>
              </div>
            )}

            {/* ---------------------------------------------- 3. where and when */}
            {step === 2 && (
              <div className="mt-6 space-y-7">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Postcode" htmlFor="postcode" required error={errors.postcode} className="sm:col-span-2 sm:max-w-xs">
                    <Input
                      id="postcode"
                      value={form.postcode}
                      onChange={(e) => set("postcode", e.target.value.toUpperCase())}
                      aria-invalid={Boolean(errors.postcode)}
                      autoComplete="postal-code"
                      placeholder="CO4 3JT"
                    />
                  </Field>
                  <Field label="Address" htmlFor="addressLine1" hint="You can leave this until we've agreed a price.">
                    <Input
                      id="addressLine1"
                      value={form.addressLine1}
                      onChange={(e) => set("addressLine1", e.target.value)}
                      autoComplete="address-line1"
                    />
                  </Field>
                  <Field label="Town or city" htmlFor="city">
                    <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} autoComplete="address-level2" />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Preferred date" htmlFor="preferredDate" required error={errors.preferredDate}>
                    <Input
                      id="preferredDate"
                      type="date"
                      min={today}
                      value={form.preferredDate}
                      onChange={(e) => set("preferredDate", e.target.value)}
                      aria-invalid={Boolean(errors.preferredDate)}
                    />
                  </Field>
                  <Field label="A second date that would also work" htmlFor="alternativeDate">
                    <Input
                      id="alternativeDate"
                      type="date"
                      min={form.preferredDate || today}
                      value={form.alternativeDate}
                      onChange={(e) => set("alternativeDate", e.target.value)}
                    />
                  </Field>
                </div>

                <Field label="Time of day" required>
                  <div className="flex flex-wrap gap-2.5">
                    {["morning", "afternoon", "flexible"].map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => set("timePreference", slot)}
                        aria-pressed={form.timePreference === slot}
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm font-medium capitalize transition-colors",
                          form.timePreference === slot
                            ? "border-forest bg-forest text-white"
                            : "border-border bg-white text-sage hover:border-forest/40 hover:text-forest",
                        )}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </Field>

                <label className="flex cursor-pointer items-start gap-3.5">
                  <Checkbox checked={form.datesFlexible} onCheckedChange={(v) => set("datesFlexible", Boolean(v))} className="mt-0.5" />
                  <span className="text-[0.9375rem] leading-relaxed text-sage">
                    My dates are flexible — offer me whatever suits your diary.
                  </span>
                </label>

                <Field label="How soon do you need this?" required>
                  <RadioGroup value={form.urgency} onValueChange={(v) => set("urgency", v)}>
                    {Object.entries(URGENCY_LABELS).map(([value, label]) => (
                      <label key={value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-white px-4 py-3 text-[0.9375rem] transition-colors has-[button[data-state=checked]]:border-forest has-[button[data-state=checked]]:bg-mist/60">
                        <RadioGroupItem value={value} id={`urg-${value}`} />
                        <span>{label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                  {form.urgency !== "STANDARD" && (
                    <p className="mt-2 rounded-lg bg-champagne-soft/40 px-4 py-3 text-[0.875rem] leading-relaxed text-[#5c4715]">
                      We usually prefer 48–72 hours&rsquo; notice. Short-notice work is often possible, but it may carry a call-out fee, which we always confirm before you commit.
                    </p>
                  )}
                </Field>
              </div>
            )}

            {/* ---------------------------------------------- 4. access */}
            {step === 3 && (
              <div className="mt-6 space-y-7">
                <Field label="How will we get in?" required>
                  <RadioGroup value={form.accessMethod} onValueChange={(v) => set("accessMethod", v)}>
                    {Object.entries(ACCESS_LABELS).map(([value, label]) => (
                      <label key={value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-white px-4 py-3 text-[0.9375rem] transition-colors has-[button[data-state=checked]]:border-forest has-[button[data-state=checked]]:bg-mist/60">
                        <RadioGroupItem value={value} id={`acc-${value}`} />
                        <span>{label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                  <p className="mt-2 text-[0.8125rem] leading-relaxed text-sage">
                    Never send a key-safe code through this form. We&rsquo;ll ask for it directly once your date is confirmed.
                  </p>
                </Field>

                <Field
                  label="Parking"
                  htmlFor="parkingNotes"
                  hint="Permits, restrictions, a shared bay, anything we should know before we arrive with equipment."
                >
                  <Textarea
                    id="parkingNotes"
                    value={form.parkingNotes}
                    onChange={(e) => set("parkingNotes", e.target.value)}
                    className="min-h-[5rem]"
                    placeholder="Resident permit zone, but there's a visitor bay behind the block."
                  />
                </Field>

                <label className="flex cursor-pointer items-start gap-3.5">
                  <Checkbox checked={form.petsOnSite} onCheckedChange={(v) => set("petsOnSite", Boolean(v))} className="mt-0.5" />
                  <span className="text-[0.9375rem] leading-relaxed text-sage">There will be pets in the property.</span>
                </label>

                <Field
                  label="Allergies or product preferences"
                  htmlFor="allergyNotes"
                  hint="Tell us before booking and we'll bring suitable products."
                >
                  <Input
                    id="allergyNotes"
                    value={form.allergyNotes}
                    onChange={(e) => set("allergyNotes", e.target.value)}
                    placeholder="Fragrance-free products please"
                  />
                </Field>

                <Field
                  label="Anything else"
                  htmlFor="notes"
                  hint="The more detail here, the more accurate your price."
                >
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    className="min-h-[7rem]"
                    placeholder="The oven hasn't been cleaned in years and there's limescale in the main shower."
                  />
                </Field>

                <div className="rounded-xl bg-mist p-5">
                  <p className="font-medium text-ink">Photos speed everything up</p>
                  <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-sage">
                    Condition drives the price more than room count does. Once you&rsquo;ve sent this, WhatsApp us a few photos or a short walkthrough video and we can usually price the same day.
                  </p>
                </div>
              </div>
            )}

            {/* ---------------------------------------------- 5. you */}
            {step === 4 && (
              <div className="mt-6 space-y-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Your name" htmlFor="contactName" required error={errors.contactName}>
                    <Input
                      id="contactName"
                      value={form.contactName}
                      onChange={(e) => set("contactName", e.target.value)}
                      aria-invalid={Boolean(errors.contactName)}
                      autoComplete="name"
                    />
                  </Field>
                  <Field label="Phone" htmlFor="contactPhone" required error={errors.contactPhone}>
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={form.contactPhone}
                      onChange={(e) => set("contactPhone", e.target.value)}
                      aria-invalid={Boolean(errors.contactPhone)}
                      autoComplete="tel"
                    />
                  </Field>
                  <Field label="Email" htmlFor="contactEmail" required error={errors.contactEmail} className="sm:col-span-2">
                    <Input
                      id="contactEmail"
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => set("contactEmail", e.target.value)}
                      aria-invalid={Boolean(errors.contactEmail)}
                      autoComplete="email"
                    />
                  </Field>
                </div>

                <Field label="How should we get back to you?" required>
                  <div className="flex flex-wrap gap-2.5">
                    {Object.entries(CONTACT_PREFERENCE_LABELS).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => set("contactPreference", value)}
                        aria-pressed={form.contactPreference === value}
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                          form.contactPreference === value
                            ? "border-forest bg-forest text-white"
                            : "border-border bg-white text-sage hover:border-forest/40 hover:text-forest",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </Field>

                {/* Honeypot — visually and programmatically hidden from people. */}
                <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
                  <label htmlFor="company">Company</label>
                  <input
                    id="company"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.company}
                    onChange={(e) => set("company", e.target.value)}
                  />
                </div>

                <label className="flex cursor-pointer items-start gap-3.5">
                  <Checkbox checked={form.marketingOptIn} onCheckedChange={(v) => set("marketingOptIn", Boolean(v))} className="mt-0.5" />
                  <span className="text-[0.9375rem] leading-relaxed text-sage">
                    Send me occasional offers. We won&rsquo;t pass your details to anyone for marketing.
                  </span>
                </label>
              </div>
            )}

            {/* ---------------------------------------------- 6. review */}
            {step === 5 && (
              <div className="mt-6 space-y-6">
                <div className="rounded-2xl border border-border bg-white">
                  <div className="border-b border-border p-5 md:p-6">
                    <h3 className="font-display text-lg font-medium">
                      {customMode ? "Your description" : "Services"}
                    </h3>
                    {customMode ? (
                      <p className="mt-2.5 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-sage">{form.customBrief}</p>
                    ) : (
                      <ul className="mt-3 space-y-3">
                        {chosen.map(({ service, extras }) => (
                          <li key={service.id}>
                            <span className="flex items-start gap-2.5">
                              <Check className="mt-1 size-4 shrink-0 text-verdant" />
                              <span>
                                <span className="font-medium text-ink">{service.name}</span>
                                {extras.length > 0 && (
                                  <span className="mt-1 block text-sm text-sage">Plus: {extras.join(", ")}</span>
                                )}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <dl className="grid gap-x-8 gap-y-4 p-5 sm:grid-cols-2 md:p-6">
                    <Summary label="Property">
                      {PROPERTY_KINDS[form.propertyKind as keyof typeof PROPERTY_KINDS]}
                      {form.bedrooms && `, ${form.bedrooms} bed`}
                      {form.bathrooms && `, ${form.bathrooms} bath`}
                    </Summary>
                    <Summary label="Condition">{CONDITION_LABELS[form.condition as keyof typeof CONDITION_LABELS]}</Summary>
                    <Summary label="Postcode">{form.postcode}</Summary>
                    <Summary label="Preferred date">
                      {form.preferredDate}
                      {form.datesFlexible && " (flexible)"}
                    </Summary>
                    <Summary label="Access">{ACCESS_LABELS[form.accessMethod as keyof typeof ACCESS_LABELS]}</Summary>
                    <Summary label="Reply by">
                      {CONTACT_PREFERENCE_LABELS[form.contactPreference as keyof typeof CONTACT_PREFERENCE_LABELS]}
                    </Summary>
                  </dl>
                </div>

                <div className="space-y-3 rounded-xl bg-mist p-5 text-[0.9375rem] leading-relaxed text-sage">
                  <p className="font-medium text-ink">What happens next</p>
                  <p>
                    Sending this puts your booking in review. It is a request, not a confirmed appointment — nothing is
                    reserved and no payment is taken until we&rsquo;ve sent your price and you&rsquo;ve accepted it.
                  </p>
                  {anyRequiresSurvey && (
                    <p>
                      One of the services you picked normally needs us to see the property first, so we&rsquo;ll offer you a
                      free assessment rather than a price straight away.
                    </p>
                  )}
                  <p>{bookingFeeNote}</p>
                  <p>
                    Once confirmed, you can move or cancel your date free of charge with at least {cancellationHours} hours&rsquo; notice.
                  </p>
                </div>

                <div>
                  <label className="flex cursor-pointer items-start gap-3.5">
                    <Checkbox
                      checked={form.acceptedTerms}
                      onCheckedChange={(v) => set("acceptedTerms", Boolean(v))}
                      className="mt-0.5"
                      aria-invalid={Boolean(errors.acceptedTerms)}
                    />
                    <span className="text-[0.9375rem] leading-relaxed text-sage">
                      I&rsquo;ve read the{" "}
                      <a href="/booking-terms" target="_blank" className="font-medium text-verdant underline underline-offset-2">
                        booking and cancellation terms
                      </a>{" "}
                      and the{" "}
                      <a href="/privacy-policy" target="_blank" className="font-medium text-verdant underline underline-offset-2">
                        privacy policy
                      </a>
                      .
                    </span>
                  </label>
                  {errors.acceptedTerms && (
                    <p role="alert" className="mt-2 text-[0.8125rem] font-medium text-destructive">
                      {errors.acceptedTerms}
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-10 flex items-center gap-3 border-t border-border pt-6">
        {step > 0 && (
          <Button type="button" variant="ghost" onClick={goBack} disabled={submitting}>
            <ChevronLeft className="size-4" />
            Back
          </Button>
        )}
        <div className="flex-1" />
        {step < STEPS.length - 1 ? (
          <Button type="button" size="lg" onClick={goNext}>
            Continue
          </Button>
        ) : (
          <Button type="button" size="lg" onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting ? "Sending" : "Send booking request"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Summary({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-sage">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink">{children}</dd>
    </div>
  );
}

function StepIndicator({ step, onJump }: { step: number; onJump: (index: number) => void }) {
  return (
    <ol className="flex items-center gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
      {STEPS.map((s, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <li key={s.id} className="flex-1">
            <button
              type="button"
              onClick={() => onJump(i)}
              disabled={!done}
              aria-current={current ? "step" : undefined}
              className="group flex w-full flex-col gap-1.5 text-left disabled:cursor-default"
            >
              <span
                className={cn(
                  "h-1 w-full rounded-full transition-colors",
                  done ? "bg-champagne" : current ? "bg-forest" : "bg-border",
                )}
              />
              <span className={cn("hidden text-xs md:block", current ? "font-medium text-forest" : "text-sage")}>
                {s.title}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
