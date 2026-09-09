"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { sendMessageAction, type ActionState } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

const CHANNELS = [
  { value: "EMAIL", label: "Email" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "INTERNAL_NOTE", label: "Private note" },
] as const;

function Send() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? "Sending" : "Send"}
    </Button>
  );
}

export function MessageComposer({
  recipientId,
  bookingId,
  defaultEmail,
  defaultPhone,
}: {
  recipientId?: string;
  bookingId?: string;
  defaultEmail?: string;
  defaultPhone?: string;
}) {
  const [state, action] = useActionState<ActionState, FormData>(sendMessageAction, {});
  const [channel, setChannel] = useState<string>("EMAIL");

  useEffect(() => {
    if (state.message) toast.success(state.message);
    if (state.error) toast.error(state.error);
  }, [state]);

  const to = channel === "WHATSAPP" ? (defaultPhone ?? "") : (defaultEmail ?? "");

  return (
    <form action={action} className="space-y-5">
      {recipientId && <input type="hidden" name="recipientId" value={recipientId} />}
      {bookingId && <input type="hidden" name="bookingId" value={bookingId} />}
      <input type="hidden" name="channel" value={channel} />

      <Field label="How to send it" required>
        <div className="flex flex-wrap gap-2">
          {CHANNELS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setChannel(option.value)}
              aria-pressed={channel === option.value}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                channel === option.value
                  ? "border-forest bg-forest text-white"
                  : "border-border bg-white text-sage hover:border-forest/40 hover:text-forest",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Field>

      <Field
        label={channel === "WHATSAPP" ? "Phone number" : channel === "INTERNAL_NOTE" ? "About" : "Email address"}
        htmlFor="toAddress"
        required
        error={state.fieldErrors?.toAddress}
      >
        <Input id="toAddress" name="toAddress" key={channel} defaultValue={to} required />
      </Field>

      {channel !== "WHATSAPP" && (
        <Field label="Subject" htmlFor="subject" error={state.fieldErrors?.subject}>
          <Input id="subject" name="subject" placeholder="About your booking" />
        </Field>
      )}

      <Field label="Message" htmlFor="body" required error={state.fieldErrors?.body}>
        <Textarea id="body" name="body" className="min-h-[8rem]" required />
      </Field>

      <Send />
    </form>
  );
}
