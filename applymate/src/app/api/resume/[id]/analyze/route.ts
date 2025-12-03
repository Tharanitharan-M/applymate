/**
 * Resume Analysis API Route
 * 
 * POST: Analyzes a resume for ATS score and updates it in the database
 * 
 * PROTECTED: Requires valid Cognito authentication
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/withAuth";
import { ensureUserExists } from "@/lib/auth/syncUser";
import { analyzeResumeATS } from "@/lib/ai/ats";

export const POST = withAuth(async (req, { user }) => {
  try {
    // Ensure user exists in database (syncs from Cognito)
    await ensureUserExists(user);

    // Extract ID from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 2]; // analyze is the last part, id is before it

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

    if (!resume.parsedText) {
      return NextResponse.json(
        { error: "Resume text not available for analysis" },
        { status: 400 }
      );
    }

    // Analyze resume for ATS score
    const analysis = await analyzeResumeATS(resume.parsedText);

    // Update resume with ATS analysis
    const updatedResume = await prisma.resume.update({
      where: {
        id: id,
      },
      data: {
        atsScore: analysis.atsScore,
        atsGrade: analysis.grade,
        improvementActions: analysis.improvementActions,
      },
    });

    return NextResponse.json({ resume: updatedResume }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to analyze resume" },
      { status: 500 }
    );
  }
});

