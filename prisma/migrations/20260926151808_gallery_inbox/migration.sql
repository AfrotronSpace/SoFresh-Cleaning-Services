-- CreateTable
CREATE TABLE "GalleryInboxItem" (
    "id" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "key" TEXT NOT NULL,
    "poster" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "originalName" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GalleryInboxItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GalleryInboxItem_key_key" ON "GalleryInboxItem"("key");

-- CreateIndex
CREATE INDEX "GalleryInboxItem_originalName_createdAt_idx" ON "GalleryInboxItem"("originalName", "createdAt");
