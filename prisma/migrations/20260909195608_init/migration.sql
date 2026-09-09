-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'ADMIN');

-- CreateEnum
CREATE TYPE "PropertyKind" AS ENUM ('APARTMENT', 'HOUSE', 'OFFICE', 'COMMERCIAL_UNIT', 'GARAGE', 'VEHICLE', 'OUTDOOR', 'OTHER');

-- CreateEnum
CREATE TYPE "ServiceGroup" AS ENUM ('SIGNATURE', 'TRANSITION', 'COMMERCIAL');

-- CreateEnum
CREATE TYPE "PriceMode" AS ENUM ('FROM', 'PER_HOUR', 'FIXED', 'QUOTE_ONLY');

-- CreateEnum
CREATE TYPE "Occupancy" AS ENUM ('OCCUPIED', 'EMPTY', 'PARTIALLY_FURNISHED');

-- CreateEnum
CREATE TYPE "PropertyCondition" AS ENUM ('LIGHT', 'MODERATE', 'HEAVY', 'BUILD_DUST', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AccessMethod" AS ENUM ('CUSTOMER_HOME', 'SOMEONE_WILL_MEET', 'KEY_LEFT', 'KEY_SAFE', 'AGENT_OR_LANDLORD', 'TO_BE_ARRANGED');

-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('STANDARD', 'SHORT_NOTICE', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('IN_REVIEW', 'INFO_NEEDED', 'QUOTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'DECLINED');

-- CreateEnum
CREATE TYPE "ContactPreference" AS ENUM ('WHATSAPP', 'PHONE', 'EMAIL');

-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('WEBSITE', 'WHATSAPP', 'PHONE', 'EMAIL', 'ADMIN');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'INTERNAL_NOTE');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'CLOSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "postcode" TEXT,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "group" "ServiceGroup" NOT NULL,
    "propertyKind" "PropertyKind" NOT NULL DEFAULT 'HOUSE',
    "priceMode" "PriceMode" NOT NULL DEFAULT 'QUOTE_ONLY',
    "price" DECIMAL(10,2),
    "negotiable" BOOLEAN NOT NULL DEFAULT false,
    "minimumCharge" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "includes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "excludes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "extras" JSONB,
    "durationEstimate" TEXT,
    "noticeHours" INTEGER NOT NULL DEFAULT 48,
    "requiresSurvey" BOOLEAN NOT NULL DEFAULT false,
    "photosRecommended" BOOLEAN NOT NULL DEFAULT true,
    "heroImage" TEXT,
    "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "faqs" JSONB,
    "whatsappPrompt" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 100,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "userId" TEXT,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contactPreference" "ContactPreference" NOT NULL DEFAULT 'WHATSAPP',
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "postcode" TEXT NOT NULL,
    "propertyKind" "PropertyKind" NOT NULL DEFAULT 'HOUSE',
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "occupancy" "Occupancy" NOT NULL DEFAULT 'OCCUPIED',
    "condition" "PropertyCondition" NOT NULL DEFAULT 'UNKNOWN',
    "preferredDate" TIMESTAMP(3) NOT NULL,
    "alternativeDate" TIMESTAMP(3),
    "timePreference" TEXT,
    "datesFlexible" BOOLEAN NOT NULL DEFAULT false,
    "urgency" "Urgency" NOT NULL DEFAULT 'STANDARD',
    "accessMethod" "AccessMethod" NOT NULL DEFAULT 'CUSTOMER_HOME',
    "parkingNotes" TEXT,
    "petsOnSite" BOOLEAN NOT NULL DEFAULT false,
    "allergyNotes" TEXT,
    "notes" TEXT,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "customBrief" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'IN_REVIEW',
    "source" "BookingSource" NOT NULL DEFAULT 'WEBSITE',
    "quotedTotal" DECIMAL(10,2),
    "quoteNotes" TEXT,
    "adminNotes" TEXT,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "customerEmailSentAt" TIMESTAMP(3),
    "adminEmailSentAt" TIMESTAMP(3),
    "whatsappForwardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingItem" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "serviceId" TEXT,
    "nameSnapshot" TEXT NOT NULL,
    "priceSnapshot" DECIMAL(10,2),
    "priceMode" "PriceMode" NOT NULL DEFAULT 'QUOTE_ONLY',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "extras" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,

    CONSTRAINT "BookingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingEvent" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "detail" TEXT,
    "actor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enquiry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "postcode" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "source" TEXT NOT NULL DEFAULT 'contact-page',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageLog" (
    "id" TEXT NOT NULL,
    "channel" "MessageChannel" NOT NULL DEFAULT 'EMAIL',
    "status" "MessageStatus" NOT NULL DEFAULT 'QUEUED',
    "toName" TEXT,
    "toAddress" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "recipientId" TEXT,
    "senderId" TEXT,
    "bookingId" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "businessName" TEXT NOT NULL DEFAULT 'So Fresh Cleaning Service',
    "legalName" TEXT NOT NULL DEFAULT 'So Fresh Cleaning Service Ltd',
    "companyNumber" TEXT NOT NULL DEFAULT '16423190',
    "tagline" TEXT NOT NULL DEFAULT 'Premium, detail-led cleaning across Essex and Suffolk',
    "phone" TEXT NOT NULL DEFAULT '07386 528399',
    "whatsapp" TEXT NOT NULL DEFAULT '447399505686',
    "email" TEXT NOT NULL DEFAULT 'info@sofreshcleaning.co.uk',
    "serviceAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "openingHours" TEXT NOT NULL DEFAULT 'Monday to Sunday, by appointment',
    "responsePromise" TEXT NOT NULL DEFAULT 'We reply the same day, usually much sooner during working hours.',
    "quoteWindow" TEXT NOT NULL DEFAULT 'Your fixed price arrives within 24 hours of us having everything we need.',
    "bookingFeeNote" TEXT NOT NULL DEFAULT 'A booking fee secures your date and comes off the final balance. We confirm the exact amount before you commit.',
    "cancellationHours" INTEGER NOT NULL DEFAULT 72,
    "reclaimWindowHours" INTEGER NOT NULL DEFAULT 15,
    "emailBookingToAdmin" BOOLEAN NOT NULL DEFAULT true,
    "emailBookingToCustomer" BOOLEAN NOT NULL DEFAULT true,
    "forwardBookingsToWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "whatsappForwardNumber" TEXT,
    "adminNotifyEmail" TEXT NOT NULL DEFAULT 'info@sofreshcleaning.co.uk',
    "adminNotifyCc" TEXT,
    "announcementText" TEXT,
    "announcementActive" BOOLEAN NOT NULL DEFAULT false,
    "heroSlides" JSONB,
    "googleReviewUrl" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "tiktokUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "area" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "body" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'Google',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AreaCovered" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "county" TEXT NOT NULL DEFAULT 'Essex',
    "blurb" TEXT,
    "priority" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "AreaCovered_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_active_sortOrder_idx" ON "Service"("active", "sortOrder");

-- CreateIndex
CREATE INDEX "Service_group_idx" ON "Service"("group");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_reference_key" ON "Booking"("reference");

-- CreateIndex
CREATE INDEX "Booking_status_createdAt_idx" ON "Booking"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- CreateIndex
CREATE INDEX "Booking_contactEmail_idx" ON "Booking"("contactEmail");

-- CreateIndex
CREATE INDEX "Booking_preferredDate_idx" ON "Booking"("preferredDate");

-- CreateIndex
CREATE INDEX "BookingItem_bookingId_idx" ON "BookingItem"("bookingId");

-- CreateIndex
CREATE INDEX "BookingItem_serviceId_idx" ON "BookingItem"("serviceId");

-- CreateIndex
CREATE INDEX "Attachment_bookingId_idx" ON "Attachment"("bookingId");

-- CreateIndex
CREATE INDEX "BookingEvent_bookingId_createdAt_idx" ON "BookingEvent"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "Enquiry_status_createdAt_idx" ON "Enquiry"("status", "createdAt");

-- CreateIndex
CREATE INDEX "MessageLog_recipientId_idx" ON "MessageLog"("recipientId");

-- CreateIndex
CREATE INDEX "MessageLog_bookingId_idx" ON "MessageLog"("bookingId");

-- CreateIndex
CREATE INDEX "MessageLog_createdAt_idx" ON "MessageLog"("createdAt");

-- CreateIndex
CREATE INDEX "Testimonial_active_sortOrder_idx" ON "Testimonial"("active", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AreaCovered_slug_key" ON "AreaCovered"("slug");

-- CreateIndex
CREATE INDEX "AreaCovered_active_sortOrder_idx" ON "AreaCovered"("active", "sortOrder");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingItem" ADD CONSTRAINT "BookingItem_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingItem" ADD CONSTRAINT "BookingItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingEvent" ADD CONSTRAINT "BookingEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
