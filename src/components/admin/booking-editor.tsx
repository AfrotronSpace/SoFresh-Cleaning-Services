"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { updateBookingAction, type ActionState } from "@/app/actions/admin";
import { BOOKING_STATUS } from "@/lib/constants";
import type { BookingStatus } from "@prisma/client";

function Save() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? "Saving" : "Save changes"}
    </Button>
  );
}

export function BookingEditor({
  id,
  status,
  quotedTotal,
  quoteNotes,
  adminNotes,
}: {
  id: string;
  status: BookingStatus;
  quotedTotal: string | null;
  quoteNotes: string | null;
  adminNotes: string | null;
}) {
  const [state, action] = useActionState<ActionState, FormData>(updateBookingAction, {});

  useEffect(() => {
    if (state.message) toast.success(state.message);
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="id" value={id} />

      <Field label="Status" htmlFor="status" required>
        <select
          id="status"
          name="status"
          defaultValue={status}
          className="h-11 w-full rounded-md border border-input bg-white px-3.5 text-[0.9375rem] focus-visible:border-verdant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verdant/25"
        >
          {(Object.keys(BOOKING_STATUS) as BookingStatus[]).map((key) => (
            <option key={key} value={key}>
              {BOOKING_STATUS[key].label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Quoted total" htmlFor="quotedTotal" hint="Pounds. Leave blank until you've priced it.">
        <Input
          id="quotedTotal"
          name="quotedTotal"
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          defaultValue={quotedTotal ?? ""}
          placeholder="350"
        />
      </Field>

      <Field
        label="Message to the customer"
        htmlFor="quoteNotes"
        hint="Included in the email if you tick the box below. This is what they'll read alongside the price."
      >
        <Textarea id="quoteNotes" name="quoteNotes" defaultValue={quoteNotes ?? ""} className="min-h-[7rem]" />
      </Field>

      <Field label="Private notes" htmlFor="adminNotes" hint="Only ever visible here.">
        <Textarea id="adminNotes" name="adminNotes" defaultValue={adminNotes ?? ""} className="min-h-[5rem]" />
      </Field>

      <label className="flex cursor-pointer items-start gap-3.5 rounded-lg bg-haze p-4">
        <Checkbox name="notifyCustomer" className="mt-0.5" />
        <span className="text-[0.9375rem] leading-relaxed text-sage">
          Email the customer about this update.
        </span>
      </label>

      <Save />
    </form>
  );
}
