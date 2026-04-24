-- Add scraper fields to Opportunity
ALTER TABLE "Opportunity" ADD COLUMN "source" TEXT;
ALTER TABLE "Opportunity" ADD COLUMN "externalId" TEXT;
ALTER TABLE "Opportunity" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT 1;

-- Add notifiedAt to Favorite
ALTER TABLE "Favorite" ADD COLUMN "notifiedAt" DATETIME;

-- CreateTable NotificationSetting
CREATE TABLE "NotificationSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "email" BOOLEAN NOT NULL DEFAULT 1,
    "daysBeforeDeadline" INTEGER NOT NULL DEFAULT 14,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "NotificationSetting_userId_key" ON "NotificationSetting"("userId");

-- CreateTable ScraperLog
CREATE TABLE "ScraperLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "added" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME
);

-- Unique constraint for deduplication
CREATE UNIQUE INDEX "Opportunity_source_externalId_key" ON "Opportunity"("source", "externalId");
