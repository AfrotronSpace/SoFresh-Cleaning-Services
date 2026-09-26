"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ImagePlus, Loader2, Maximize2, Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { addInboxItemAction, addInboxToJobAction, createJobFromInboxAction, deleteInboxItemsAction } from "@/app/actions/admin";
import { uploadGalleryFile } from "@/lib/upload-client";
import { GALLERY_ACCEPT, MAX_FRAMES_PER_JOB, type InboxItem } from "@/lib/gallery";
import { cn } from "@/lib/utils";

const UPLOAD_CONCURRENCY = 3;
const FILTERS = [
  { key: "all", label: "Everything" },
  { key: "PHOTO", label: "Photos" },
  { key: "VIDEO", label: "Videos" },
] as const;

type JobOption = { id: string; label: string; count: number };

/** Shortens from the middle: WhatsApp names only differ at the end (…-WA0001.jpg). */
function shortName(name: string, max = 24) {
  return name.length <= max ? name : `${name.slice(0, 8)}…${name.slice(-(max - 9))}`;
}

export function GalleryInbox({
  initial,
  jobs,
  uploadsEnabled,
}: {
  initial: InboxItem[];
  jobs: JobOption[];
  uploadsEnabled: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<InboxItem | null>(null);
  const [targetJob, setTargetJob] = useState("");
  const [pending, startTransition] = useTransition();
  const lastClicked = useRef<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Each file is recorded as it lands, so only in-flight uploads are at risk.
  useEffect(() => {
    if (!progress) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [progress]);

  const visible = filter === "all" ? items : items.filter((i) => i.type === filter);
  const selectedIds = items.filter((i) => selected.has(i.id)).map((i) => i.id);
  const count = selectedIds.length;

  async function handleFiles(list: FileList | File[] | null) {
    if (!list || list.length === 0) return;
    const files = Array.from(list).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    let next = 0;
    let done = 0;
    setProgress({ done: 0, total: files.length });

    async function worker() {
      while (next < files.length) {
        const file = files[next++];
        try {
          const { slot, warning } = await uploadGalleryFile(file);
          const result = await addInboxItemAction({ ...slot, originalName: file.name });
          if (!result.ok) throw new Error(`${file.name}: ${result.error}`);
          const item: InboxItem = { ...slot, id: result.id!, name: file.name };
          setItems((prev) =>
            [...prev, item].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })),
          );
          if (warning) toast.warning(warning);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : `Couldn't upload ${file.name}.`);
        }
        done += 1;
        setProgress({ done, total: files.length });
      }
    }

    await Promise.all(Array.from({ length: Math.min(UPLOAD_CONCURRENCY, files.length) }, worker));
    setProgress(null);
    toast.success(`${done} file${done === 1 ? "" : "s"} processed.`);
  }

  function toggle(index: number, shift: boolean) {
    const item = visible[index];
    setSelected((prev) => {
      const nextSet = new Set(prev);
      if (shift && lastClicked.current !== null) {
        // Shift-click selects the whole run, the way a file manager does.
        const [from, to] = [lastClicked.current, index].sort((a, b) => a - b);
        for (const i of visible.slice(from, to + 1)) nextSet.add(i.id);
      } else if (nextSet.has(item.id)) {
        nextSet.delete(item.id);
      } else {
        nextSet.add(item.id);
      }
      return nextSet;
    });
    lastClicked.current = index;
  }

  function removeFromView(ids: string[]) {
    const gone = new Set(ids);
    setItems((prev) => prev.filter((i) => !gone.has(i.id)));
    setSelected(new Set());
    lastClicked.current = null;
  }

  function createJob() {
    startTransition(async () => {
      const result = await createJobFromInboxAction(selectedIds);
      if (!result.ok) return void toast.error(result.error);
      toast.success(`Draft job created with ${count} file${count === 1 ? "" : "s"}. Pair the before & afters next.`);
      router.push(`/admin/gallery/${result.id}`);
    });
  }

  function addToJob() {
    if (!targetJob) return void toast.error("Choose which job to add them to.");
    startTransition(async () => {
      const result = await addInboxToJobAction(selectedIds, targetJob);
      if (!result.ok) return void toast.error(result.error);
      const job = jobs.find((j) => j.id === targetJob);
      removeFromView(selectedIds);
      toast.success(`${result.count} file${result.count === 1 ? "" : "s"} added to ${job?.label ?? "the job"}.`, {
        action: { label: "Open job", onClick: () => router.push(`/admin/gallery/${targetJob}`) },
      });
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm(`Permanently delete ${count} file${count === 1 ? "" : "s"} from storage? This can't be undone.`)) return;
    startTransition(async () => {
      const ids = selectedIds;
      const result = await deleteInboxItemsAction(ids);
      if (!result.ok) return void toast.error(result.error);
      removeFromView(ids);
      toast.success(`${result.count} file${result.count === 1 ? "" : "s"} deleted.`);
    });
  }

  const photos = items.filter((i) => i.type === "PHOTO").length;

  return (
    <div className="space-y-6">
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
            if (!progress) handleFiles(e.dataTransfer.files);
          }}
          disabled={progress !== null}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed px-4 py-10 text-sm font-medium transition-colors disabled:pointer-events-none",
            dragOver ? "border-forest bg-mist text-forest" : "border-border bg-white text-sage hover:border-forest/40 hover:text-forest",
          )}
        >
          {progress ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Uploading {progress.done} of {progress.total} — you can keep sorting while this runs
              <span className="mt-1 h-1 w-56 overflow-hidden rounded-full bg-border">
                <span className="block h-full bg-forest transition-[width]" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
              </span>
            </>
          ) : (
            <>
              <ImagePlus className="size-6" />
              Drop the whole batch here, or click to choose
              <span className="text-xs font-normal">
                Any number of files · JPEG, PNG, WebP up to 15 MB · MP4, MOV, WebM up to 100 MB
              </span>
            </>
          )}
        </button>
      ) : (
        <p className="rounded-2xl border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-sage">
          Photo storage isn&rsquo;t configured yet, so uploads are switched off. See docs/DEPLOYMENT.md → the public bucket.
        </p>
      )}

      {items.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => {
                  setFilter(f.key);
                  lastClicked.current = null;
                }}
                aria-pressed={filter === f.key}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  filter === f.key ? "border-forest bg-forest text-white" : "border-border bg-white text-sage hover:text-forest",
                )}
              >
                {f.label}
                <span className="ml-1.5 opacity-70">
                  {f.key === "all" ? items.length : f.key === "PHOTO" ? photos : items.length - photos}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span className="mr-2 text-sage">Click to select · Shift-click for a range</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(new Set([...selected, ...visible.map((i) => i.id)]))}>
              Select all shown
            </Button>
            {count > 0 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                Clear
              </Button>
            )}
          </div>
        </div>
      )}

      {items.length === 0 && !progress ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center">
          <h2 className="font-display text-lg text-ink">The inbox is empty</h2>
          <p className="mx-auto mt-2.5 max-w-[52ch] text-[0.9375rem] leading-relaxed text-sage">
            Upload everything at once — straight from a WhatsApp export is fine. Files wait here, hidden from the website,
            until you group them into jobs.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {visible.map((item, index) => {
            const isSelected = selected.has(item.id);
            const src = item.type === "PHOTO" ? item.url : item.posterUrl;
            return (
              <li key={item.id} className="relative">
                <button
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`${isSelected ? "Deselect" : "Select"} ${item.name}`}
                  onClick={(e) => toggle(index, e.shiftKey)}
                  className={cn(
                    "block w-full select-none overflow-hidden rounded-xl border-2 bg-white text-left transition-colors",
                    isSelected ? "border-forest" : "border-transparent hover:border-forest/30",
                  )}
                >
                  <span className="relative block aspect-square bg-forest-deep">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {src && <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />}
                    {item.type === "VIDEO" && (
                      <span className="absolute inset-0 grid place-items-center">
                        <span className="grid size-9 place-items-center rounded-full bg-white/90 text-forest">
                          <Play className="ml-0.5 size-3.5 fill-current" />
                        </span>
                      </span>
                    )}
                    <span
                      className={cn(
                        "absolute left-2 top-2 grid size-6 place-items-center rounded-md border-2 transition-colors",
                        isSelected ? "border-forest bg-forest text-white" : "border-white/90 bg-black/20 text-transparent",
                      )}
                    >
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                  </span>
                  <span title={item.name} className="block truncate px-2 py-1.5 text-xs text-sage">
                    {shortName(item.name)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreview(item)}
                  aria-label={`Preview ${item.name}`}
                  title="Preview"
                  className="absolute right-2 top-2 grid size-7 place-items-center rounded-md bg-white/90 text-forest shadow-sm transition-colors hover:bg-white"
                >
                  <Maximize2 className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {count > 0 && (
        <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-white/95 p-3 shadow-[var(--shadow-panel)] backdrop-blur">
          <p className="px-2 text-sm font-medium text-ink">{count} selected</p>
          <Button type="button" onClick={createJob} disabled={pending || count > MAX_FRAMES_PER_JOB}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {count > MAX_FRAMES_PER_JOB ? `Max ${MAX_FRAMES_PER_JOB} per job` : "Create a job"}
          </Button>
          {jobs.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                aria-label="Existing job"
                value={targetJob}
                onChange={(e) => setTargetJob(e.target.value)}
                className="h-10 max-w-[16rem] rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="">Add to an existing job…</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id} disabled={j.count + count > MAX_FRAMES_PER_JOB}>
                    {j.label} ({j.count})
                  </option>
                ))}
              </select>
              <Button type="button" variant="outline" onClick={addToJob} disabled={pending || !targetJob}>
                Add
              </Button>
            </div>
          )}
          <Button type="button" variant="ghost" onClick={remove} disabled={pending} className="ml-auto text-destructive hover:bg-[#fbe6e4]">
            Delete
          </Button>
        </div>
      )}

      <Dialog open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
        {preview && (
          <DialogContent className="max-w-3xl">
            <DialogTitle className="truncate text-lg">{preview.name}</DialogTitle>
            <DialogDescription>
              {preview.type === "VIDEO" ? "Video" : "Photo"}
              {preview.width && preview.height ? ` · ${preview.width}×${preview.height}` : ""}
            </DialogDescription>
            {preview.type === "VIDEO" ? (
              <video src={preview.url} poster={preview.posterUrl ?? undefined} controls playsInline className="max-h-[70vh] w-full rounded-xl bg-forest-deep" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.url} alt="" className="mx-auto max-h-[70vh] w-auto rounded-xl" />
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant={selected.has(preview.id) ? "outline" : "default"}
                onClick={() => {
                  const id = preview.id;
                  setSelected((prev) => {
                    const nextSet = new Set(prev);
                    if (nextSet.has(id)) nextSet.delete(id);
                    else nextSet.add(id);
                    return nextSet;
                  });
                }}
              >
                {selected.has(preview.id) ? "Deselect" : "Select"}
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
