/**
 * Single Reminder API Route
 * 
 * PATCH: Updates a reminder (e.g., mark as completed)
 * DELETE: Deletes a reminder
 * 
 * PROTECTED: Requires valid Cognito authentication
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/withAuth";
import { ensureUserExists } from "@/lib/auth/syncUser";
import { z } from "zod";

const updateReminderSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.string().refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: "Invalid date format" }
  ).optional(),
  completed: z.boolean().optional(),
});

export const PATCH = withAuth(async (req, { user }) => {
  try {
    await ensureUserExists(user);

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const contactId = pathParts[pathParts.length - 3];
    const reminderId = pathParts[pathParts.length - 1];

    // Verify contact belongs to user
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        userId: user.id,
      },
      include: {
        reminders: {
          where: { id: reminderId },
        },
      },
    });

    if (!contact || contact.reminders.length === 0) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    const body = await req.json();

    // Validate input
    const parsed = updateReminderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data: any = {};
    if (parsed.data.title !== undefined) data.title = parsed.data.title;
    if (parsed.data.description !== undefined) data.description = parsed.data.description || null;
    if (parsed.data.dueDate !== undefined) {
      const dueDateObj = new Date(parsed.data.dueDate);
      if (isNaN(dueDateObj.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format" },
          { status: 400 }
        );
      }
      data.dueDate = dueDateObj;
    }
    if (parsed.data.completed !== undefined) data.completed = parsed.data.completed;

    const updatedReminder = await prisma.contactReminder.update({
      where: { id: reminderId },
      data,
    });

    return NextResponse.json(
      {
        reminder: {
          id: updatedReminder.id,
          title: updatedReminder.title,
          description: updatedReminder.description,
          dueDate: updatedReminder.dueDate.toISOString(),
          completed: updatedReminder.completed,
          createdAt: updatedReminder.createdAt.toISOString(),
          updatedAt: updatedReminder.updatedAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update reminder" },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (req, { user }) => {
  try {
    await ensureUserExists(user);

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const contactId = pathParts[pathParts.length - 3];
    const reminderId = pathParts[pathParts.length - 1];

    // Verify contact belongs to user
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        userId: user.id,
      },
      include: {
        reminders: {
          where: { id: reminderId },
        },
      },
    });

    if (!contact || contact.reminders.length === 0) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    await prisma.contactReminder.delete({
      where: { id: reminderId },
    });

    return NextResponse.json({ message: "Reminder deleted" }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete reminder" },
      { status: 500 }
    );
  }
});

