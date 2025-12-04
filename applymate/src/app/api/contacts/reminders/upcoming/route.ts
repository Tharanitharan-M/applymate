/**
 * Upcoming Reminders API Route
 * 
 * GET: Returns all upcoming reminders for the authenticated user across all contacts
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
    const limit = parseInt(searchParams.get("limit") || "10");

    const includeOverdue = searchParams.get("includeOverdue") === "true";

    // Fetch upcoming reminders for all user's contacts
    const reminders = await prisma.contactReminder.findMany({
      where: {
        contact: {
          userId: user.id,
        },
        completed: false,
        ...(includeOverdue
          ? {}
          : {
              dueDate: {
                gte: new Date(),
              },
            }),
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            company: true,
            role: true,
          },
        },
      },
      orderBy: includeOverdue
        ? [
            {
              dueDate: "asc", // Show overdue first (oldest dates first)
            },
          ]
        : {
            dueDate: "asc",
          },
      take: limit,
    });

    return NextResponse.json(
      {
        reminders: reminders.map((reminder) => ({
          id: reminder.id,
          title: reminder.title,
          description: reminder.description,
          dueDate: reminder.dueDate.toISOString(),
          completed: reminder.completed,
          createdAt: reminder.createdAt.toISOString(),
          updatedAt: reminder.updatedAt.toISOString(),
          contact: {
            id: reminder.contact.id,
            name: reminder.contact.name,
            company: reminder.contact.company,
            role: reminder.contact.role,
          },
        })),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch upcoming reminders" },
      { status: 500 }
    );
  }
});

