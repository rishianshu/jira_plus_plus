-- Adjust DailySummary schema to support dated summaries with timestamps

ALTER TABLE "DailySummary"
    ADD COLUMN "date" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

ALTER TABLE "DailySummary"
    ADD COLUMN "projectId" TEXT;

ALTER TABLE "DailySummary"
    DROP CONSTRAINT IF EXISTS "DailySummary_userId_date_key";

UPDATE "DailySummary"
SET "date" = COALESCE("generatedAt", NOW()),
    "createdAt" = COALESCE("generatedAt", NOW());

-- Existing data is no longer compatible with the new shape. Purge so the table can be repopulated.
DELETE FROM "DailySummary";

ALTER TABLE "DailySummary"
    ALTER COLUMN "date" DROP DEFAULT;

ALTER TABLE "DailySummary"
    ALTER COLUMN "createdAt" SET DEFAULT NOW();

ALTER TABLE "DailySummary"
    ALTER COLUMN "updatedAt" SET DEFAULT NOW();

ALTER TABLE "DailySummary"
    DROP COLUMN IF EXISTS "generatedAt";

ALTER TABLE "DailySummary"
    ALTER COLUMN "projectId" SET NOT NULL;

ALTER TABLE "DailySummary"
    ADD CONSTRAINT "DailySummary_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "JiraProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DailySummary"
    ADD CONSTRAINT "DailySummary_userId_projectId_date_key" UNIQUE ("userId", "projectId", "date");
