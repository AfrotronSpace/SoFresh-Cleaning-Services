"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { FileText, HelpCircle, Image as ImageIcon, Loader2, Search, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Panel } from "@/components/admin/page-header";
import { HeroImageField } from "@/components/admin/hero-image-field";
import { GalleryEditor, type GalleryImage } from "@/components/admin/gallery-editor";
import { TagInput, ExtrasEditor, FaqEditor, type ExtraRow, type FaqRow } from "@/components/admin/service-repeaters";
import { IconSelect } from "@/components/admin/icon-select";
import { saveServiceAction, type ActionState } from "@/app/actions/admin";
import { PROPERTY_KINDS, SERVICE_GROUPS } from "@/lib/constants";
import { slugify, cn } from "@/lib/utils";

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
  extras: ExtraRow[];
  durationEstimate: string;
  noticeHours: number;
  requiresSurvey: boolean;
  photosRecommended: boolean;
  icon: string;
  tags: string[];
  heroImage: string;
  images: GalleryImage[];
  faqs: FaqRow[];
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

const SECTIONS = [
  { key: "details", label: "Details", icon: FileText },
  { key: "pricing", label: "Pricing & scope", icon: Tag },
  { key: "photos", label: "Photos", icon: ImageIcon },
  { key: "faqs", label: "FAQs & tags", icon: HelpCircle },
  { key: "seo", label: "SEO", icon: Search },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

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
  const [section, setSection] = useState<SectionKey>("details");

  useEffect(() => {
    if (state.message) toast.success(state.message);
    if (state.error) toast.error(state.error);
  }, [state]);

  // Jump the admin to whichever section actually failed validation.
  useEffect(() => {
    if (!state.fieldErrors) return;
    const keys = Object.keys(state.fieldErrors);
    if (keys.some((k) => ["name", "slug", "summary", "body"].includes(k))) setSection("details");
    else if (keys.some((k) => ["price"].includes(k))) setSection("pricing");
  }, [state.fieldErrors]);

  return (
    <form action={action} className="space-y-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <nav aria-label="Service form sections" className="sticky top-4 z-10 -mx-1 overflow-x-auto px-1 pb-1">
        <ul className="inline-flex items-center gap-1 rounded-xl border border-border bg-white/90 p-1.5 shadow-[var(--shadow-lift)] backdrop-blur">
          {SECTIONS.map(({ key, label, icon: Icon }) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => setSection(key)}
                className={cn(
                  "inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                  section === key ? "bg-forest text-white" : "text-sage hover:bg-mist hover:text-forest",
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className={cn("space-y-6", section !== "details" && "hidden")}>
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

            <Field label="Icon" htmlFor="icon" hint="Shown next to the name in the admin list.">
              <IconSelect name="icon" initial={initial.icon} />
            </Field>

            <Field label="Order in the list" htmlFor="sortOrder" hint="Lower numbers appear first.">
              <Input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={initial.sortOrder} />
            </Field>
          </div>

          <div className="mt-5 space-y-3">
            <Toggle name="featured" defaultChecked={initial.featured} label="Feature this on the homepage" hint="Gets the large tile. Only one service should have this." />
            <Toggle name="active" defaultChecked={initial.active} label="Visible on the website" hint="Turn off to hide it without deleting it." />
          </div>
        </Panel>
      </div>

      <div className={cn("space-y-6", section !== "pricing" && "hidden")}>
        <Panel title="Pricing" description="Be honest here — the figure shown sets the customer's expectation before they enquire.">
          <div className="space-y-5">
            <Field label="How this is priced" required>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {PRICE_MODES.map((mode) => (
                  <label
                    key={mode.value}
                    className={cn(
                      "cursor-pointer rounded-lg border p-4 transition-colors",
                      priceMode === mode.value ? "border-forest bg-mist/60" : "border-border bg-white hover:border-forest/30",
                    )}
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
            <Field label="Optional extras" hint="Customers can tick these while booking. The note is shown in small print, e.g. a price rule.">
              <ExtrasEditor initial={initial.extras.length > 0 ? initial.extras : [{ name: "", note: "" }]} />
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
      </div>

      <div className={cn("space-y-6", section !== "photos" && "hidden")}>
        <Panel title="Header image" description="Shows behind the page title and in social previews. One photo.">
          <HeroImageField folder={slug || "draft"} initialUrl={initial.heroImage} />
        </Panel>

        <Panel title="Gallery" description="Before/afters and completed-job shots. Shown in order on the service page.">
          <GalleryEditor folder={slug || "draft"} initial={initial.images} />
        </Panel>
      </div>

      <div className={cn("space-y-6", section !== "faqs" && "hidden")}>
        <Panel title="Keyword tags" description="Search terms customers actually use — shown as chips on the service page.">
          <TagInput initial={initial.tags} />
        </Panel>

        <Panel title="Frequently asked questions" description="Specific to this service. Shows as an accordion under the description.">
          <FaqEditor initial={initial.faqs} />
        </Panel>
      </div>

      <div className={cn("space-y-6", section !== "seo" && "hidden")}>
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
      </div>

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
