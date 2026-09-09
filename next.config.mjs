/** @type {import('next').NextConfig} */

// Optional public R2 host — a custom domain such as media.sofreshcleaning.co.uk,
// or a pub-<hash>.r2.dev development URL. Only needed if public assets are ever
// served from R2. Customer photos are NOT served this way: they live in a
// private bucket and are read back through short-lived presigned URLs, which
// must not go through the image optimizer because they expire.
const r2PublicHost = process.env.NEXT_PUBLIC_R2_PUBLIC_HOST;

const nextConfig = {
  // Railway runs the app from a Docker image, not Vercel's build pipeline, so
  // the server must be a self-contained bundle. `standalone` produces
  // .next/standalone/server.js with only the files that are actually needed —
  // see the Dockerfile, which copies exactly this output into the runtime image.
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      ...(r2PublicHost ? [{ protocol: "https", hostname: r2PublicHost }] : []),
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/services/end-of-tenancy", destination: "/services/end-of-tenancy-cleaning", permanent: true },
      { source: "/deep-clean", destination: "/services/restoration-deep-clean", permanent: true },
    ];
  },
};
export default nextConfig;
