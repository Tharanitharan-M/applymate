/**
 * Jobs API Route
 * 
 * GET: Returns all jobs for the authenticated user with optional filtering
 * 
 * PROTECTED: Requires valid Cognito authentication
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/withAuth";
import { ensureUserExists } from "@/lib/auth/syncUser";

export const GET = withAuth(async (req, { user }) => {
  try {
    await ensureUserExists(user);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "newest";

    // Build where clause
    const where: {
      userId: string;
      status?: string;
      OR?: Array<{
        company?: { contains: string; mode: "insensitive" };
        role?: { contains: string; mode: "insensitive" };
      }>;
    } = {
      userId: user.id,
    };

    if (status && status !== "all") {
      where.status = status;
    }

    if (search && search.trim()) {
      where.OR = [
        { company: { contains: search, mode: "insensitive" } },
        { role: { contains: search, mode: "insensitive" } },
      ];
    }

    // Build order by
    const orderBy: { createdAt: "asc" | "desc" } = {
      createdAt: sort === "oldest" ? "asc" : "desc",
    };

    // Fetch jobs with related data
    const jobs = await prisma.jobApplication.findMany({
      where,
      orderBy,
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
          take: 1, // Get the first/latest resume used
        },
        aiResult: {
          select: {
            matchScore: true,
          },
        },
      },
    });

    // Transform the response
    const formattedJobs = jobs.map((job) => ({
      id: job.id,
      company: job.company,
      role: job.role,
      location: job.location,
      jobUrl: job.jobUrl,
      status: job.status,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      resumeUsed: job.usedResumes[0]?.resume.name || null,
      resumeId: job.usedResumes[0]?.resume.id || null,
      matchScore: job.aiResult?.matchScore || null,
    }));

    return NextResponse.json({ jobs: formattedJobs }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
});



