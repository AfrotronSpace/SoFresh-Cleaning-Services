import { NextResponse } from "next/server";
import { getAdminOrNull } from "@/lib/auth";
import { presignPublicImageUpload, isR2PublicConfigured, ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_UPLOAD_BYTES } from "@/lib/r2";

export const runtime = "nodejs";

/** Presigns a service-photo upload for Admin → Services. Never touches the private booking-uploads bucket. */
export async function POST(request: Request) {
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: "Sign in as an admin to upload photos." }, { status: 401 });

  if (!isR2PublicConfigured()) {
    return NextResponse.json({ error: "Photo storage isn't configured yet. Paste an image URL instead." }, { status: 503 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "We couldn't read that request." }, { status: 400 });
  }

  const body = payload as { folder?: unknown; filename?: unknown; contentType?: unknown; size?: unknown };
  const folder = String(body.folder ?? "general");
  const filename = String(body.filename ?? "photo");
  const contentType = String(body.contentType ?? "");
  const size = Number(body.size);

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(contentType as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    return NextResponse.json({ error: "Use a JPEG, PNG or WebP image." }, { status: 422 });
  }
  if (!Number.isFinite(size) || size <= 0 || size > MAX_IMAGE_UPLOAD_BYTES) {
    return NextResponse.json({ error: "That image is too large or looks empty." }, { status: 422 });
  }

  const result = await presignPublicImageUpload({ folder, filename, contentType, size });
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 422 });

  return NextResponse.json(result.target);
}
