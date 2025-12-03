/**
 * Job Match Score API Route
 * 
 * POST: Calculates/updates the resume match score for a job
 * 
 * PROTECTED: Requires valid Cognito authentication
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/withAuth";
import { ensureUserExists } from "@/lib/auth/syncUser";
import { analyzeResumeAgainstJob } from "@/lib/ai/ats";

export const POST = withAuth(async (req, { user }) => {
  try {
    await ensureUserExists(user);

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const jobId = pathParts[pathParts.length - 2]; // match-score is last, job id is before it

    // Fetch job with resume
    const job = await prisma.jobApplication.findFirst({
      where: {
        id: jobId,
        userId: user.id,
      },
      include: {
        usedResumes: {
          include: {
            resume: true,
          },
          take: 1,
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    if (!job.jobDescription) {
      return NextResponse.json(
        { error: "Job description is required to calculate match score" },
        { status: 400 }
      );
    }

    const resume = job.usedResumes[0]?.resume;
    if (!resume) {
      return NextResponse.json(
        { error: "No resume attached to this job" },
        { status: 400 }
      );
    }

    if (!resume.parsedText) {
      return NextResponse.json(
        { error: "Resume text not available for analysis" },
        { status: 400 }
      );
    }

    // Analyze resume against job
    const analysis = await analyzeResumeAgainstJob(resume.parsedText, job.jobDescription);

    // Update or create ResumeSuggestion (store all detailed analysis data)
    const suggestion = await prisma.resumeSuggestion.upsert({
      where: {
        jobId: jobId,
      },
      update: {
        matchScore: analysis.matchScore,
        missingSkills: analysis.missingItems, // Store combined missing items
        suggestedBullets: analysis.suggestedBullets,
        improvedSummary: analysis.improvedSummary,
        atsKeywords: analysis.skillsMatched, // Store matched skills as keywords
        relevantExperience: analysis.relevantExperience, // Store relevant experience
        improvements: analysis.improvements as any, // Store improvements array as JSON
      },
      create: {
        jobId: jobId,
        matchScore: analysis.matchScore,
        missingSkills: analysis.missingItems,
        suggestedBullets: analysis.suggestedBullets,
        improvedSummary: analysis.improvedSummary,
        atsKeywords: analysis.skillsMatched,
        relevantExperience: analysis.relevantExperience,
        improvements: analysis.improvements as any,
      },
    });

    // Return full analysis including the detailed breakdown
    return NextResponse.json({
      suggestion,
      analysis: {
        matchScore: analysis.matchScore,
        missingItems: analysis.missingItems,
        skillsMatched: analysis.skillsMatched,
        suggestedBullets: analysis.suggestedBullets,
        improvedSummary: analysis.improvedSummary,
        relevantExperience: analysis.relevantExperience,
        improvements: analysis.improvements,
      },
    }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to calculate match score" },
      { status: 500 }
    );
  }
});

