"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { uploadServiceImage } from "@/lib/upload-client";

export type GalleryImage = { url: string; alt: string; caption: string };

/** Multi-photo gallery: upload any number of files, then caption/reorder/remove. */
export function GalleryEditor({ folder, initial }: { folder: string; initial: GalleryImage[] }) {
  const [images, setImages] = useState<GalleryImage[]>(initial);
  const [uploading, setUploading] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    setUploading(list.length);
    const uploaded: GalleryImage[] = [];
    for (const file of list) {
      try {
        const result = await uploadServiceImage(file, folder);
        uploaded.push({ url: result.url, alt: "", caption: "" });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : `Couldn't upload ${file.name}.`);
      }
      setUploading((n) => n - 1);
    }
    if (uploaded.length > 0) setImages((prev) => [...prev, ...uploaded]);
  }

  function update(index: number, patch: Partial<GalleryImage>) {
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, ...patch } : img)));
  }

  function move(index: number, delta: number) {
    setImages((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function remove(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name="imagesJson" value={JSON.stringify(images)} readOnly />
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {images.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {images.map((image, index) => (
            <li key={image.url + index} className="flex gap-3 rounded-xl border border-border bg-white p-3">
              <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg bg-mist">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 space-y-1.5">
                <Input
                  value={image.alt}
                  onChange={(e) => update(index, { alt: e.target.value })}
                  placeholder="Alt text (for screen readers)"
                  className="h-8 text-sm"
                />
                <Input
                  value={image.caption}
                  onChange={(e) => update(index, { caption: e.target.value })}
                  placeholder="Caption, optional"
                  className="h-8 text-sm"
                />
                <div className="flex items-center gap-1 pt-0.5">
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="rounded p-1 text-sage hover:bg-mist hover:text-forest disabled:opacity-30">
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => move(index, 1)} disabled={index === images.length - 1} className="rounded p-1 text-sage hover:bg-mist hover:text-forest disabled:opacity-30">
                    <ArrowDown className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => remove(index)} className="ml-auto rounded p-1 text-sage hover:bg-[#fbe6e4] hover:text-destructive">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        disabled={uploading > 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-haze/40 px-4 py-4 text-sm font-medium text-sage transition-colors hover:border-forest/40 hover:text-forest disabled:pointer-events-none"
      >
        {uploading > 0 ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Uploading {uploading} photo{uploading > 1 ? "s" : ""}
          </>
        ) : (
          <>
            <ImagePlus className="size-4" /> Add gallery photos
          </>
        )}
      </button>
    </div>
  );
}
