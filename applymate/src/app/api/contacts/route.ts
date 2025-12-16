/**
 * Contacts API Route
 * 
 * GET: Returns all contacts for the authenticated user with optional filtering
 * POST: Creates a new contact
 * 
 * PROTECTED: Requires valid Cognito authentication
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/withAuth";
import { ensureUserExists } from "@/lib/auth/syncUser";
import { z } from "zod";

const createContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().optional(),
  role: z.string().optional(),
  linkedInUrl: z.string().url().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
  status: z.string().optional().default("not_contacted"),
});

export const GET = withAuth(async (req, { user }) => {
  try {
    await ensureUserExists(user);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "newest";
    const groupByCompany = searchParams.get("groupByCompany") === "true";

    // Build where clause
    const where: {
      userId: string;
      status?: string;
      OR?: Array<{
        name?: { contains: string; mode: "insensitive" };
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
        { name: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { role: { contains: search, mode: "insensitive" } },
      ];
    }

    // Build order by
    const orderBy: { createdAt: "asc" | "desc" } = {
      createdAt: sort === "oldest" ? "asc" : "desc",
    };

    // Fetch contacts
    const contacts = await prisma.contact.findMany({
      where,
      orderBy,
      include: {
        interactions: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
        reminders: {
          where: {
            completed: false,
            dueDate: {
              gte: new Date(),
            },
          },
          orderBy: {
            dueDate: "asc",
          },
          take: 1,
        },
      },
    });

    // Transform the response
    const formattedContacts = contacts.map((contact) => ({
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
      lastInteraction: contact.interactions[0] || null,
      nextReminder: contact.reminders[0] || null,
    }));

    // Group by company if requested
    if (groupByCompany) {
      const grouped = formattedContacts.reduce((acc, contact) => {
        const company = contact.company || "No Company";
        if (!acc[company]) {
          acc[company] = [];
        }
        acc[company].push(contact);
        return acc;
      }, {} as Record<string, typeof formattedContacts>);

      return NextResponse.json({ contacts: formattedContacts, grouped }, { status: 200 });
    }

    return NextResponse.json({ contacts: formattedContacts }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req, { user }) => {
  try {
    await ensureUserExists(user);

    const body = await req.json();

    // Validate input
    const parsed = createContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, company, role, linkedInUrl, email, notes, status } = parsed.data;

    // Create contact
    const contact = await prisma.contact.create({
      data: {
        userId: user.id,
        name,
        company: company || null,
        role: role || null,
        linkedInUrl: linkedInUrl || null,
        email: email || null,
        notes: notes || null,
        status: status || "not_contacted",
      },
    });

    return NextResponse.json({ contact }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
});





