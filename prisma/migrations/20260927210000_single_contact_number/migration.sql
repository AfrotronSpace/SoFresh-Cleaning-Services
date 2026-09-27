-- 07935 772485 is the single number for both calls and WhatsApp (confirmed
-- 2026-09-27, resolving the AFT-F-01 / revision disagreement in
-- docs/BUSINESS-RULES.md). The old numbers were 07386 528399 (calls) and
-- 07399 505686 (WhatsApp).

-- AlterTable
ALTER TABLE "SiteSetting" ALTER COLUMN "phone" SET DEFAULT '07935 772485',
ALTER COLUMN "whatsapp" SET DEFAULT '447935772485';

-- The live row overrides constants.ts, so move it too. Only values still set
-- to an old number are touched; anything changed in Admin -> Settings stays.
UPDATE "SiteSetting" SET "phone" = '07935 772485'
WHERE "phone" IN ('07386 528399', '07386528399', '447386528399', '+447386528399');

UPDATE "SiteSetting" SET "whatsapp" = '447935772485'
WHERE "whatsapp" IN ('447399505686', '07399505686', '07399 505686', '+447399505686');

UPDATE "SiteSetting" SET "whatsappForwardNumber" = '447935772485'
WHERE "whatsappForwardNumber" IN ('447399505686', '07399505686', '07399 505686', '+447399505686');
