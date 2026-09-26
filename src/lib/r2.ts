/**
 * Cloudflare R2 storage — customer photos and walkthrough videos.
 *
 * Deliberately NOT `import "server-only"`. That package is aliased by Next but
 * is not actually installed (see CLAUDE.md → Gotchas), so importing it here
 * would break any script that touches this module outside Next. Nothing leaks:
 * every credential below is read from a non-`NEXT_PUBLIC_` variable, which Next
 * replaces with `undefined` in client bundles.
 *
 * Two things drive the design:
 *
 *  1. **Uploads never pass through Vercel.** A Vercel function rejects request
 *     bodies over 4.5 MB, and AFT-F-02 B1 asks customers for "a short
 *     walkthrough video" — which will exceed that on any phone. So the browser
 *     PUTs straight to R2 using a presigned URL and the server only ever sees
 *     the resulting object key.
 *
 *  2. **The bucket stays private.** These are photographs of the inside of
 *     customers' homes. The privacy policy commits to sharing them only with
 *     the assigned cleaner and named professional providers (AFT-F-02 J2), so
 *     objects are read back through short-lived presigned GET URLs rather than
 *     a public bucket.
 *
 * Like email and WhatsApp, this degrades: with no R2 credentials configured
 * `isR2Configured()` is false and callers fall back to asking for photos on
 * WhatsApp, which is how the business already works.
 */
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { mediaTypeFor, maxBytesFor } from "./gallery";

/** 100 MB. R2 accepts up to 5 GB in a single PUT; this is a sane phone-video cap. */
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

const UPLOAD_URL_TTL = 60 * 10; // 10 minutes to start the upload
const DOWNLOAD_URL_TTL = 60 * 60; // 1 hour of admin viewing

function env() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  return { accountId, accessKeyId, secretAccessKey, bucket };
}

export function isR2Configured() {
  return env() !== null;
}

/**
 * A SECOND, separate bucket for genuinely public assets — service catalogue
 * photos, not customer uploads. Kept apart from `env()` above on purpose:
 * that bucket stays private forever (customers' homes), this one is meant to
 * have its Public Development URL or a custom domain switched on. Same
 * account and credentials work for both as long as the R2 API token is
 * scoped to include this bucket too — see docs/DEPLOYMENT.md.
 */
function publicEnv() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_PUBLIC_BUCKET;
  const publicHost = process.env.NEXT_PUBLIC_R2_PUBLIC_HOST;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicHost) return null;
  return { accountId, accessKeyId, secretAccessKey, bucket, publicHost };
}

export function isR2PublicConfigured() {
  return publicEnv() !== null;
}

let cached: S3Client | null = null;

function client(config: NonNullable<ReturnType<typeof env>>) {
  if (cached) return cached;
  cached = new S3Client({
    // R2 ignores the region but the SDK insists on one.
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    // Without these two, SDK v3 bakes an `x-amz-checksum-crc32` for an EMPTY
    // body into the presigned query string. The browser then PUTs real bytes,
    // the checksum no longer matches, and R2 rejects every upload. Verified
    // against @aws-sdk/client-s3 3.1129.0 — do not remove.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return cached;
}

/** Strips anything that would make a messy or unsafe object key. */
function safeFilename(input: string) {
  const cleaned = input
    .normalize("NFKD")
    .replace(/[^\w.\- ]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(-80);
  return cleaned || "upload";
}

export type UploadTarget = {
  /** PUT the file here, with a Content-Type header that matches exactly. */
  url: string;
  /** Store this on the Attachment row. */
  key: string;
  expiresIn: number;
};

/**
 * Presigns a single browser upload.
 *
 * The client MUST send `Content-Type: <contentType>` on the PUT — R2 signs the
 * header, so a mismatch is rejected. The bucket also needs a CORS policy
 * allowing PUT from the site's origin; see docs/DEPLOYMENT.md.
 */
export async function presignUpload(opts: {
  /** Namespaces the object, e.g. a booking reference like SF-7K2QD4. */
  reference: string;
  filename: string;
  contentType: string;
  size: number;
}): Promise<
  { ok: true; target: UploadTarget } | { ok: false; reason: string }
> {
  const config = env();
  if (!config) return { ok: false, reason: "R2 is not configured" };

  if (!ALLOWED_MIME_TYPES.includes(opts.contentType as AllowedMimeType)) {
    return { ok: false, reason: "That file type isn't supported" };
  }
  if (!Number.isFinite(opts.size) || opts.size <= 0) {
    return { ok: false, reason: "That file looks empty" };
  }
  if (opts.size > MAX_UPLOAD_BYTES) {
    return { ok: false, reason: "That file is larger than 100 MB" };
  }

  const reference = opts.reference.replace(/[^A-Za-z0-9-]/g, "") || "unfiled";
  const key = `bookings/${reference}/${crypto.randomUUID()}-${safeFilename(opts.filename)}`;

  const url = await getSignedUrl(
    client(config),
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      ContentType: opts.contentType,
      ContentLength: opts.size,
    }),
    {
      expiresIn: UPLOAD_URL_TTL,
      // The SDK drops content-type from SignedHeaders by default, which would
      // let a client store any type it liked under a key we handed it. Signing
      // both pins the upload to exactly the file that was declared.
      signableHeaders: new Set(["content-type", "content-length"]),
    },
  );

  return { ok: true, target: { url, key, expiresIn: UPLOAD_URL_TTL } };
}

export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

/** 15 MB. Catalogue photos, not phone-video walkthroughs — no need for the 100 MB cap above. */
export const MAX_IMAGE_UPLOAD_BYTES = 15 * 1024 * 1024;

export type PublicUploadTarget = {
  /** PUT the file here, with a Content-Type header that matches exactly. */
  url: string;
  /** Store this on ServiceImage / Service.heroImage. */
  key: string;
  /** The URL to actually render — `https://${NEXT_PUBLIC_R2_PUBLIC_HOST}/${key}`. */
  publicUrl: string;
  expiresIn: number;
};

/**
 * Presigns a browser upload of a service photo into the PUBLIC bucket.
 * Same signing quirks as `presignUpload` above (see the comment there) —
 * this reuses the same S3Client and the same two load-bearing SDK options.
 */
export async function presignPublicImageUpload(opts: {
  /** Namespaces the object, e.g. a service slug. */
  folder: string;
  filename: string;
  contentType: string;
  size: number;
}): Promise<{ ok: true; target: PublicUploadTarget } | { ok: false; reason: string }> {
  const config = publicEnv();
  if (!config) return { ok: false, reason: "Photo storage isn't configured yet" };

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(opts.contentType as AllowedImageMimeType)) {
    return { ok: false, reason: "Use a JPEG, PNG or WebP image" };
  }
  if (!Number.isFinite(opts.size) || opts.size <= 0) {
    return { ok: false, reason: "That file looks empty" };
  }
  if (opts.size > MAX_IMAGE_UPLOAD_BYTES) {
    return { ok: false, reason: "That image is larger than 15 MB" };
  }

  const folder = opts.folder.replace(/[^a-z0-9-]/gi, "") || "general";
  const key = `services/${folder}/${crypto.randomUUID()}-${safeFilename(opts.filename)}`;

  return { ok: true, target: await signPublicPut(config, key, opts.contentType, opts.size) };
}

/**
 * Presigns a gallery upload (photo, video, or a video's poster frame) into
 * the PUBLIC bucket under `gallery/YYYY/MM/`. Unlike service photos, video is
 * allowed here — these are the business's own completed-job clips, published
 * with the customer's agreement (privacy policy, "How long we keep it").
 */
export async function presignPublicGalleryUpload(opts: {
  filename: string;
  contentType: string;
  size: number;
}): Promise<{ ok: true; target: PublicUploadTarget } | { ok: false; reason: string }> {
  const config = publicEnv();
  if (!config) return { ok: false, reason: "Photo storage isn't configured yet" };

  const type = mediaTypeFor(opts.contentType);
  if (!type) return { ok: false, reason: "Use a JPEG, PNG or WebP photo, or an MP4, MOV or WebM video" };
  if (!Number.isFinite(opts.size) || opts.size <= 0) {
    return { ok: false, reason: "That file looks empty" };
  }
  if (opts.size > maxBytesFor(type)) {
    return { ok: false, reason: type === "VIDEO" ? "That video is larger than 100 MB" : "That photo is larger than 15 MB" };
  }

  const month = new Date().toISOString().slice(0, 7).replace("-", "/");
  const key = `gallery/${month}/${crypto.randomUUID()}-${safeFilename(opts.filename)}`;

  return { ok: true, target: await signPublicPut(config, key, opts.contentType, opts.size) };
}

async function signPublicPut(
  config: NonNullable<ReturnType<typeof publicEnv>>,
  key: string,
  contentType: string,
  size: number,
): Promise<PublicUploadTarget> {
  const url = await getSignedUrl(
    client(config),
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    }),
    {
      expiresIn: UPLOAD_URL_TTL,
      signableHeaders: new Set(["content-type", "content-length"]),
    },
  );
  return { url, key, publicUrl: `https://${config.publicHost}/${key}`, expiresIn: UPLOAD_URL_TTL };
}

/** Public URL for a key in the public bucket, or null when no public host is set. */
export function publicObjectUrl(key: string) {
  const host = process.env.NEXT_PUBLIC_R2_PUBLIC_HOST;
  return host ? `https://${host}/${key}` : null;
}

/** Used when a photo is removed from a service's gallery. Never throws. */
export async function deletePublicObject(key: string) {
  const config = publicEnv();
  if (!config) return { ok: false as const, reason: "Photo storage isn't configured" };
  try {
    await client(config).send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
    return { ok: true as const };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown R2 error";
    console.error("[r2 public delete failed]", reason);
    return { ok: false as const, reason };
  }
}

/** Short-lived read URL, for showing an attachment in the admin dashboard. */
export async function presignDownload(key: string, expiresIn = DOWNLOAD_URL_TTL) {
  const config = env();
  if (!config) return null;
  return getSignedUrl(
    client(config),
    new GetObjectCommand({ Bucket: config.bucket, Key: key }),
    { expiresIn },
  );
}

/** Used when a booking is deleted, or an upload is abandoned. Never throws. */
export async function deleteObject(key: string) {
  const config = env();
  if (!config) return { ok: false as const, reason: "R2 is not configured" };
  try {
    await client(config).send(
      new DeleteObjectCommand({ Bucket: config.bucket, Key: key }),
    );
    return { ok: true as const };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown R2 error";
    console.error("[r2 delete failed]", reason);
    return { ok: false as const, reason };
  }
}
