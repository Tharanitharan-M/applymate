/**
 * Resume API Route
 * 
 * GET: Returns all resumes for the authenticated user
 * 
 * PROTECTED: Requires valid Cognito authentication
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/withAuth";
import { ensureUserExists } from "@/lib/auth/syncUser";

export const GET = withAuth(async (req, { user }) => {
  try {
    // Ensure user exists in database (syncs from Cognito)
    await ensureUserExists(user);

    const resumes = await prisma.resume.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ resumes }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch resumes" },
      { status: 500 }
    );
  }
});



