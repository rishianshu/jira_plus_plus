-- AlterTable
ALTER TABLE "SyncJob"
ADD COLUMN     "backoffLevel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "backoffOriginalCron" TEXT,
ADD COLUMN     "backoffLastNotifiedAt" TIMESTAMP(3);
