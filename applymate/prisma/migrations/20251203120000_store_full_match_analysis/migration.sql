-- AlterTable: Add fields to store full match analysis data
ALTER TABLE "ResumeSuggestion" 
ADD COLUMN IF NOT EXISTS "relevantExperience" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "improvements" JSONB,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
