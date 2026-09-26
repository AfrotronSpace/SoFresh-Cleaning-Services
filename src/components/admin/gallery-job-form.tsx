"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowLeftRight, Columns2, ImagePlus, Inbox, Loader2, Play, SplitSquareHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Panel } from "@/components/admin/page-header";
import { saveGalleryJobAction, type ActionState } from "@/app/actions/admin";
import { uploadGalleryFile } from "@/lib/upload-client";
import { GALLERY_ACCEPT, MAX_FRAMES_PER_JOB, type EditorFrame, type EditorSlot } from "@/lib/gallery";
import { cn } from "@/lib/utils";

export type GalleryJobFormValues = {
  id?: string;
  title: string;
  description: string;
  completedOn: string;
  area: string;
  serviceId: string;
  published: boolean;
  featured: boolean;
  media: EditorFrame[];
};

type Row = EditorFrame & { uid: string };

const UPLOAD_CONCURRENCY = 3;
let uidCounter = 0;
const uid = () => `f${(uidCounter += 1)}`;

function Save({ isNew, uploading, pending }: { isNew: boolean; uploading: boolean; pending: boolean }) {
  return (
    <Button type="submit" size="lg" disabled={pending || uploading}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? "Saving" : uploading ? "Waiting for uploads" : isNew ? "Save job" : "Save changes"}
    </Button>
  );
}

function Thumb({ slot, label }: { slot: EditorSlot; label?: string }) {
  const src = slot.type === "PHOTO" ? slot.url : slot.posterUrl;
  return (
    <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-lg bg-forest-deep">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} alt="" className="h-full w-full object-cover" />}
      {slot.type === "VIDEO" && (
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid size-7 place-items-center rounded-full bg-white/90 text-forest">
            <Play className="ml-0.5 size-3 fill-current" />
          </span>
        </span>
      )}
      {label && (
        <span
          className={cn(
            "absolute left-1.5 top-1.5 rounded-full px-1.5 py-px text-[0.625rem] font-semibold",
            label === "Before" ? "bg-forest-deep/80 text-white" : "bg-champagne text-[#241a06]",
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}

export function GalleryJobForm({
  initial,
  services,
  areas,
  uploadsEnabled,
}: {
  initial: GalleryJobFormValues;
  services: { id: string; name: string }[];
  areas: string[];
  uploadsEnabled: boolean;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ActionState & { id?: string }, FormData>(saveGalleryJobAction, {});
  const [rows, setRows] = useState<Row[]>(() => initial.media.map((f) => ({ ...f, uid: uid() })));
  const [selected, setSelected] = useState<string[]>([]);
  // Files taken out of this job but kept: saved as inbox items on the next save.
  const [returned, setReturned] = useState<EditorSlot[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dirty, setDirty] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.message) toast.success(state.message);
    if (state.error) toast.error(state.error);
    if (state.ok) {
      setDirty(false);
      setReturned([]);
    }
    if (state.ok && state.id && !initial.id) router.replace(`/admin/gallery/${state.id}`);
  }, [state, initial.id, router]);

  // Uploaded-but-unsaved files would be left orphaned in storage, so warn before leaving.
  useEffect(() => {
    if (!dirty && !progress) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, progress]);

  function change(next: (prev: Row[]) => Row[]) {
    setRows(next);
    setDirty(true);
  }

  async function handleFiles(list: FileList | File[] | null) {
    if (!list || list.length === 0) return;
    // WhatsApp names files chronologically (IMG-20260910-WA0001), so name order keeps befores ahead of afters.
    const files = Array.from(list).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    const room = MAX_FRAMES_PER_JOB - rows.length;
    if (room <= 0) {
      toast.error(`A job holds up to ${MAX_FRAMES_PER_JOB} items. Start a new job for the rest.`);
      return;
    }
    if (files.length > room) toast.warning(`Only the first ${room} files were added — a job holds up to ${MAX_FRAMES_PER_JOB}.`);
    const batch = files.slice(0, room);

    const results: (Row | null)[] = new Array(batch.length).fill(null);
    let next = 0;
    let done = 0;
    setProgress({ done: 0, total: batch.length });

    async function worker() {
      while (next < batch.length) {
        const index = next++;
        const file = batch[index];
        try {
          const { slot, warning } = await uploadGalleryFile(file);
          results[index] = { uid: uid(), layout: "SINGLE", primary: slot, secondary: null, caption: "" };
          if (warning) toast.warning(warning);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : `Couldn't upload ${file.name}.`);
        }
        done += 1;
        setProgress({ done, total: batch.length });
      }
    }

    await Promise.all(Array.from({ length: Math.min(UPLOAD_CONCURRENCY, batch.length) }, worker));
    const added = results.filter((r): r is Row => r !== null);
    if (added.length > 0) change((prev) => [...prev, ...added]);
    setProgress(null);
  }

  function update(id: string, patch: (row: Row) => Row) {
    change((prev) => prev.map((r) => (r.uid === id ? patch(r) : r)));
  }

  function move(index: number, delta: number) {
    change((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  function remove(id: string) {
    change((prev) => prev.filter((r) => r.uid !== id));
    setSelected((s) => s.filter((x) => x !== id));
  }

  function sendToInbox(row: Row) {
    setReturned((prev) => [...prev, row.primary, ...(row.secondary ? [row.secondary] : [])]);
    remove(row.uid);
  }

  function pairSelected() {
    const [first, second] = rows.filter((r) => selected.includes(r.uid));
    if (!first || !second) return;
    change((prev) =>
      prev.flatMap((r) => {
        if (r.uid === second.uid) return [];
        if (r.uid !== first.uid) return [r];
        return [{ uid: uid(), layout: "BEFORE_AFTER", primary: first.primary, secondary: second.primary, caption: first.caption || second.caption }];
      }),
    );
    setSelected([]);
  }

  function split(id: string) {
    change((prev) =>
      prev.flatMap((r) =>
        r.uid === id && r.secondary
          ? [
              { uid: uid(), layout: "SINGLE", primary: r.primary, secondary: null, caption: r.caption },
              { uid: uid(), layout: "SINGLE", primary: r.secondary, secondary: null, caption: "" },
            ]
          : [r],
      ),
    );
  }

  const selectable = rows.filter((r) => r.layout === "SINGLE");
  const canPair = selected.length === 2;
  const uploading = progress !== null;
  const serialised = rows.map(({ layout, primary, secondary, caption }) => ({ layout, primary, secondary, caption }));

  return (
    // Submitted via onSubmit, not `action`: React 19 resets a form after every action,
    // which would wipe the typed-in details whenever the server rejects a field.
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="space-y-6"
    >
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="mediaJson" value={JSON.stringify(serialised)} readOnly />
      <input type="hidden" name="inboxJson" value={JSON.stringify(returned)} readOnly />

      <Panel
        title="Photos and videos"
        description="Drop in files here, or bring them over from the inbox. Tick two and pair them to make a before & after. The first item is the cover on the gallery."
      >
        {returned.length > 0 && (
          <p className="mb-4 rounded-lg bg-mist px-4 py-3 text-sm text-forest">
            {returned.length} file{returned.length === 1 ? "" : "s"} will go back to the inbox when you save.
          </p>
        )}

        {state.fieldErrors?.media && (
          <p className="mb-4 rounded-lg bg-[#fbe6e4] px-4 py-3 text-sm text-destructive">{state.fieldErrors.media}</p>
        )}

        {rows.length > 0 && (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-haze/70 px-4 py-3">
              <p className="text-sm text-sage">
                {rows.length} item{rows.length === 1 ? "" : "s"}
                {selectable.length >= 2 && (canPair ? " · 2 ticked — the higher one becomes the before" : " · tick two single items to pair them")}
              </p>
              <Button type="button" size="sm" variant="outline" disabled={!canPair} onClick={pairSelected}>
                <Columns2 className="size-4" /> Pair as before &amp; after
              </Button>
            </div>

            <ul className="space-y-3">
              {rows.map((row, index) => {
                const pair = row.layout === "BEFORE_AFTER" && row.secondary;
                const isSelected = selected.includes(row.uid);
                return (
                  <li
                    key={row.uid}
                    className={cn(
                      "rounded-xl border bg-white p-3 transition-colors",
                      isSelected ? "border-forest bg-mist/40" : "border-border",
                    )}
                  >
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-start gap-2.5">
                        {!pair && (
                          <Checkbox
                            aria-label="Select to pair"
                            checked={isSelected}
                            disabled={!isSelected && selected.length >= 2}
                            onCheckedChange={(checked) =>
                              setSelected((s) => (checked ? [...s, row.uid] : s.filter((x) => x !== row.uid)))
                            }
                            className="mt-1"
                          />
                        )}
                        <Thumb slot={row.primary} label={pair ? "Before" : undefined} />
                        {pair && row.secondary && <Thumb slot={row.secondary} label="After" />}
                      </div>

                      <div className="min-w-[14rem] flex-1 space-y-1.5">
                        <p className="text-xs font-medium uppercase tracking-wide text-sage">
                          {index === 0 ? "Cover · " : ""}
                          {pair ? "Before & after" : row.primary.type === "VIDEO" ? "Video" : "Photo"}
                        </p>
                        <Input
                          value={row.primary.alt}
                          onChange={(e) => update(row.uid, (r) => ({ ...r, primary: { ...r.primary, alt: e.target.value } }))}
                          placeholder={pair ? "Describe the before, e.g. grease-caked hob" : "Describe what it shows (for screen readers)"}
                          maxLength={160}
                          className="h-8 text-sm"
                        />
                        {pair && row.secondary && (
                          <Input
                            value={row.secondary.alt}
                            onChange={(e) =>
                              update(row.uid, (r) => (r.secondary ? { ...r, secondary: { ...r.secondary, alt: e.target.value } } : r))
                            }
                            placeholder="Describe the after"
                            maxLength={160}
                            className="h-8 text-sm"
                          />
                        )}
                        <Input
                          value={row.caption}
                          onChange={(e) => update(row.uid, (r) => ({ ...r, caption: e.target.value }))}
                          placeholder="Caption, optional — shown under it"
                          maxLength={240}
                          className="h-8 text-sm"
                        />
                        <div className="flex items-center gap-1 pt-0.5">
                          <IconButton label="Move up" onClick={() => move(index, -1)} disabled={index === 0}>
                            <ArrowUp className="size-3.5" />
                          </IconButton>
                          <IconButton label="Move down" onClick={() => move(index, 1)} disabled={index === rows.length - 1}>
                            <ArrowDown className="size-3.5" />
                          </IconButton>
                          {pair && (
                            <>
                              <IconButton
                                label="Swap before and after"
                                onClick={() => update(row.uid, (r) => (r.secondary ? { ...r, primary: r.secondary, secondary: r.primary } : r))}
                              >
                                <ArrowLeftRight className="size-3.5" />
                              </IconButton>
                              <IconButton label="Split into two items" onClick={() => split(row.uid)}>
                                <SplitSquareHorizontal className="size-3.5" />
                              </IconButton>
                            </>
                          )}
                          <IconButton label="Send back to the inbox (keeps the file)" onClick={() => sendToInbox(row)} className="ml-auto">
                            <Inbox className="size-3.5" />
                          </IconButton>
                          <IconButton label="Remove and delete the file" onClick={() => remove(row.uid)} danger>
                            <Trash2 className="size-3.5" />
                          </IconButton>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <input
          ref={fileInput}
          type="file"
          accept={GALLERY_ACCEPT}
          multiple
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {uploadsEnabled ? (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (!uploading) handleFiles(e.dataTransfer.files);
            }}
            disabled={uploading}
            className={cn(
              "mt-4 flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-8 text-sm font-medium transition-colors disabled:pointer-events-none",
              dragOver ? "border-forest bg-mist text-forest" : "border-border bg-haze/40 text-sage hover:border-forest/40 hover:text-forest",
            )}
          >
            {uploading && progress ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Uploading {progress.done} of {progress.total}
                <span className="mt-1 h-1 w-48 overflow-hidden rounded-full bg-border">
                  <span className="block h-full bg-forest transition-[width]" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
                </span>
              </>
            ) : (
              <>
                <ImagePlus className="size-5" />
                Drop photos and videos here, or click to choose
                <span className="text-xs font-normal">JPEG, PNG, WebP up to 15 MB · MP4, MOV, WebM up to 100 MB</span>
              </>
            )}
          </button>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-border bg-haze/40 px-4 py-6 text-center text-sm text-sage">
            Photo storage isn&rsquo;t configured yet, so uploads are switched off. See docs/DEPLOYMENT.md → the public bucket.
          </p>
        )}
      </Panel>

      <Panel title="About the job" description="All optional — a job can go up with just photos. Nothing here should identify the customer.">
        <div className="space-y-5">
          <Field label="Title" htmlFor="title" hint="e.g. “Kitchen restoration in a rented flat”. Left blank, the service name is used." error={state.fieldErrors?.title}>
            <Input id="title" name="title" defaultValue={initial.title} maxLength={120} />
          </Field>
          <Field label="Description" htmlFor="description" hint="What state it was in and what the job involved. Stick to what happened — no new promises or prices." error={state.fieldErrors?.description}>
            <Textarea id="description" name="description" defaultValue={initial.description} maxLength={2000} className="min-h-[7rem]" />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Service" htmlFor="serviceId" hint="Shows the job on that service's page too." error={state.fieldErrors?.serviceId}>
              <select
                id="serviceId"
                name="serviceId"
                defaultValue={initial.serviceId}
                className="h-11 w-full rounded-md border border-input bg-white px-3.5 text-[0.9375rem]"
              >
                <option value="">Not linked to a service</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Date completed" htmlFor="completedOn" hint="Shown as month and year." error={state.fieldErrors?.completedOn}>
              <Input id="completedOn" name="completedOn" type="date" defaultValue={initial.completedOn} max={new Date().toISOString().slice(0, 10)} />
            </Field>
            <Field label="Town or area" htmlFor="area" hint="Never a street, house number or postcode." error={state.fieldErrors?.area}>
              <Input id="area" name="area" list="gallery-areas" defaultValue={initial.area} maxLength={80} />
              <datalist id="gallery-areas">
                {areas.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </Field>
          </div>
        </div>
      </Panel>

      <Panel title="Visibility">
        <div className="space-y-3">
          <Toggle
            name="published"
            defaultChecked={initial.published}
            label="Show on the website"
            hint="Leave off to keep it as a draft while you sort and label the photos."
          />
          <Toggle
            name="featured"
            defaultChecked={initial.featured}
            label="Feature this job"
            hint="Pins it to the top of the gallery. If it has a before & after photo pair, it can also replace the homepage showcase."
          />
        </div>
      </Panel>

      <Save isNew={!initial.id} uploading={uploading} pending={pending} />
    </form>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded p-1.5 text-sage disabled:opacity-30",
        danger ? "hover:bg-[#fbe6e4] hover:text-destructive" : "hover:bg-mist hover:text-forest",
        className,
      )}
    >
      {children}
    </button>
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
