"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Panel } from "@/components/admin/page-header";
import { saveServiceAction, type ActionState } from "@/app/actions/admin";
import { PROPERTY_KINDS, SERVICE_GROUPS } from "@/lib/constants";
import { slugify } from "@/lib/utils";

export type ServiceFormValues = {
  id?: string;
  name: string;
  slug: string;
  summary: string;
  body: string;
  group: string;
  propertyKind: string;
  priceMode: string;
  price: string;
  negotiable: boolean;
  minimumCharge: string;
  includes: string;
  excludes: string;
  extras: string;
  durationEstimate: string;
  noticeHours: number;
  requiresSurvey: boolean;
  photosRecommended: boolean;
  heroImage: string;
  whatsappPrompt: string;
  featured: boolean;
  active: boolean;
  sortOrder: number;
  seoTitle: string;
  seoDescription: string;
};

const PRICE_MODES = [
  { value: "FROM", label: "From a starting price", hint: "Shows as “from £350”." },
  { value: "PER_HOUR", label: "Hourly rate", hint: "Shows as “£25 per hour”." },
  { value: "FIXED", label: "One fixed price", hint: "Shows the exact figure." },
  { value: "QUOTE_ONLY", label: "Quote only", hint: "No figure shown — priced from photos or a visit." },
];

function Save({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? "Saving" : isNew ? "Publish service" : "Save changes"}
    </Button>
  );
}

export function ServiceForm({ initial }: { initial: ServiceFormValues }) {
  const [state, action] = useActionState<ActionState, FormData>(saveServiceAction, {});
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug));
  const [priceMode, setPriceMode] = useState(initial.priceMode);

  useEffect(() => {
    if (state.message) toast.success(state.message);
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={action} className="space-y-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <Panel title="What it is" description="This is the copy customers read on the service page.">
        <div className="space-y-5">
          <Field label="Service name" htmlFor="name" required error={state.fieldErrors?.name}>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              required
            />
          </Field>

          <Field
            label="Web address"
            htmlFor="slug"
            required
            hint={`Appears as /services/${slug || "your-service"}. Changing it breaks any existing links.`}
            error={state.fieldErrors?.slug}
          >
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              required
            />
          </Field>

          <Field
            label="One-line summary"
            htmlFor="summary"
            required
            hint="Shown on the catalogue card and in Google results."
            error={state.fieldErrors?.summary}
          >
            <Textarea id="summary" name="summary" defaultValue={initial.summary} className="min-h-[4.5rem]" required />
          </Field>

          <Field
            label="Full description"
            htmlFor="body"
            required
            hint="Write it as you'd explain it on the phone. Leave a blank line between paragraphs."
            error={state.fieldErrors?.body}
          >
            <Textarea id="body" name="body" defaultValue={initial.body} className="min-h-[14rem]" required />
          </Field>
        </div>
      </Panel>

      <Panel title="Where it sits">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Group" htmlFor="group" required>
            <select
              id="group"
              name="group"
              defaultValue={initial.group}
              className="h-11 w-full rounded-md border border-input bg-white px-3.5 text-[0.9375rem]"
            >
              {Object.entries(SERVICE_GROUPS).map(([value, meta]) => (
                <option key={value} value={value}>{meta.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Mainly for" htmlFor="propertyKind" required>
            <select
              id="propertyKind"
              name="propertyKind"
              defaultValue={initial.propertyKind}
              className="h-11 w-full rounded-md border border-input bg-white px-3.5 text-[0.9375rem]"
            >
              {Object.entries(PROPERTY_KINDS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>

          <Field label="Order in the list" htmlFor="sortOrder" hint="Lower numbers appear first.">
            <Input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={initial.sortOrder} />
          </Field>

          <Field label="Header image" htmlFor="heroImage" hint="A path like /images/deep-clean.jpg, or a full URL.">
            <Input id="heroImage" name="heroImage" defaultValue={initial.heroImage} />
          </Field>
        </div>

        <div className="mt-5 space-y-3">
          <Toggle name="featured" defaultChecked={initial.featured} label="Feature this on the homepage" hint="Gets the large tile. Only one service should have this." />
          <Toggle name="active" defaultChecked={initial.active} label="Visible on the website" hint="Turn off to hide it without deleting it." />
        </div>
      </Panel>

      <Panel title="Pricing" description="Be honest here — the figure shown sets the customer's expectation before they enquire.">
        <div className="space-y-5">
          <Field label="How this is priced" required>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {PRICE_MODES.map((mode) => (
                <label
                  key={mode.value}
                  className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                    priceMode === mode.value ? "border-forest bg-mist/60" : "border-border bg-white hover:border-forest/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="priceMode"
                    value={mode.value}
                    checked={priceMode === mode.value}
                    onChange={() => setPriceMode(mode.value)}
                    className="sr-only"
                  />
                  <span className="block font-medium text-ink">{mode.label}</span>
                  <span className="mt-1 block text-sm text-sage">{mode.hint}</span>
                </label>
              ))}
            </div>
          </Field>

          {priceMode !== "QUOTE_ONLY" && (
            <Field label="Amount in pounds" htmlFor="price" required error={state.fieldErrors?.price}>
              <Input id="price" name="price" type="number" step="0.01" min="0" inputMode="decimal" defaultValue={initial.price} />
            </Field>
          )}
          {priceMode === "QUOTE_ONLY" && <input type="hidden" name="price" value="" />}

          <Toggle
            name="negotiable"
            defaultChecked={initial.negotiable}
            label="Show a “Negotiable” badge"
            hint="Tells customers the price has room to move on this service."
          />

          <Field label="Minimum charge or booking rule" htmlFor="minimumCharge" hint="Free text, e.g. “minimum 3 hours”.">
            <Input id="minimumCharge" name="minimumCharge" defaultValue={initial.minimumCharge} />
          </Field>
        </div>
      </Panel>

      <Panel title="Scope" description="One item per line. This is what stops arguments on the day.">
        <div className="space-y-5">
          <Field label="What's included" htmlFor="includes">
            <Textarea id="includes" name="includes" defaultValue={initial.includes} className="min-h-[9rem]" />
          </Field>
          <Field label="What's not included unless quoted" htmlFor="excludes">
            <Textarea id="excludes" name="excludes" defaultValue={initial.excludes} className="min-h-[7rem]" />
          </Field>
          <Field label="Optional extras" htmlFor="extras" hint="Customers can tick these while booking.">
            <Textarea id="extras" name="extras" defaultValue={initial.extras} className="min-h-[6rem]" />
          </Field>
        </div>
      </Panel>

      <Panel title="Practical details">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="How long it takes" htmlFor="durationEstimate" hint="e.g. “half a day to a full day”.">
            <Input id="durationEstimate" name="durationEstimate" defaultValue={initial.durationEstimate} />
          </Field>
          <Field label="Notice needed, in hours" htmlFor="noticeHours">
            <Input id="noticeHours" name="noticeHours" type="number" min={0} defaultValue={initial.noticeHours} />
          </Field>
        </div>

        <div className="mt-5 space-y-3">
          <Toggle
            name="requiresSurvey"
            defaultChecked={initial.requiresSurvey}
            label="Needs a visit before we can price it"
            hint="Changes the page from “get a price” to “book a free assessment”, so nobody is disappointed."
          />
          <Toggle
            name="photosRecommended"
            defaultChecked={initial.photosRecommended}
            label="Ask for photos or a video"
            hint="Prompts the customer to send them on WhatsApp."
          />
        </div>

        <div className="mt-5">
          <Field
            label="WhatsApp message prefill"
            htmlFor="whatsappPrompt"
            hint="What their message already says when they tap the WhatsApp button on this page."
          >
            <Input
              id="whatsappPrompt"
              name="whatsappPrompt"
              defaultValue={initial.whatsappPrompt}
              placeholder="Hi, I'd like a quote for a So Fresh Restoration Deep Clean."
            />
          </Field>
        </div>
      </Panel>

      <Panel title="Google listing" description="Leave blank and we'll use the name and summary above.">
        <div className="space-y-5">
          <Field label="Page title" htmlFor="seoTitle" hint="Around 60 characters works best.">
            <Input id="seoTitle" name="seoTitle" defaultValue={initial.seoTitle} maxLength={70} />
          </Field>
          <Field label="Description" htmlFor="seoDescription" hint="Around 155 characters.">
            <Textarea id="seoDescription" name="seoDescription" defaultValue={initial.seoDescription} maxLength={180} className="min-h-[5rem]" />
          </Field>
        </div>
      </Panel>

      <div className="flex gap-3">
        <Save isNew={!initial.id} />
      </div>
    </form>
  );
}

function Toggle({ name, defaultChecked, label, hint }: { name: string; defaultChecked: boolean; label: string; hint: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3.5">
      <Checkbox name={name} defaultChecked={defaultChecked} className="mt-0.5" />
      <span>
        <span className="block font-medium text-ink">{label}</span>
        <span className="mt-0.5 block text-sm leading-relaxed text-sage">{hint}</span>
      </span>
    </label>
  );
}
