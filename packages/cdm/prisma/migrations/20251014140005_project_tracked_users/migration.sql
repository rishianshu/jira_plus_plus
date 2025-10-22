-- CreateTable
CREATE TABLE "ProjectTrackedUser" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "jiraAccountId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT,
    "avatarUrl" TEXT,
    "isTracked" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectTrackedUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTrackedUser_projectId_jiraAccountId_key" ON "ProjectTrackedUser"("projectId", "jiraAccountId");

-- AddForeignKey
ALTER TABLE "ProjectTrackedUser" ADD CONSTRAINT "ProjectTrackedUser_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "JiraProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
