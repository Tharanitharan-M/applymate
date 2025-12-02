import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createJobSchema } from "@/lib/validation/job";

export async function POST(req: Request) {
  try {
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

    // TEMP user id until Cognito is added
    const userId = "demo-user";

    // Check resume exists
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      return NextResponse.json(
        { error: "Resume not found" },
        { status: 404 }
      );
    }

    // STEP 1: Create job entry
    const job = await prisma.jobApplication.create({
      data: {
        userId,
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
}