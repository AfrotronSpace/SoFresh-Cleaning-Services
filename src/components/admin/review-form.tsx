"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Panel } from "@/components/admin/page-header";
import { StarInput } from "@/components/site/star-input";
import { saveReviewAction, type ActionState } from "@/app/actions/admin";
import { REVIEW_SOURCE, REVIEW_STATUS, type ReviewSource, type ReviewStatus } from "@/lib/reviews";
import { cn } from "@/lib/utils";

export type ReviewFormValues = {
  id?: string;
  authorName: string;
  area: string;
  rating: number;
  body: string;
  source: ReviewSource;
  status: ReviewStatus;
  jobId: string;
  featured: boolean;
  sortOrder: number;
};

const selectClass = "h-11 w-full rounded-md border border-input bg-white px-3.5 text-[0.9375rem]";

export function AdminReviewForm({
  initial,
  jobs,
  areas,
  googleUrl,
}: {
  initial: ReviewFormValues;
  jobs: { id: string; label: string }[];
  areas: string[];
  googleUrl: string | null;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ActionState & { id?: string }, FormData>(saveReviewAction, {});
  const [rating, setRating] = useState(initial.rating);
  const [status, setStatus] = useState<ReviewStatus>(initial.status);

  useEffect(() => {
    if (state.message) toast.success(state.message);
    if (state.error) toast.error(state.error);
    if (state.ok && state.id && !initial.id) router.replace(`/admin/reviews/${state.id}`);
  }, [state, initial.id, router]);

  return (
    // onSubmit rather than `action`: React 19 resets a form after an action, which
    // would wipe a pasted review whenever the server rejects a field.
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="space-y-6"
    >
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <Panel
        title="The review"
        description={
          initial.source === "GOOGLE"
            ? "Copy the wording exactly as it appears on Google. Don't tidy it up — it has to match what the customer wrote."
            : "Left by a customer on the website. Fix obvious typos if you like, but keep their words."
        }
      >
        <div className="space-y-5">
          <Field label="Rating" required error={state.fieldErrors?.rating}>
            <StarInput name="rating" value={rating} onChange={setRating} invalid={Boolean(state.fieldErrors?.rating)} />
          </Field>
          <Field label="Review text" htmlFor="body" required error={state.fieldErrors?.body}>
            <Textarea id="body" name="body" defaultValue={initial.body} maxLength={4000} className="min-h-[9rem]" />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Name shown"
              htmlFor="authorName"
              required
              hint="First name and initial, e.g. “Nicola R.”, unless they've said the full name is fine."
              error={state.fieldErrors?.authorName}
            >
              <Input id="authorName" name="authorName" defaultValue={initial.authorName} maxLength={80} />
            </Field>
            <Field label="Town" htmlFor="area" hint="Never a street, house number or postcode." error={state.fieldErrors?.area}>
              <Input id="area" name="area" list="review-areas" defaultValue={initial.area} maxLength={80} />
              <datalist id="review-areas">
                {areas.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </Field>
            <Field label="Where it came from" htmlFor="source" required>
              <select id="source" name="source" defaultValue={initial.source} className={selectClass}>
                {(Object.keys(REVIEW_SOURCE) as ReviewSource[]).map((s) => (
                  <option key={s} value={s}>{REVIEW_SOURCE[s]}</option>
                ))}
              </select>
            </Field>
            <Field label="Gallery job" htmlFor="jobId" hint="Shows the review inside that job on /gallery." error={state.fieldErrors?.jobId}>
              <select id="jobId" name="jobId" defaultValue={initial.jobId} className={selectClass}>
                <option value="">Not linked to a job</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.label}</option>
                ))}
              </select>
            </Field>
          </div>
          {initial.source === "GOOGLE" && googleUrl && (
            <p className="text-sm text-sage">
              <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-verdant underline underline-offset-4">
                Open your Google reviews
              </a>{" "}
              to copy the text across.
            </p>
          )}
        </div>
      </Panel>

      <Panel title="Visibility">
        <fieldset className="space-y-2">
          <legend className="sr-only">Status</legend>
          {(Object.keys(REVIEW_STATUS) as ReviewStatus[]).map((s) => (
            <label
              key={s}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors",
                status === s ? "border-forest bg-mist/50" : "border-border hover:bg-haze/60",
              )}
            >
              <input type="radio" name="status" value={s} checked={status === s} onChange={() => setStatus(s)} className="mt-1 accent-forest" />
              <span>
                <span className="block font-medium text-ink">{s === "APPROVED" ? "Live on the website" : REVIEW_STATUS[s].label}</span>
                <span className="mt-0.5 block text-sm text-sage">
                  {s === "PENDING" && "Not shown. New website reviews wait here for you."}
                  {s === "APPROVED" && "Shown on /reviews, the homepage and its gallery job."}
                  {s === "HIDDEN" && "Not shown, but kept in case you change your mind."}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
        {state.fieldErrors?.status && <p className="mt-2 text-sm text-destructive">{state.fieldErrors.status}</p>}

        <div className="mt-5 grid gap-5 border-t border-border pt-5 sm:grid-cols-[1fr_12rem] sm:items-end">
          <label className="flex cursor-pointer items-start gap-3.5">
            <Checkbox name="featured" defaultChecked={initial.featured} className="mt-0.5" />
            <span>
              <span className="block font-medium text-ink">Feature this review</span>
              <span className="mt-0.5 block text-sm leading-relaxed text-sage">Featured reviews come first, so they're the ones on the homepage.</span>
            </span>
          </label>
          <Field label="Order" htmlFor="sortOrder" hint="Lower comes first." error={state.fieldErrors?.sortOrder}>
            <Input id="sortOrder" name="sortOrder" type="number" min={0} max={9999} defaultValue={initial.sortOrder} />
          </Field>
        </div>
      </Panel>

      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {pending ? "Saving" : initial.id ? "Save changes" : "Add review"}
      </Button>
    </form>
  );
}
