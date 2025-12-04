-- AlterTable: Add fields for uploaded resume and cover letter
ALTER TABLE "JobApplication" 
ADD COLUMN IF NOT EXISTS "uploadedResumeUrl" TEXT,
ADD COLUMN IF NOT EXISTS "uploadedCoverLetterUrl" TEXT;



