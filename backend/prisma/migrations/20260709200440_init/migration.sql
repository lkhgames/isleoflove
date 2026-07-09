-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "displayName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Islander" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "bio" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Choice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "episodeId" TEXT NOT NULL,
    "islanderId" TEXT,
    "prompt" TEXT NOT NULL,
    "compatibilityDelta" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Choice_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Choice_islanderId_fkey" FOREIGN KEY ("islanderId") REFERENCES "Islander" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Relationship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "islanderId" TEXT NOT NULL,
    "compatibility" INTEGER NOT NULL DEFAULT 0,
    "coupledUp" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Relationship_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Relationship_islanderId_fkey" FOREIGN KEY ("islanderId") REFERENCES "Islander" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Episode_number_key" ON "Episode"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Relationship_playerId_islanderId_key" ON "Relationship"("playerId", "islanderId");
