"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Field } from "@/components/ui/field";
import { Panel } from "@/components/admin/page-header";
import { saveSettingsAction, type ActionState } from "@/app/actions/admin";

export type SettingsValues = {
  businessName: string; tagline: string; phone: string; whatsapp: string; email: string;
  serviceAreas: string[]; openingHours: string; responsePromise: string; quoteWindow: string;
  bookingFeeNote: string; cancellationHours: number; reclaimWindowHours: number;
  emailBookingToAdmin: boolean; emailBookingToCustomer: boolean;
  forwardBookingsToWhatsapp: boolean; whatsappForwardNumber: string | null;
  adminNotifyEmail: string; adminNotifyCc: string | null; emailReviewToAdmin: boolean;
  announcementText: string | null; announcementActive: boolean;
  googleReviewUrl: string | null; facebookUrl: string | null;
  instagramUrl: string | null; tiktokUrl: string | null;
};

function Save() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? "Saving" : "Save settings"}
    </Button>
  );
}

/** A Switch that also posts a value, since Radix renders a button not an input. */
function SwitchRow({
  name, defaultChecked, label, hint, onChange,
}: {
  name: string; defaultChecked: boolean; label: string; hint: string;
  onChange?: (value: boolean) => void;
}) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <div className="flex items-start justify-between gap-6 py-4">
      <div className="max-w-[52ch]">
        <p className="font-medium text-ink">{label}</p>
        <p className="mt-1 text-sm leading-relaxed text-sage">{hint}</p>
      </div>
      <Switch
        checked={on}
        onCheckedChange={(value) => {
          setOn(value);
          onChange?.(value);
        }}
        aria-label={label}
      />
      {on && <input type="hidden" name={name} value="on" />}
    </div>
  );
}

export function SettingsForm({ initial, emailConfigured, whatsappApiConfigured }: {
  initial: SettingsValues;
  emailConfigured: boolean;
  whatsappApiConfigured: boolean;
}) {
  const [state, action] = useActionState<ActionState, FormData>(saveSettingsAction, {});
  const [forwarding, setForwarding] = useState(initial.forwardBookingsToWhatsapp);

  useEffect(() => {
    if (state.message) toast.success(state.message);
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={action} className="max-w-3xl space-y-6">
      <Panel title="Your business" description="Used across the website, in emails and in your Google listing data.">
        <div className="space-y-5">
          <Field label="Business name" htmlFor="businessName" required error={state.fieldErrors?.businessName}>
            <Input id="businessName" name="businessName" defaultValue={initial.businessName} required />
          </Field>
          <Field label="Tagline" htmlFor="tagline">
            <Input id="tagline" name="tagline" defaultValue={initial.tagline} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Phone number" htmlFor="phone" required hint="Appears in the header and footer.">
              <Input id="phone" name="phone" defaultValue={initial.phone} required />
            </Field>
            <Field
              label="WhatsApp number"
              htmlFor="whatsapp"
              required
              hint="International format without the plus, e.g. 447935772485."
              error={state.fieldErrors?.whatsapp}
            >
              <Input id="whatsapp" name="whatsapp" defaultValue={initial.whatsapp} required />
            </Field>
          </div>
          <Field label="Public email address" htmlFor="email" required error={state.fieldErrors?.email}>
            <Input id="email" name="email" type="email" defaultValue={initial.email} required />
          </Field>
          <Field
            label="Areas you cover"
            htmlFor="serviceAreas"
            hint="One town per line. Each one gets its own page for local searches."
          >
            <Textarea id="serviceAreas" name="serviceAreas" defaultValue={initial.serviceAreas.join("\n")} className="min-h-[8rem]" />
          </Field>
          <Field label="When you work" htmlFor="openingHours">
            <Input id="openingHours" name="openingHours" defaultValue={initial.openingHours} />
          </Field>
        </div>
      </Panel>

      <Panel title="What you promise customers" description="These sentences appear on the website, so only commit to what you can keep.">
        <div className="space-y-5">
          <Field label="How fast you reply" htmlFor="responsePromise">
            <Textarea id="responsePromise" name="responsePromise" defaultValue={initial.responsePromise} className="min-h-[4.5rem]" />
          </Field>
          <Field label="How fast the quote arrives" htmlFor="quoteWindow">
            <Textarea id="quoteWindow" name="quoteWindow" defaultValue={initial.quoteWindow} className="min-h-[4.5rem]" />
          </Field>
          <Field label="How the booking fee works" htmlFor="bookingFeeNote">
            <Textarea id="bookingFeeNote" name="bookingFeeNote" defaultValue={initial.bookingFeeNote} className="min-h-[6rem]" />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Cancellation notice, in hours" htmlFor="cancellationHours" hint="Shown in the booking terms, the Help Centre and the booking page.">
              <Input id="cancellationHours" name="cancellationHours" type="number" min={0} defaultValue={initial.cancellationHours} />
            </Field>
            <Field
              label="Window to report a problem, in hours"
              htmlFor="reclaimWindowHours"
              hint="Counted from when a clean finishes. Shown in the booking terms and the Help Centre."
            >
              <Input id="reclaimWindowHours" name="reclaimWindowHours" type="number" min={0} defaultValue={initial.reclaimWindowHours} />
            </Field>
          </div>
        </div>
      </Panel>

      <Panel
        title="Where bookings go"
        description="Every new booking is always saved here. These switches control what else happens."
      >
        <div className="divide-y divide-border">
          <SwitchRow
            name="emailBookingToCustomer"
            defaultChecked={initial.emailBookingToCustomer}
            label="Email the customer a confirmation"
            hint="Sends the “your booking is in review” message with their reference."
          />
          <SwitchRow
            name="emailBookingToAdmin"
            defaultChecked={initial.emailBookingToAdmin}
            label="Email you every new booking"
            hint="Full details, with a reply-to set to the customer so you can just hit reply."
          />
          <SwitchRow
            name="forwardBookingsToWhatsapp"
            defaultChecked={initial.forwardBookingsToWhatsapp}
            label="Forward new bookings to WhatsApp"
            hint={
              whatsappApiConfigured
                ? "Sends a summary automatically to the number below."
                : "The WhatsApp Cloud API isn't connected, so each booking will give you a one-tap link in the dashboard instead of sending by itself."
            }
            onChange={setForwarding}
          />
          <SwitchRow
            name="emailReviewToAdmin"
            defaultChecked={initial.emailReviewToAdmin}
            label="Email you every new customer review"
            hint="Reviews left on the website wait under Reviews until you approve them, whether or not this is on."
          />
        </div>

        <div className="mt-5 space-y-5 border-t border-border pt-5">
          <Field
            label="Number to forward to"
            htmlFor="whatsappForwardNumber"
            hint="International format without the plus."
            error={state.fieldErrors?.whatsappForwardNumber}
          >
            <Input
              id="whatsappForwardNumber"
              name="whatsappForwardNumber"
              defaultValue={initial.whatsappForwardNumber ?? ""}
              required={forwarding}
              placeholder="447935772485"
            />
          </Field>
          <Field label="Send booking emails to" htmlFor="adminNotifyEmail" required error={state.fieldErrors?.adminNotifyEmail}>
            <Input id="adminNotifyEmail" name="adminNotifyEmail" type="email" defaultValue={initial.adminNotifyEmail} required />
          </Field>
          <Field label="Also copy in" htmlFor="adminNotifyCc" hint="Leave blank if nobody else needs them.">
            <Input id="adminNotifyCc" name="adminNotifyCc" defaultValue={initial.adminNotifyCc ?? ""} />
          </Field>
        </div>

        {!emailConfigured && (
          <p className="mt-5 rounded-lg bg-champagne-soft/40 px-4 py-3 text-[0.9375rem] leading-relaxed text-[#5c4715]">
            No email service is connected yet. Emails are recorded under Messages but not delivered. Add your Zoho CPaaS
            Send Mail token to the environment to turn sending on.
          </p>
        )}
      </Panel>

      <Panel title="Announcement bar" description="A thin strip above the header. Good for holiday closures or short-notice availability.">
        <div className="space-y-5">
          <SwitchRow
            name="announcementActive"
            defaultChecked={initial.announcementActive}
            label="Show the announcement bar"
            hint="Visitors can dismiss it for the rest of their visit."
          />
          <Field label="What it says" htmlFor="announcementText">
            <Input
              id="announcementText"
              name="announcementText"
              defaultValue={initial.announcementText ?? ""}
              placeholder="Taking bookings for next week — message us for same-week availability"
            />
          </Field>
        </div>
      </Panel>

      <Panel title="Links">
        <div className="space-y-5">
          <Field label="Google reviews link" htmlFor="googleReviewUrl" hint="Shown under the reviews on the homepage.">
            <Input id="googleReviewUrl" name="googleReviewUrl" defaultValue={initial.googleReviewUrl ?? ""} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Facebook" htmlFor="facebookUrl">
              <Input id="facebookUrl" name="facebookUrl" defaultValue={initial.facebookUrl ?? ""} />
            </Field>
            <Field label="Instagram" htmlFor="instagramUrl">
              <Input id="instagramUrl" name="instagramUrl" defaultValue={initial.instagramUrl ?? ""} />
            </Field>
            <Field label="TikTok" htmlFor="tiktokUrl">
              <Input id="tiktokUrl" name="tiktokUrl" defaultValue={initial.tiktokUrl ?? ""} />
            </Field>
          </div>
        </div>
      </Panel>

      <Save />
    </form>
  );
}
