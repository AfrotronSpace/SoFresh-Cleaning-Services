-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "ReviewSource" AS ENUM ('GOOGLE', 'WEBSITE');

-- DropIndex
DROP INDEX "Testimonial_active_sortOrder_idx";

-- AlterTable
ALTER TABLE "SiteSetting" ADD COLUMN     "emailReviewToAdmin" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: add the new columns alongside the old ones so existing rows can be carried over.
ALTER TABLE "Testimonial"
ADD COLUMN     "email" TEXT,
ADD COLUMN     "jobId" TEXT,
ADD COLUMN     "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userId" TEXT,
ADD COLUMN     "sourceNew" "ReviewSource" NOT NULL DEFAULT 'GOOGLE';

-- active=true becomes APPROVED, except the seeded "[Paste this customer's real
-- Google review text here …]" placeholders, which go to the moderation queue
-- instead of staying on the homepage (docs/FINDINGS.md #4).
UPDATE "Testimonial" SET "status" = CASE
  WHEN "body" LIKE '[Paste this customer%' THEN 'PENDING'::"ReviewStatus"
  WHEN "active" THEN 'APPROVED'::"ReviewStatus"
  ELSE 'HIDDEN'::"ReviewStatus"
END;

UPDATE "Testimonial" SET "sourceNew" = CASE
  WHEN lower("source") = 'website' THEN 'WEBSITE'::"ReviewSource"
  ELSE 'GOOGLE'::"ReviewSource"
END;

ALTER TABLE "Testimonial" DROP COLUMN "active";
ALTER TABLE "Testimonial" DROP COLUMN "source";
ALTER TABLE "Testimonial" RENAME COLUMN "sourceNew" TO "source";

-- Prisma manages updatedAt itself; the default above only existed to backfill.
ALTER TABLE "Testimonial" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Testimonial_status_featured_sortOrder_idx" ON "Testimonial"("status", "featured", "sortOrder");

-- CreateIndex
CREATE INDEX "Testimonial_jobId_idx" ON "Testimonial"("jobId");

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "GalleryJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
