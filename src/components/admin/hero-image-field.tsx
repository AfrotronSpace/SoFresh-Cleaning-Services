"use client";

import { useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadServiceImage } from "@/lib/upload-client";

/** Single cover-photo picker: upload straight to R2, or paste a URL/path by hand. */
export function HeroImageField({ folder, initialUrl }: { folder: string; initialUrl: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [manual, setManual] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setProgress(0);
    try {
      const uploaded = await uploadServiceImage(file, folder, setProgress);
      setUrl(uploaded.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="heroImage" value={url} readOnly />
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {url ? (
        <div className="group relative aspect-[16/9] w-full max-w-sm overflow-hidden rounded-xl border border-border bg-mist">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => setUrl("")}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Remove header image"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={progress !== null}
          className="flex aspect-[16/9] w-full max-w-sm flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-haze/40 text-sage transition-colors hover:border-forest/40 hover:text-forest disabled:pointer-events-none"
        >
          {progress !== null ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              <span className="text-sm">Uploading{progress > 0 ? ` — ${Math.round(progress * 100)}%` : ""}</span>
            </>
          ) : (
            <>
              <ImagePlus className="size-6" strokeWidth={1.5} />
              <span className="text-sm font-medium">Click to upload a photo</span>
              <span className="text-xs">JPEG, PNG or WebP, up to 15 MB</span>
            </>
          )}
        </button>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {url && (
          <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()} disabled={progress !== null}>
            <ImagePlus className="size-3.5" /> Replace
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={() => setManual((v) => !v)}>
          <Link2 className="size-3.5" /> {manual ? "Hide URL field" : "Paste a URL instead"}
        </Button>
      </div>

      {manual && (
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="/images/deep-clean.jpg, or a full URL"
          className="max-w-sm"
        />
      )}
    </div>
  );
}
