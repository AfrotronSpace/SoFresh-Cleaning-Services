-- Two client decisions (10 Oct 2026):
--
--   1. The window to report a problem is 48 hours, not the 15 in AFT-F-02 F2.
--   2. The only price shown on the public site is £25 per hour for Commercial &
--      Office Cleaning. Every other service is quote-only; Mabel sets any other
--      price herself in Admin -> Services.
--
-- Each UPDATE matches the old seeded value exactly, so anything already changed
-- in Admin is left alone.

-- AlterTable
ALTER TABLE "SiteSetting" ALTER COLUMN "reclaimWindowHours" SET DEFAULT 48;

UPDATE "SiteSetting" SET "reclaimWindowHours" = 48 WHERE "reclaimWindowHours" = 15;

-- Restoration Deep Clean: was "from £350".
UPDATE "Service" SET "priceMode" = 'QUOTE_ONLY', "price" = NULL
WHERE "slug" = 'restoration-deep-clean' AND "priceMode" = 'FROM' AND "price" = 350;

UPDATE "Service" SET "minimumCharge" = NULL
WHERE "slug" = 'restoration-deep-clean' AND "minimumCharge" = 'Restoration deep cleans start at £350';

UPDATE "Service" SET "seoDescription" =
  'A detail-led deep clean for properties that need properly working through, not a surface clean. Fixed quotes from photos across Colchester, Ipswich and Essex.'
WHERE "slug" = 'restoration-deep-clean'
  AND "seoDescription" = 'A detail-led deep clean for properties that need properly working through, not a surface clean. Fixed prices from £350 across Colchester, Ipswich and Essex.';

-- Regular domestic cleaning: was £25 per hour.
UPDATE "Service" SET "priceMode" = 'QUOTE_ONLY', "price" = NULL
WHERE "slug" = 'regular-domestic-cleaning' AND "priceMode" = 'PER_HOUR' AND "price" = 25;

UPDATE "Service" SET "summary" = 'Colchester only, and only where we can maintain our standard. Subject to availability.'
WHERE "slug" = 'regular-domestic-cleaning'
  AND "summary" = 'Colchester only, and only where we can maintain our standard. £25 per hour, subject to availability.';

UPDATE "Service" SET "body" = replace("body", 'It is £25 per hour, with minimum booking requirements, and availability is genuinely limited.',
  'We quote it when you get in touch, with minimum booking requirements, and availability is genuinely limited.')
WHERE "slug" = 'regular-domestic-cleaning';

UPDATE "Service" SET "seoTitle" = 'Regular Domestic Cleaning in Colchester'
WHERE "slug" = 'regular-domestic-cleaning' AND "seoTitle" = 'Regular Domestic Cleaning in Colchester — £25 per hour';

UPDATE "Service" SET "seoDescription" =
  'A small number of regular domestic cleaning slots in Colchester. Limited availability and minimum booking requirements apply.'
WHERE "slug" = 'regular-domestic-cleaning'
  AND "seoDescription" = 'A small number of regular domestic cleaning slots in Colchester at £25 per hour. Limited availability and minimum booking requirements apply.';

-- Commercial & Office Cleaning: now £25 per hour.
UPDATE "Service" SET "priceMode" = 'PER_HOUR', "price" = 25
WHERE "slug" = 'commercial-office-cleaning' AND "priceMode" = 'QUOTE_ONLY' AND "price" IS NULL;
