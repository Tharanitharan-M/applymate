/**
 * Job File Download API Route
 * 
 * GET: Returns presigned URL for a specific uploaded file (resume or cover letter)
 * 
 * PROTECTED: Requires valid Cognito authentication
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/withAuth";
import { ensureUserExists } from "@/lib/auth/syncUser";
import { getPresignedUrlForViewing } from "@/lib/aws/s3";

export const GET = withAuth(async (req, { user }) => {
  try {
    await ensureUserExists(user);

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const jobId = pathParts[pathParts.length - 3]; // files is before type
    const fileType = pathParts[pathParts.length - 1]; // resume or coverLetter

    if (fileType !== "resume" && fileType !== "coverLetter") {
      return NextResponse.json(
        { error: "Invalid file type. Must be 'resume' or 'coverLetter'" },
        { status: 400 }
      );
    }

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

    const fileUrl = fileType === "resume" ? job.uploadedResumeUrl : job.uploadedCoverLetterUrl;

    if (!fileUrl) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Generate presigned URL with inline content disposition for viewing
    const presignedUrl = await getPresignedUrlForViewing(fileUrl);

    // Redirect to the presigned URL
    return NextResponse.redirect(presignedUrl);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to get file URL" },
      { status: 500 }
    );
  }
});

