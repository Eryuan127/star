PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "username" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'USER',
  "avatarUrl" TEXT,
  "backgroundUrl" TEXT,
  "bio" TEXT,
  "profileSections" TEXT NOT NULL DEFAULT 'offline,online,notes',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");

CREATE TABLE IF NOT EXISTS "DiaryEntry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "type" TEXT NOT NULL DEFAULT 'OFFLINE',
  "title" TEXT NOT NULL,
  "dateText" TEXT NOT NULL,
  "location" TEXT,
  "artist" TEXT,
  "summary" TEXT NOT NULL,
  "highlight" TEXT,
  "mediaUrl" TEXT,
  "isPinned" BOOLEAN NOT NULL DEFAULT false,
  "authorId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "DiaryEntry_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "DiaryEntry_authorId_idx" ON "DiaryEntry"("authorId");

CREATE TABLE IF NOT EXISTS "EntryTag" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "entryId" TEXT NOT NULL,
  CONSTRAINT "EntryTag_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "DiaryEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "EntryTag_entryId_idx" ON "EntryTag"("entryId");

CREATE TABLE IF NOT EXISTS "Goal" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "detail" TEXT NOT NULL,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  "dueText" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Skill" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "level" TEXT NOT NULL,
  "copy" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "mediaUrl" TEXT,
  "artist" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "SkillAchievement" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "detail" TEXT NOT NULL,
  "dateText" TEXT,
  "skillId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "SkillAchievement_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SkillAchievement_skillId_idx" ON "SkillAchievement"("skillId");

CREATE TABLE IF NOT EXISTS "ArtistSchedule" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "dateText" TEXT NOT NULL,
  "artist" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PLANNED',
  "note" TEXT,
  "linkUrl" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "MusicTrack" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "artist" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "mood" TEXT NOT NULL,
  "accent" TEXT NOT NULL,
  "audioUrl" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "VideoSpotlight" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "artist" TEXT NOT NULL,
  "publishDate" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "note" TEXT NOT NULL,
  "videoUrl" TEXT,
  "coverUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
