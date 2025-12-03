/**
 * Single Job API Route
 * 
 * GET: Returns a single job with all related data
 * PATCH: Updates a job
 * DELETE: Deletes a job
 * 
 * PROTECTED: Requires valid Cognito authentication
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { s3 } from "@/lib/aws/s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { withAuth } from "@/lib/auth/withAuth";
import { ensureUserExists } from "@/lib/auth/syncUser";
import { updateJobSchema } from "@/lib/validation/job";

export const GET = withAuth(async (req, { user }) => {
  try {
    await ensureUserExists(user);

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 1];

    const job = await prisma.jobApplication.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        usedResumes: {
          include: {
            resume: {
              select: {
                id: true,
                name: true,
                fileUrl: true,
              },
            },
          },
        },
        aiResult: true,
        chats: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Format the response
    const formattedJob = {
      id: job.id,
      company: job.company,
      role: job.role,
      location: job.location,
      jobUrl: job.jobUrl,
      jobDescription: job.jobDescription,
      notes: job.notes,
      status: job.status,
      uploadedResumeUrl: job.uploadedResumeUrl,
      uploadedCoverLetterUrl: job.uploadedCoverLetterUrl,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      resume: job.usedResumes[0]?.resume || null,
      aiResult: job.aiResult,
      chats: job.chats,
    };

    return NextResponse.json({ job: formattedJob }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch job" },
      { status: 500 }
    );
  }
});

export const PATCH = withAuth(async (req, { user }) => {
  try {
    await ensureUserExists(user);

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 1];

    const body = await req.json();
    const parsed = updateJobSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify job belongs to user
    const existingJob = await prisma.jobApplication.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    const updateData: {
      company?: string;
      role?: string;
      location?: string | null;
      jobUrl?: string | null;
      jobDescription?: string | null;
      notes?: string | null;
      status?: string;
    } = {};

    if (parsed.data.company !== undefined) updateData.company = parsed.data.company;
    if (parsed.data.role !== undefined) updateData.role = parsed.data.role;
    if (parsed.data.location !== undefined) updateData.location = parsed.data.location;
    if (parsed.data.jobUrl !== undefined) updateData.jobUrl = parsed.data.jobUrl;
    if (parsed.data.jobDescription !== undefined) updateData.jobDescription = parsed.data.jobDescription;
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;

    // Update resume if provided
    if (parsed.data.resumeId) {
      const resume = await prisma.resume.findFirst({
        where: {
          id: parsed.data.resumeId,
          userId: user.id,
        },
      });

      if (!resume) {
        return NextResponse.json(
          { error: "Resume not found" },
          { status: 404 }
        );
      }

      // Remove old resume associations and add new one
      await prisma.jobResumeUsed.deleteMany({
        where: { jobId: id },
      });

      await prisma.jobResumeUsed.create({
        data: {
          jobId: id,
          resumeId: parsed.data.resumeId,
        },
      });
    }

    // Update job
    const updatedJob = await prisma.jobApplication.update({
      where: { id },
      data: updateData,
      include: {
        usedResumes: {
          include: {
            resume: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        aiResult: true,
      },
    });

    return NextResponse.json({ job: updatedJob }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (req, { user }) => {
  try {
    await ensureUserExists(user);

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 1];

    // Verify job belongs to user
    const job = await prisma.jobApplication.findFirst({
      where: {
        id,
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

    // Delete uploaded files from S3 if they exist
    if (job.uploadedResumeUrl) {
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET!,
            Key: job.uploadedResumeUrl,
          })
        );
      } catch (s3Error) {
        console.error("Failed to delete resume from S3:", s3Error);
        // Continue with deletion even if S3 deletion fails
      }
    }

    if (job.uploadedCoverLetterUrl) {
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET!,
            Key: job.uploadedCoverLetterUrl,
          })
        );
      } catch (s3Error) {
        console.error("Failed to delete cover letter from S3:", s3Error);
        // Continue with deletion even if S3 deletion fails
      }
    }

    // Delete related records (cascade should handle this, but being explicit)
    await prisma.chatMessage.deleteMany({ where: { jobId: id } });
    await prisma.resumeSuggestion.deleteMany({ where: { jobId: id } });
    await prisma.jobResumeUsed.deleteMany({ where: { jobId: id } });
    await prisma.jobApplication.delete({ where: { id } });

    return NextResponse.json({ message: "Job deleted successfully" }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 }
    );
  }
});

