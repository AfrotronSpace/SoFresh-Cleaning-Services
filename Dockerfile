# So Fresh Cleaning Service — Railway deployment image.
#
# Three stages: install deps, build, then a lean runtime image holding only
# the Next.js "standalone" server output. Debian slim (not Alpine) throughout,
# so Prisma's engine binaries need no musl/OpenSSL workarounds — see
# docs/DEPLOYMENT.md for why that footgun matters here.
#
# Build-time ARGs below are dummy values so `next build` can run without a
# real database or secret — nothing queries Postgres at build time (every
# public page is `force-dynamic`), and AUTH_SECRET is only read inside request
# handlers. The REAL values are supplied by Railway as runtime environment
# variables and take over the moment the container starts.

FROM node:20-bookworm-slim AS base
# "slim" genuinely has no OpenSSL. Without it Prisma can't detect which engine
# binary to load and silently falls back to a guess (openssl-1.1.x) — verified
# by running the built image: it warned on every start and only kept working
# by accident, because this repo's own dev machine had also generated a 1.1.x
# engine locally. Installing openssl makes Prisma's detection deterministic
# and matches the debian-openssl-3.0.x target pinned in schema.prisma.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

# ---------------------------------------------------------------- deps
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
# --ignore-scripts: the postinstall (`prisma generate`) needs the schema,
# which isn't copied yet. Generation happens explicitly in the builder stage.
RUN pnpm install --frozen-lockfile --ignore-scripts

# ---------------------------------------------------------------- builder
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG DATABASE_URL="postgresql://build:build@localhost:5432/build"
ARG DIRECT_URL="postgresql://build:build@localhost:5432/build"
ARG AUTH_SECRET="build-time-placeholder-not-used-at-runtime"
ARG NEXT_PUBLIC_SITE_URL="https://sofreshcleaning.co.uk"
ARG NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=""
ARG NEXT_PUBLIC_R2_PUBLIC_HOST=""
ENV DATABASE_URL=$DATABASE_URL \
    DIRECT_URL=$DIRECT_URL \
    AUTH_SECRET=$AUTH_SECRET \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=$NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION \
    NEXT_PUBLIC_R2_PUBLIC_HOST=$NEXT_PUBLIC_R2_PUBLIC_HOST \
    NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# ---------------------------------------------------------------- runner
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME="0.0.0.0"

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

# The standalone server entrypoint plus its own pruned `.next` build output
# (manifests etc — NOT node_modules; see below for why).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone/server.js ./server.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# The FULL node_modules from the builder stage, not the pruned one standalone
# traces. Two reasons this is deliberate, not an oversight:
#
#  1. Railway runs `prisma migrate deploy` against this same image
#     (railway.json → deploy.preDeployCommand). The Prisma CLI is a real
#     `dependencies` entry (see package.json) precisely so it survives here,
#     but standalone's tracer only follows what the running SERVER actually
#     imports — it correctly omits a CLI nothing in the request path calls.
#  2. This is a pnpm project: the real package contents live inside
#     `node_modules/.pnpm/<name>@<version>_<hash>/...`, with plain symlinks at
#     the top level. Cherry-picking those hashed paths in a Dockerfile is
#     fragile — they change on every dependency bump. Copying the whole tree
#     in one shot preserves every relative symlink correctly and needs no
#     maintenance. Verified: the generated Prisma client (with its
#     debian-openssl-3.0.x engine binary) IS present here, because `pnpm
#     build` ran `prisma generate` in this same builder stage.
#
# The image is larger than a "pure" standalone build as a result. At this
# project's scale that costs nothing that matters; do not "optimize" this away
# without re-solving problem #1 above.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# `npm run create-admin` (and `prisma/seed.ts`) run via `tsx` inside this same
# container — e.g. `railway ssh` then the command below — not through the
# Next.js server, so the standalone tracer above never sees them and they need
# copying explicitly. Both only import `src/lib/password.ts` via a relative
# path, so that's all of `src/` this image needs; tsconfig.json is included
# too in case a future script reaches for the `@/*` alias instead.
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/password.ts ./src/lib/password.ts
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json

USER nextjs

# Railway injects PORT and expects the app to listen on it, bound to 0.0.0.0
# (set above via HOSTNAME). The standalone server reads both automatically.
EXPOSE 3000

CMD ["node", "server.js"]
