/**
 * Single Resume API Route
 * 
 * GET: Returns a single resume with its ATS analysis
 * DELETE: Deletes a resume
 * 
 * PROTECTED: Requires valid Cognito authentication
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/withAuth";
import { ensureUserExists } from "@/lib/auth/syncUser";
import { s3, getPresignedUrl } from "@/lib/aws/s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export const GET = withAuth(async (req, { user }) => {
  try {
    // Ensure user exists in database (syncs from Cognito)
    await ensureUserExists(user);

    // Extract ID from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 1];

    const resume = await prisma.resume.findFirst({
      where: {
        id: id,
        userId: user.id, // Ensure user owns this resume
      },
    });

    if (!resume) {
      return NextResponse.json(
        { error: "Resume not found" },
        { status: 404 }
      );
    }

    // Extract S3 key from fileUrl (handle both old full URLs and new keys)
    let s3Key = resume.fileUrl;
    // If it's a full URL, extract the key
    if (s3Key.startsWith("http")) {
      const urlMatch = s3Key.match(/resumes\/.+$/);
      if (urlMatch) {
        s3Key = urlMatch[0];
      }
    }

    // Generate presigned URL for the PDF (valid for 1 hour)
    const presignedUrl = await getPresignedUrl(s3Key);

    // Return resume with presigned URL
    return NextResponse.json({ 
      resume: {
        ...resume,
        fileUrl: presignedUrl,
      }
    }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch resume" },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (req, { user }) => {
  try {
    // Ensure user exists in database (syncs from Cognito)
    await ensureUserExists(user);

    // Extract ID from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 1];

    const resume = await prisma.resume.findFirst({
      where: {
        id: id,
        userId: user.id, // Ensure user owns this resume
      },
    });

    if (!resume) {
      return NextResponse.json(
        { error: "Resume not found" },
        { status: 404 }
      );
    }

    // Extract S3 key from fileUrl (handle both old full URLs and new keys)
    let s3Key = resume.fileUrl;
    // If it's a full URL, extract the key
    if (s3Key.startsWith("http")) {
      const urlMatch = s3Key.match(/resumes\/.+$/);
      if (urlMatch) {
        s3Key = urlMatch[0];
      }
    }
    
    try {
      // Delete from S3
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET!,
          Key: s3Key,
        })
      );
    } catch (s3Error) {
      console.error("Failed to delete from S3:", s3Error);
      // Continue with database deletion even if S3 deletion fails
    }

    // Delete from database
    await prisma.resume.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json(
      { message: "Resume deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete resume" },
      { status: 500 }
    );
  }
});

