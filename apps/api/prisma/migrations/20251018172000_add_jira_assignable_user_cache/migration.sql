-- CreateTable
CREATE TABLE "JiraAssignableUser" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "projectKey" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "displayName" TEXT,
    "email" TEXT,
    "avatarUrl" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JiraAssignableUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JiraAssignableUser_siteId_projectKey_accountId_key" ON "JiraAssignableUser"("siteId", "projectKey", "accountId");

-- CreateIndex
CREATE INDEX "JiraAssignableUser_siteId_projectKey_idx" ON "JiraAssignableUser"("siteId", "projectKey");

-- AddForeignKey
ALTER TABLE "JiraAssignableUser" ADD CONSTRAINT "JiraAssignableUser_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "JiraSite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
