/**
 * Contact Reminders API Route
 * 
 * GET: Returns all reminders for a contact
 * POST: Creates a new reminder
 * 
 * PROTECTED: Requires valid Cognito authentication
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/withAuth";
import { ensureUserExists } from "@/lib/auth/syncUser";
import { z } from "zod";

const createReminderSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: "Invalid date format" }
  ),
});

export const GET = withAuth(async (req, { user }) => {
  try {
    await ensureUserExists(user);

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const contactId = pathParts[pathParts.length - 2];

    // Verify contact belongs to user
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        userId: user.id,
      },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    // Fetch reminders
    const reminders = await prisma.contactReminder.findMany({
      where: {
        contactId,
      },
      orderBy: {
        dueDate: "asc",
      },
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
        })),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch reminders" },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req, { user }) => {
  try {
    await ensureUserExists(user);

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const contactId = pathParts[pathParts.length - 2];

    // Verify contact belongs to user
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        userId: user.id,
      },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    const body = await req.json();

    // Validate input
    const parsed = createReminderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, description, dueDate } = parsed.data;

    // Convert dueDate to Date object (handles both ISO strings and datetime-local format)
    const dueDateObj = new Date(dueDate);
    if (isNaN(dueDateObj.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    // Create reminder
    const reminder = await prisma.contactReminder.create({
      data: {
        contactId,
        title,
        description: description || null,
        dueDate: dueDateObj,
      },
    });

    return NextResponse.json(
      {
        reminder: {
          id: reminder.id,
          title: reminder.title,
          description: reminder.description,
          dueDate: reminder.dueDate.toISOString(),
          completed: reminder.completed,
          createdAt: reminder.createdAt.toISOString(),
          updatedAt: reminder.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create reminder" },
      { status: 500 }
    );
  }
});

