/**
 * Job Files API Route
 * 
 * GET: Returns presigned URLs for uploaded resume and cover letter
 * 
 * PROTECTED: Requires valid Cognito authentication
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/withAuth";
import { ensureUserExists } from "@/lib/auth/syncUser";
import { getPresignedUrl } from "@/lib/aws/s3";

export const GET = withAuth(async (req, { user }) => {
  try {
    await ensureUserExists(user);

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const jobId = pathParts[pathParts.length - 2]; // files is last, job id is before it

    // Verify job belongs to user
    const job = await prisma.jobApplication.findFirst({
      where: {
        id: jobId,
        userId: user.id,
      },
      select: {
        uploadedResumeUrl: true,
        uploadedCoverLetterUrl: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Generate presigned URLs for uploaded files
    const files: {
      resume?: { url: string; key: string };
      coverLetter?: { url: string; key: string };
    } = {};

    if (job.uploadedResumeUrl) {
      files.resume = {
        url: await getPresignedUrl(job.uploadedResumeUrl),
        key: job.uploadedResumeUrl,
      };
    }

    if (job.uploadedCoverLetterUrl) {
      files.coverLetter = {
        url: await getPresignedUrl(job.uploadedCoverLetterUrl),
        key: job.uploadedCoverLetterUrl,
      };
    }

    return NextResponse.json({ files }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to get file URLs" },
      { status: 500 }
    );
  }
});



