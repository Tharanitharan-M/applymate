/**
 * Single Contact API Route
 * 
 * GET: Returns a single contact with all related data
 * PATCH: Updates a contact
 * DELETE: Deletes a contact
 * 
 * PROTECTED: Requires valid Cognito authentication
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/withAuth";
import { ensureUserExists } from "@/lib/auth/syncUser";
import { z } from "zod";

const updateContactSchema = z.object({
  name: z.string().min(1).optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  linkedInUrl: z.string().url().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
  status: z.string().optional(),
  lastContactedAt: z.string().datetime().optional(),
});

export const GET = withAuth(async (req, { user }) => {
  try {
    await ensureUserExists(user);

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 1];

    const contact = await prisma.contact.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        interactions: {
          orderBy: {
            createdAt: "desc",
          },
        },
        reminders: {
          orderBy: {
            dueDate: "asc",
          },
        },
      },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    // Format the response
    const formattedContact = {
      id: contact.id,
      name: contact.name,
      company: contact.company,
      role: contact.role,
      linkedInUrl: contact.linkedInUrl,
      email: contact.email,
      notes: contact.notes,
      status: contact.status,
      lastContactedAt: contact.lastContactedAt?.toISOString() || null,
      createdAt: contact.createdAt.toISOString(),
      updatedAt: contact.updatedAt.toISOString(),
      interactions: contact.interactions.map((interaction) => ({
        id: interaction.id,
        type: interaction.type,
        notes: interaction.notes,
        createdAt: interaction.createdAt.toISOString(),
      })),
      reminders: contact.reminders.map((reminder) => ({
        id: reminder.id,
        title: reminder.title,
        description: reminder.description,
        dueDate: reminder.dueDate.toISOString(),
        completed: reminder.completed,
        createdAt: reminder.createdAt.toISOString(),
        updatedAt: reminder.updatedAt.toISOString(),
      })),
    };

    return NextResponse.json({ contact: formattedContact }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch contact" },
      { status: 500 }
    );
  }
});

export const PATCH = withAuth(async (req, { user }) => {
  try {
    await ensureUserExists(user);

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 1];

    // Verify contact belongs to user
    const existingContact = await prisma.contact.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingContact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    const body = await req.json();

    // Validate input
    const parsed = updateContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data: any = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.company !== undefined) data.company = parsed.data.company || null;
    if (parsed.data.role !== undefined) data.role = parsed.data.role || null;
    if (parsed.data.linkedInUrl !== undefined) data.linkedInUrl = parsed.data.linkedInUrl || null;
    if (parsed.data.email !== undefined) data.email = parsed.data.email || null;
    if (parsed.data.notes !== undefined) data.notes = parsed.data.notes || null;
    if (parsed.data.status !== undefined) data.status = parsed.data.status;
    if (parsed.data.lastContactedAt !== undefined) {
      data.lastContactedAt = parsed.data.lastContactedAt ? new Date(parsed.data.lastContactedAt) : null;
    }

    const updatedContact = await prisma.contact.update({
      where: { id },
      data,
    });

    return NextResponse.json({ contact: updatedContact }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (req, { user }) => {
  try {
    await ensureUserExists(user);

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 1];

    // Verify contact belongs to user
    const contact = await prisma.contact.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    // Delete contact (cascade will handle interactions, reminders, and chat messages)
    await prisma.contact.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Contact deleted" }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    );
  }
});

