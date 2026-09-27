-- AlterTable
ALTER TABLE "Testimonial" ADD COLUMN     "externalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Testimonial_externalId_key" ON "Testimonial"("externalId");

