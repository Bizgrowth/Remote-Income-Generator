-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "skills" TEXT NOT NULL,
    "experienceLevel" TEXT,
    "minHourlyRate" REAL,
    "preferRemote" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Resume" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "originalFile" BLOB,
    "fileName" TEXT,
    "contactInfo" TEXT,
    "summary" TEXT,
    "experience" TEXT,
    "education" TEXT,
    "skills" TEXT,
    "certifications" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Resume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FavoriteJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "externalId" TEXT,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "salary" TEXT,
    "location" TEXT,
    "isRemote" BOOLEAN NOT NULL DEFAULT true,
    "postedAt" DATETIME,
    "matchScore" REAL,
    "matchReasons" TEXT,
    "notes" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FavoriteJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OptimizedResume" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "favoriteJobId" TEXT NOT NULL,
    "optimizedSummary" TEXT NOT NULL,
    "optimizedExperience" TEXT NOT NULL,
    "optimizedSkills" TEXT NOT NULL,
    "fullOptimizedText" TEXT NOT NULL,
    "atsScore" REAL,
    "keywordsMatched" TEXT,
    "keywordsMissing" TEXT,
    "suggestions" TEXT,
    "aiModel" TEXT NOT NULL DEFAULT 'claude-sonnet-4-20250514',
    "promptVersion" TEXT NOT NULL DEFAULT 'v1',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OptimizedResume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OptimizedResume_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OptimizedResume_favoriteJobId_fkey" FOREIGN KEY ("favoriteJobId") REFERENCES "FavoriteJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoverLetter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "resumeId" TEXT,
    "favoriteJobId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'professional',
    "aiModel" TEXT NOT NULL DEFAULT 'claude-sonnet-4-20250514',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CoverLetter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CoverLetter_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CoverLetter_favoriteJobId_fkey" FOREIGN KEY ("favoriteJobId") REFERENCES "FavoriteJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "favoriteJobId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'favorited',
    "favoritedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "optimizedAt" DATETIME,
    "appliedAt" DATETIME,
    "responseAt" DATETIME,
    "notes" TEXT,
    "resumeUsed" TEXT,
    "coverLetterUsed" TEXT,
    "responseType" TEXT,
    "interviewDates" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Application_favoriteJobId_fkey" FOREIGN KEY ("favoriteJobId") REFERENCES "FavoriteJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteJob_userId_url_key" ON "FavoriteJob"("userId", "url");

-- CreateIndex
CREATE UNIQUE INDEX "OptimizedResume_resumeId_favoriteJobId_key" ON "OptimizedResume"("resumeId", "favoriteJobId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_userId_favoriteJobId_key" ON "Application"("userId", "favoriteJobId");
