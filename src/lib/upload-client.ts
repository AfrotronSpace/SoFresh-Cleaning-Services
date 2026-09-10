/**
 * Browser-side half of the service-photo upload: ask the server to presign,
 * then PUT the file straight to R2. Mirrors the shape `src/lib/r2.ts` hands
 * back from `presignPublicImageUpload`. Not `server-only` — this runs in the
 * browser.
 */
export type UploadedImage = { url: string; key: string };

export async function uploadServiceImage(
  file: File,
  folder: string,
  onProgress?: (fraction: number) => void,
): Promise<UploadedImage> {
  const presignRes = await fetch("/api/admin/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder, filename: file.name, contentType: file.type, size: file.size }),
  });

  const presigned = await presignRes.json().catch(() => null);
  if (!presignRes.ok || !presigned?.url) {
    throw new Error(presigned?.error || "Couldn't start the upload.");
  }

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presigned.url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("The upload was rejected.")));
    xhr.onerror = () => reject(new Error("The upload failed — check your connection and try again."));
    xhr.send(file);
  });

  return { url: presigned.publicUrl as string, key: presigned.key as string };
}
