-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "CredentialType" AS ENUM ('LOCAL');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL,
    "type" "CredentialType" NOT NULL,
    "secretHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JiraSite" (
    "id" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "tokenCipher" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JiraSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JiraProject" (
    "id" TEXT NOT NULL,
    "jiraId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JiraProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProjectLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "jiraAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProjectLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Credential_userId_key" ON "Credential"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "JiraSite_alias_key" ON "JiraSite"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "JiraSite_baseUrl_key" ON "JiraSite"("baseUrl");

-- CreateIndex
CREATE UNIQUE INDEX "JiraProject_siteId_jiraId_key" ON "JiraProject"("siteId", "jiraId");

-- CreateIndex
CREATE UNIQUE INDEX "JiraProject_siteId_key_key" ON "JiraProject"("siteId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "UserProjectLink_userId_projectId_key" ON "UserProjectLink"("userId", "projectId");

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JiraSite" ADD CONSTRAINT "JiraSite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JiraProject" ADD CONSTRAINT "JiraProject_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "JiraSite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProjectLink" ADD CONSTRAINT "UserProjectLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProjectLink" ADD CONSTRAINT "UserProjectLink_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "JiraProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
