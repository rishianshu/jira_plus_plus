-- CreateTable
CREATE TABLE "PerformanceReviewNote" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "trackedUserId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "markdown" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceReviewNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceReviewNote_projectId_trackedUserId_managerId_sta_key" ON "PerformanceReviewNote"("projectId", "trackedUserId", "managerId", "startDate", "endDate");

-- AddForeignKey
ALTER TABLE "PerformanceReviewNote" ADD CONSTRAINT "PerformanceReviewNote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "JiraProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceReviewNote" ADD CONSTRAINT "PerformanceReviewNote_trackedUserId_fkey" FOREIGN KEY ("trackedUserId") REFERENCES "ProjectTrackedUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceReviewNote" ADD CONSTRAINT "PerformanceReviewNote_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
