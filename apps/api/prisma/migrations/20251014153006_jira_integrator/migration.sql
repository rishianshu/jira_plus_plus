/*
  Warnings:

  - You are about to drop the column `author` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `sprint` on the `Issue` table. All the data in the column will be lost.
  - You are about to drop the column `author` on the `Worklog` table. All the data in the column will be lost.
  - You are about to drop the column `loggedAt` on the `Worklog` table. All the data in the column will be lost.
  - Added the required column `authorId` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jiraCreatedAt` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jiraCreatedAt` to the `Issue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jiraUpdatedAt` to the `Issue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectId` to the `Issue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `authorId` to the `Worklog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jiraStartedAt` to the `Worklog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jiraUpdatedAt` to the `Worklog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Worklog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SyncJobStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ERROR');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('IDLE', 'RUNNING', 'SUCCESS', 'FAILED');

-- DropForeignKey
ALTER TABLE "Issue" DROP CONSTRAINT "Issue_assigneeId_fkey";

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "author",
ADD COLUMN     "authorId" TEXT NOT NULL,
ADD COLUMN     "jiraCreatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "jiraUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Issue" DROP COLUMN "sprint",
ADD COLUMN     "jiraCreatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "jiraUpdatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "priority" TEXT,
ADD COLUMN     "projectId" TEXT NOT NULL,
ADD COLUMN     "remoteData" JSONB,
ADD COLUMN     "sprintId" TEXT;

-- AlterTable
ALTER TABLE "Worklog" DROP COLUMN "author",
DROP COLUMN "loggedAt",
ADD COLUMN     "authorId" TEXT NOT NULL,
ADD COLUMN     "jiraStartedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "jiraUpdatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "JiraUser" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JiraUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sprint" (
    "id" TEXT NOT NULL,
    "jiraId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncJob" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "cronSchedule" TEXT NOT NULL,
    "status" "SyncJobStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncState" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "lastSyncTime" TIMESTAMP(3),
    "status" "SyncStatus" NOT NULL DEFAULT 'IDLE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JiraUser_accountId_key" ON "JiraUser"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Sprint_jiraId_key" ON "Sprint"("jiraId");

-- CreateIndex
CREATE UNIQUE INDEX "SyncJob_projectId_key" ON "SyncJob"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "SyncJob_workflowId_key" ON "SyncJob"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "SyncJob_scheduleId_key" ON "SyncJob"("scheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "SyncState_projectId_entity_key" ON "SyncState"("projectId", "entity");

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "JiraProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "JiraUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "JiraUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Worklog" ADD CONSTRAINT "Worklog_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "JiraUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncJob" ADD CONSTRAINT "SyncJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "JiraProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncState" ADD CONSTRAINT "SyncState_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "JiraProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "JiraProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
