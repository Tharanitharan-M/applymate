/**
 * Dashboard Stats API Route
 * 
 * GET: Returns aggregated stats for the dashboard
 * - Total jobs by status
 * - Total contacts
 * - Total resumes
 * - Jobs applied today/this week
 * - Contacts added today/this week
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

    // Get date ranges
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start of week (Sunday)

    // Fetch all jobs and group by status
    const jobs = await prisma.jobApplication.findMany({
      where: {
        userId: user.id,
      },
      select: {
        status: true,
        createdAt: true,
      },
    });

    // Count jobs by status
    const jobsByStatus: Record<string, number> = {};
    let jobsAppliedToday = 0;
    let jobsAppliedThisWeek = 0;

    jobs.forEach((job) => {
      // Count by status
      jobsByStatus[job.status] = (jobsByStatus[job.status] || 0) + 1;

      // Count applied today/this week
      const jobDate = new Date(job.createdAt);
      if (jobDate >= startOfToday) {
        jobsAppliedToday++;
      }
      if (jobDate >= startOfWeek) {
        jobsAppliedThisWeek++;
      }
    });

    // Get total contacts
    const totalContacts = await prisma.contact.count({
      where: {
        userId: user.id,
      },
    });

    // Get contacts added today/this week
    const contactsAddedToday = await prisma.contact.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: startOfToday,
        },
      },
    });

    const contactsAddedThisWeek = await prisma.contact.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: startOfWeek,
        },
      },
    });

    // Get total resumes
    const totalResumes = await prisma.resume.count({
      where: {
        userId: user.id,
      },
    });

    // Get total jobs applied (all statuses except 'saved')
    const totalJobsApplied = jobs.filter(
      (job) => job.status !== "saved"
    ).length;

    return NextResponse.json(
      {
        stats: {
          jobsByStatus,
          totalJobs: jobs.length,
          totalJobsApplied,
          jobsAppliedToday,
          jobsAppliedThisWeek,
          totalContacts,
          contactsAddedToday,
          contactsAddedThisWeek,
          totalResumes,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
});





