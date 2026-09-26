/**
 * Browser-side half of public-bucket uploads: ask the server to presign, then
 * PUT the file straight to R2. Mirrors the shape `src/lib/r2.ts` hands back.
 * Not `server-only` — this runs in the browser.
 */
import { mediaTypeFor, maxBytesFor, type EditorSlot } from "@/lib/gallery";

export type UploadedImage = { url: string; key: string };

async function presignAndPut(
  body: Record<string, unknown>,
  file: Blob,
  contentType: string,
  onProgress?: (fraction: number) => void,
): Promise<UploadedImage> {
  const presignRes = await fetch("/api/admin/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, contentType, size: file.size }),
  });

  const presigned = await presignRes.json().catch(() => null);
  if (!presignRes.ok || !presigned?.url) {
    throw new Error(presigned?.error || "Couldn't start the upload.");
  }

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presigned.url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("The upload was rejected.")));
    xhr.onerror = () => reject(new Error("The upload failed — check your connection and try again."));
    xhr.send(file);
  });

  return { url: presigned.publicUrl as string, key: presigned.key as string };
}

export function uploadServiceImage(file: File, folder: string, onProgress?: (fraction: number) => void) {
  return presignAndPut({ folder, filename: file.name }, file, file.type, onProgress);
}

type Probe = { width: number | null; height: number | null; poster: Blob | null };

function probeImage(file: File): Promise<Probe> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth || null, height: img.naturalHeight || null, poster: null });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: null, height: null, poster: null });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

/**
 * Reads a video's dimensions and grabs a JPEG frame to use as its poster, so
 * the public gallery can show a still without downloading the clip. The file
 * is a local object URL, so the canvas is never tainted. Resolves with nulls
 * if this browser can't decode the codec (e.g. HEVC .mov in Chrome) — which
 * is also a sign visitors may not be able to play it.
 */
function probeVideo(file: File): Promise<Probe> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    let settled = false;
    const finish = (result: Probe) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
      resolve(result);
    };
    const timer = setTimeout(() => finish({ width: null, height: null, poster: null }), 15000);

    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onerror = () => finish({ width: null, height: null, poster: null });
    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      video.currentTime = Math.min(0.5, duration / 2);
    };
    video.onseeked = () => {
      const width = video.videoWidth || null;
      const height = video.videoHeight || null;
      if (!width || !height) return finish({ width, height, poster: null });
      const scale = Math.min(1, 1600 / Math.max(width, height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => finish({ width, height, poster: blob }), "image/jpeg", 0.82);
    };
    video.src = url;
  });
}

export type GalleryUploadResult = { slot: EditorSlot; warning?: string };

/** Uploads one photo or video to the gallery, plus a poster frame for videos. */
export async function uploadGalleryFile(file: File, onProgress?: (fraction: number) => void): Promise<GalleryUploadResult> {
  const type = mediaTypeFor(file.type);
  if (!type) throw new Error(`${file.name}: use a JPEG, PNG or WebP photo, or an MP4, MOV or WebM video.`);
  if (file.size > maxBytesFor(type)) {
    throw new Error(`${file.name} is larger than ${type === "VIDEO" ? "100" : "15"} MB.`);
  }

  const probe = type === "VIDEO" ? await probeVideo(file) : await probeImage(file);
  const uploaded = await presignAndPut({ kind: "gallery", filename: file.name }, file, file.type, onProgress);

  let poster: UploadedImage | null = null;
  if (probe.poster) {
    const posterName = `${file.name.replace(/\.[^.]+$/, "")}-poster.jpg`;
    poster = await presignAndPut({ kind: "gallery", filename: posterName }, probe.poster, "image/jpeg").catch(() => null);
  }

  return {
    slot: {
      type,
      key: uploaded.key,
      url: uploaded.url,
      poster: poster?.key ?? null,
      posterUrl: poster?.url ?? null,
      width: probe.width,
      height: probe.height,
      alt: "",
    },
    warning:
      type === "VIDEO" && !probe.width
        ? `${file.name} uploaded, but this browser couldn't play it — visitors may not be able to either. Re-exporting it as MP4 is safest.`
        : undefined,
  };
}
