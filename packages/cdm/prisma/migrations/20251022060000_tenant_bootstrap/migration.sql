-- DropIndex
ALTER TABLE "Comment" DROP CONSTRAINT IF EXISTS "Comment_jiraId_key";

-- DropIndex
ALTER TABLE "DailySummary" DROP CONSTRAINT IF EXISTS "DailySummary_userId_projectId_date_key";

-- DropIndex
ALTER TABLE "Issue" DROP CONSTRAINT IF EXISTS "Issue_jiraId_key";

-- DropIndex
ALTER TABLE "JiraAssignableUser" DROP CONSTRAINT IF EXISTS "JiraAssignableUser_siteId_projectKey_accountId_key";

-- DropIndex
DROP INDEX IF EXISTS "JiraAssignableUser_siteId_projectKey_idx";

-- DropIndex
ALTER TABLE "JiraProject" DROP CONSTRAINT IF EXISTS "JiraProject_siteId_jiraId_key";

-- DropIndex
ALTER TABLE "JiraProject" DROP CONSTRAINT IF EXISTS "JiraProject_siteId_key_key";

-- DropIndex
ALTER TABLE "JiraSite" DROP CONSTRAINT IF EXISTS "JiraSite_alias_key";

-- DropIndex
ALTER TABLE "JiraSite" DROP CONSTRAINT IF EXISTS "JiraSite_baseUrl_key";

-- DropIndex
ALTER TABLE "JiraUser" DROP CONSTRAINT IF EXISTS "JiraUser_accountId_key";

-- DropIndex
ALTER TABLE "PerformanceReviewNote" DROP CONSTRAINT IF EXISTS "PerformanceReviewNote_projectId_trackedUserId_managerId_sta_key";

-- DropIndex
ALTER TABLE "ProjectTrackedUser" DROP CONSTRAINT IF EXISTS "ProjectTrackedUser_projectId_jiraAccountId_key";

-- DropIndex
ALTER TABLE "Sprint" DROP CONSTRAINT IF EXISTS "Sprint_jiraId_key";

-- DropIndex
ALTER TABLE "SyncJob" DROP CONSTRAINT IF EXISTS "SyncJob_scheduleId_key";

-- DropIndex
ALTER TABLE "SyncJob" DROP CONSTRAINT IF EXISTS "SyncJob_workflowId_key";

-- DropIndex
ALTER TABLE "SyncState" DROP CONSTRAINT IF EXISTS "SyncState_projectId_entity_key";

-- DropIndex
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_email_key";

-- DropIndex
ALTER TABLE "UserProjectLink" DROP CONSTRAINT IF EXISTS "UserProjectLink_userId_projectId_key";

-- DropIndex
ALTER TABLE "Worklog" DROP CONSTRAINT IF EXISTS "Worklog_jiraId_key";

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'dev';

-- AlterTable
ALTER TABLE "Credential" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'dev';

-- AlterTable
ALTER TABLE "DailySummary" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'dev';

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'dev';

-- AlterTable
ALTER TABLE "JiraAssignableUser" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'dev';

-- AlterTable
ALTER TABLE "JiraProject" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'dev';

-- AlterTable
ALTER TABLE "JiraSite" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'dev';

-- AlterTable
ALTER TABLE "JiraUser" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'dev';

-- AlterTable
ALTER TABLE "PerformanceReviewNote" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'dev';

-- AlterTable
ALTER TABLE "ProjectTrackedUser" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'dev';

-- AlterTable
ALTER TABLE "Sprint" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'dev';

-- AlterTable
ALTER TABLE "SyncJob" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'dev';

-- AlterTable
ALTER TABLE "SyncLog" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'dev';

-- AlterTable
ALTER TABLE "SyncState" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'dev';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'dev';

-- AlterTable
ALTER TABLE "UserProjectLink" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'dev',
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Worklog" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'dev';

-- Ensure required extensions for tenancy/vector workloads
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Tenant" ("id", "slug", "name")
VALUES ('dev', 'dev', 'Default Tenant')
ON CONFLICT ("id") DO NOTHING;

-- Normalize or create DocChunk store (vector embeddings)
DO $$
BEGIN
  IF to_regclass('public."DocChunk"') IS NULL AND to_regclass('public.doc_chunk') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'doc_chunk' AND column_name = 'doc_id') THEN
      ALTER TABLE doc_chunk RENAME COLUMN doc_id TO "docId";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'doc_chunk' AND column_name = 'section_id') THEN
      ALTER TABLE doc_chunk RENAME COLUMN section_id TO "sectionId";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'doc_chunk' AND column_name = 'tenant_id') THEN
      ALTER TABLE doc_chunk RENAME COLUMN tenant_id TO "tenantId";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'doc_chunk' AND column_name = 'ref_id') THEN
      ALTER TABLE doc_chunk RENAME COLUMN ref_id TO "refId";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'doc_chunk' AND column_name = 'ts') THEN
      ALTER TABLE doc_chunk RENAME COLUMN ts TO "createdAt";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'doc_chunk' AND column_name = 'text') THEN
      ALTER TABLE doc_chunk RENAME COLUMN text TO "body";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'doc_chunk' AND column_name = 'embedding') THEN
      ALTER TABLE doc_chunk ALTER COLUMN embedding TYPE vector(768);
    END IF;
    ALTER TABLE doc_chunk RENAME TO "DocChunk";
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "DocChunk" (
    "docId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'dev',
    "source" TEXT NOT NULL CHECK ("source" IN ('jira','attachment','confluence','code','catalog')),
    "refId" TEXT,
    "title" TEXT,
    "body" TEXT,
    "embedding" vector(768),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "hash" TEXT,

    CONSTRAINT "DocChunk_pkey" PRIMARY KEY ("docId", "sectionId")
);

ALTER TABLE "DocChunk"
  ALTER COLUMN "tenantId" SET DEFAULT 'dev',
  ALTER COLUMN "tenantId" SET NOT NULL,
  ADD COLUMN IF NOT EXISTS "metadata" JSONB,
  ADD COLUMN IF NOT EXISTS "hash" TEXT,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS "DocChunk_embedding_idx"
  ON "DocChunk" USING ivfflat ("embedding" vector_cosine_ops);

CREATE INDEX IF NOT EXISTS "DocChunk_tenant_source_idx"
  ON "DocChunk" ("tenantId", "source");

CREATE INDEX IF NOT EXISTS "DocChunk_tenant_ref_idx"
  ON "DocChunk" ("tenantId", "refId");

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'dev',
    "source" TEXT NOT NULL,
    "externalKey" TEXT NOT NULL,
    "project" TEXT,
    "type" TEXT,
    "status" TEXT,
    "title" TEXT NOT NULL,
    "desc" TEXT,
    "labels" TEXT[],
    "assignee" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artifact" (
    "id" BIGSERIAL NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'dev',
    "ticketId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "sha256" TEXT,
    "uri" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Artifact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Ticket_tenantId_status_idx" ON "Ticket"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_tenantId_externalKey_key" ON "Ticket"("tenantId", "externalKey");

-- CreateIndex
CREATE INDEX "Artifact_tenantId_ticketId_idx" ON "Artifact"("tenantId", "ticketId");

-- CreateIndex
CREATE INDEX "Comment_tenantId_issueId_idx" ON "Comment"("tenantId", "issueId");

-- CreateIndex
CREATE UNIQUE INDEX "Comment_tenantId_jiraId_key" ON "Comment"("tenantId", "jiraId");

-- CreateIndex
CREATE INDEX "Credential_tenantId_idx" ON "Credential"("tenantId");

-- CreateIndex
CREATE INDEX "DailySummary_tenantId_projectId_idx" ON "DailySummary"("tenantId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "DailySummary_tenantId_userId_projectId_date_key" ON "DailySummary"("tenantId", "userId", "projectId", "date");

-- CreateIndex
CREATE INDEX "Issue_tenantId_projectId_idx" ON "Issue"("tenantId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Issue_tenantId_jiraId_key" ON "Issue"("tenantId", "jiraId");

-- CreateIndex
CREATE UNIQUE INDEX "Issue_tenantId_key_key" ON "Issue"("tenantId", "key");

-- CreateIndex
CREATE INDEX "JiraAssignableUser_tenantId_siteId_projectKey_idx" ON "JiraAssignableUser"("tenantId", "siteId", "projectKey");

-- CreateIndex
CREATE UNIQUE INDEX "JiraAssignableUser_tenantId_siteId_projectKey_accountId_key" ON "JiraAssignableUser"("tenantId", "siteId", "projectKey", "accountId");

-- CreateIndex
CREATE INDEX "JiraProject_tenantId_idx" ON "JiraProject"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "JiraProject_tenantId_siteId_jiraId_key" ON "JiraProject"("tenantId", "siteId", "jiraId");

-- CreateIndex
CREATE UNIQUE INDEX "JiraProject_tenantId_siteId_key_key" ON "JiraProject"("tenantId", "siteId", "key");

-- CreateIndex
CREATE INDEX "JiraSite_tenantId_idx" ON "JiraSite"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "JiraSite_tenantId_alias_key" ON "JiraSite"("tenantId", "alias");

-- CreateIndex
CREATE UNIQUE INDEX "JiraSite_tenantId_baseUrl_key" ON "JiraSite"("tenantId", "baseUrl");

-- CreateIndex
CREATE INDEX "JiraUser_tenantId_idx" ON "JiraUser"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "JiraUser_tenantId_accountId_key" ON "JiraUser"("tenantId", "accountId");

-- CreateIndex
CREATE INDEX "PerformanceReviewNote_tenantId_projectId_idx" ON "PerformanceReviewNote"("tenantId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceReviewNote_tenantId_projectId_trackedUserId_mana_key" ON "PerformanceReviewNote"("tenantId", "projectId", "trackedUserId", "managerId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "ProjectTrackedUser_tenantId_idx" ON "ProjectTrackedUser"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTrackedUser_tenantId_projectId_jiraAccountId_key" ON "ProjectTrackedUser"("tenantId", "projectId", "jiraAccountId");

-- CreateIndex
CREATE INDEX "Sprint_tenantId_idx" ON "Sprint"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Sprint_tenantId_jiraId_key" ON "Sprint"("tenantId", "jiraId");

-- CreateIndex
CREATE INDEX "SyncJob_tenantId_status_idx" ON "SyncJob"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SyncJob_tenantId_workflowId_key" ON "SyncJob"("tenantId", "workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "SyncJob_tenantId_scheduleId_key" ON "SyncJob"("tenantId", "scheduleId");

-- CreateIndex
CREATE INDEX "SyncLog_tenantId_projectId_idx" ON "SyncLog"("tenantId", "projectId");

-- CreateIndex
CREATE INDEX "SyncState_tenantId_projectId_idx" ON "SyncState"("tenantId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "SyncState_tenantId_projectId_entity_key" ON "SyncState"("tenantId", "projectId", "entity");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");

-- CreateIndex
CREATE INDEX "UserProjectLink_tenantId_projectId_idx" ON "UserProjectLink"("tenantId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProjectLink_tenantId_userId_projectId_key" ON "UserProjectLink"("tenantId", "userId", "projectId");

-- CreateIndex
CREATE INDEX "Worklog_tenantId_issueId_idx" ON "Worklog"("tenantId", "issueId");

-- CreateIndex
CREATE UNIQUE INDEX "Worklog_tenantId_jiraId_key" ON "Worklog"("tenantId", "jiraId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JiraUser" ADD CONSTRAINT "JiraUser_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JiraSite" ADD CONSTRAINT "JiraSite_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JiraProject" ADD CONSTRAINT "JiraProject_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTrackedUser" ADD CONSTRAINT "ProjectTrackedUser_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JiraAssignableUser" ADD CONSTRAINT "JiraAssignableUser_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sprint" ADD CONSTRAINT "Sprint_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Worklog" ADD CONSTRAINT "Worklog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProjectLink" ADD CONSTRAINT "UserProjectLink_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySummary" ADD CONSTRAINT "DailySummary_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceReviewNote" ADD CONSTRAINT "PerformanceReviewNote_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncJob" ADD CONSTRAINT "SyncJob_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncState" ADD CONSTRAINT "SyncState_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey (DocChunk -> Tenant) if both exist
DO $$
BEGIN
  IF to_regclass('public."DocChunk"') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DocChunk_tenantId_fkey') THEN
    ALTER TABLE "DocChunk"
      ADD CONSTRAINT "DocChunk_tenantId_fkey"
      FOREIGN KEY ("tenantId")
      REFERENCES "Tenant"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

-- Tenant scoping helper & RLS policies
CREATE OR REPLACE FUNCTION set_tenant(t TEXT) RETURNS VOID LANGUAGE SQL AS $$
  SELECT set_config('app.current_tenant', COALESCE(NULLIF(t, ''), 'dev'), TRUE)
$$;

DO $$
BEGIN
  IF to_regclass('public."Ticket"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE "Ticket" ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'rls_ticket_by_tenant') THEN
      CREATE POLICY rls_ticket_by_tenant ON "Ticket"
        USING ("tenantId" = current_setting('app.current_tenant', true));
    END IF;
  END IF;

  IF to_regclass('public."Comment"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'rls_comment_by_tenant') THEN
      CREATE POLICY rls_comment_by_tenant ON "Comment"
        USING ("tenantId" = current_setting('app.current_tenant', true));
    END IF;
  END IF;

  IF to_regclass('public."Artifact"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE "Artifact" ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'rls_artifact_by_tenant') THEN
      CREATE POLICY rls_artifact_by_tenant ON "Artifact"
        USING ("tenantId" = current_setting('app.current_tenant', true));
    END IF;
  END IF;

  IF to_regclass('public."DocChunk"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE "DocChunk" ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'rls_docchunk_by_tenant') THEN
      CREATE POLICY rls_docchunk_by_tenant ON "DocChunk"
        USING ("tenantId" = current_setting('app.current_tenant', true));
    END IF;
  END IF;
END $$;
