/**
 * Job File Upload API Route
 * 
 * POST: Uploads resume or cover letter PDF for a specific job
 * 
 * PROTECTED: Requires valid Cognito authentication
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { s3 } from "@/lib/aws/s3";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { withAuth } from "@/lib/auth/withAuth";
import { ensureUserExists } from "@/lib/auth/syncUser";

export const POST = withAuth(async (req, { user }) => {
  try {
    await ensureUserExists(user);

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const jobId = pathParts[pathParts.length - 2]; // upload is last, job id is before it

    // Verify job belongs to user
    const job = await prisma.jobApplication.findFirst({
      where: {
        id: jobId,
        userId: user.id,
      },
      select: {
        id: true,
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

    const data = await req.formData();
    const file = data.get("file") as File;
    const fileType = data.get("type") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (fileType !== "resume" && fileType !== "coverLetter") {
      return NextResponse.json(
        { error: "Invalid file type. Must be 'resume' or 'coverLetter'" },
        { status: 400 }
      );
    }

    // Validate file type (PDF only)
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileKey = `jobs/${user.id}/${jobId}/${fileType}/${Date.now()}-${file.name}`;

    // Delete old file if it exists
    const currentField = fileType === "resume" ? job.uploadedResumeUrl : job.uploadedCoverLetterUrl;
    if (currentField) {
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET!,
            Key: currentField,
          })
        );
      } catch (deleteError) {
        console.error("Failed to delete old file:", deleteError);
        // Continue with upload even if deletion fails
      }
    }

    // Upload to S3
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: fileKey,
        Body: buffer,
        ContentType: "application/pdf",
      })
    );

    // Update job with new file URL
    const updateData =
      fileType === "resume"
        ? { uploadedResumeUrl: fileKey }
        : { uploadedCoverLetterUrl: fileKey };

    const updatedJob = await prisma.jobApplication.update({
      where: { id: jobId },
      data: updateData,
    });

    return NextResponse.json(
      {
        message: `${fileType === "resume" ? "Resume" : "Cover letter"} uploaded successfully`,
        job: updatedJob,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
});

