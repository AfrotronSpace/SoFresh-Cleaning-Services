-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('PHOTO', 'VIDEO');

-- CreateEnum
CREATE TYPE "MediaLayout" AS ENUM ('SINGLE', 'BEFORE_AFTER');

-- CreateTable
CREATE TABLE "GalleryJob" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "completedOn" DATE,
    "area" TEXT,
    "serviceId" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GalleryJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryMedia" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "layout" "MediaLayout" NOT NULL DEFAULT 'SINGLE',
    "primaryType" "MediaType" NOT NULL,
    "primaryKey" TEXT NOT NULL,
    "primaryPoster" TEXT,
    "primaryWidth" INTEGER,
    "primaryHeight" INTEGER,
    "primaryAlt" TEXT NOT NULL DEFAULT '',
    "secondaryType" "MediaType",
    "secondaryKey" TEXT,
    "secondaryPoster" TEXT,
    "secondaryWidth" INTEGER,
    "secondaryHeight" INTEGER,
    "secondaryAlt" TEXT NOT NULL DEFAULT '',
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GalleryMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GalleryJob_published_featured_completedOn_idx" ON "GalleryJob"("published", "featured", "completedOn");

-- CreateIndex
CREATE INDEX "GalleryJob_serviceId_idx" ON "GalleryJob"("serviceId");

-- CreateIndex
CREATE INDEX "GalleryMedia_jobId_sortOrder_idx" ON "GalleryMedia"("jobId", "sortOrder");

-- AddForeignKey
ALTER TABLE "GalleryJob" ADD CONSTRAINT "GalleryJob_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryMedia" ADD CONSTRAINT "GalleryMedia_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "GalleryJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Hand-added: Prisma can't express CHECK constraints (and ignores them when
-- diffing, so this never shows as drift). A SINGLE frame has no second slot;
-- a BEFORE_AFTER frame must have both.
ALTER TABLE "GalleryMedia" ADD CONSTRAINT "GalleryMedia_layout_slots_check" CHECK (
  ("layout" = 'SINGLE' AND "secondaryKey" IS NULL AND "secondaryType" IS NULL)
  OR ("layout" = 'BEFORE_AFTER' AND "secondaryKey" IS NOT NULL AND "secondaryType" IS NOT NULL)
);
