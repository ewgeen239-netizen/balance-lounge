-- Additive only; leaves existing site data unchanged.
CREATE TABLE IF NOT EXISTS "MobileContent" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "data" TEXT NOT NULL DEFAULT '{}',
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MobileContent_pkey" PRIMARY KEY ("id")
);
