-- DropForeignKey
ALTER TABLE "JiraAssignableUser" DROP CONSTRAINT "JiraAssignableUser_siteId_fkey";

-- AddForeignKey
ALTER TABLE "JiraAssignableUser" ADD CONSTRAINT "JiraAssignableUser_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "JiraSite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
