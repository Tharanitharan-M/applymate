/**
 * Add Job API Route
 * 
 * Creates a new job application with Cognito authentication.
 * Attaches a resume and creates initial AI result placeholder.
 * 
 * PROTECTED: Requires valid Cognito authentication
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createJobSchema } from "@/lib/validation/job";
import { withAuth } from "@/lib/auth/withAuth";
import { ensureUserExists } from "@/lib/auth/syncUser";

export const POST = withAuth(async (req, { user }) => {
  try {
    // Ensure user exists in database (syncs from Cognito)
    await ensureUserExists(user);

    const body = await req.json();

    // Validate input
    const parsed = createJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { company, role, jobUrl, jobDescription, status, resumeId } = parsed.data;

    // Check resume exists and belongs to this user
    const resume = await prisma.resume.findFirst({
      where: { 
        id: resumeId,
        userId: user.id, // Ensure user owns this resume
      },
    });

    if (!resume) {
      return NextResponse.json(
        { error: "Resume not found or access denied" },
        { status: 404 }
      );
    }

    // STEP 1: Create job entry
    const job = await prisma.jobApplication.create({
      data: {
        userId: user.id,
        company,
        role,
        jobUrl,
        jobDescription,
        status,
      },
    });

    // STEP 2: Attach resume to this job
    await prisma.jobResumeUsed.create({
      data: {
        jobId: job.id,
        resumeId,
      },
    });

    // STEP 3: Run AI scoring (placeholder, Gemini added next)
    const aiResult = {
      matchScore: 0,
      missingSkills: [],
      suggestedBullets: [],
      improvedSummary: "",
      atsKeywords: [],
    };

    // STEP 4: Save empty AI result (we update later)
    const suggestion = await prisma.resumeSuggestion.create({
      data: {
        jobId: job.id,
        matchScore: aiResult.matchScore,
        missingSkills: aiResult.missingSkills,
        suggestedBullets: aiResult.suggestedBullets,
        improvedSummary: aiResult.improvedSummary,
        atsKeywords: aiResult.atsKeywords,
      },
    });

    return NextResponse.json(
      {
        message: "Job added successfully",
        job,
        suggestion,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
