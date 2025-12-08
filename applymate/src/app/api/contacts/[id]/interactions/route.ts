/**
 * Contact Interactions API Route
 * 
 * GET: Returns all interactions for a contact
 * POST: Creates a new interaction
 * 
 * PROTECTED: Requires valid Cognito authentication
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/withAuth";
import { ensureUserExists } from "@/lib/auth/syncUser";
import { z } from "zod";

const createInteractionSchema = z.object({
  type: z.string().min(1, "Type is required"),
  notes: z.string().optional(),
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

    // Fetch interactions
    const interactions = await prisma.contactInteraction.findMany({
      where: {
        contactId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        interactions: interactions.map((interaction) => ({
          id: interaction.id,
          type: interaction.type,
          notes: interaction.notes,
          createdAt: interaction.createdAt.toISOString(),
        })),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch interactions" },
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
    const parsed = createInteractionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { type, notes } = parsed.data;

    // Create interaction
    const interaction = await prisma.contactInteraction.create({
      data: {
        contactId,
        type,
        notes: notes || null,
      },
    });

    // Update contact's lastContactedAt if this is a contact-related interaction
    const contactTypes = ["messaged", "replied", "scheduled_call", "met", "connected"];
    if (contactTypes.includes(type.toLowerCase())) {
      await prisma.contact.update({
        where: { id: contactId },
        data: { lastContactedAt: new Date() },
      });
    }

    return NextResponse.json(
      {
        interaction: {
          id: interaction.id,
          type: interaction.type,
          notes: interaction.notes,
          createdAt: interaction.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create interaction" },
      { status: 500 }
    );
  }
});


