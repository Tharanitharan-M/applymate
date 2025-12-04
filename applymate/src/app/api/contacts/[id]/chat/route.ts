/**
 * Contact Chat API Route
 * 
 * GET: Returns all chat messages for a contact
 * POST: Creates a new chat message (user or assistant)
 * 
 * PROTECTED: Requires valid Cognito authentication
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/auth/withAuth";
import { ensureUserExists } from "@/lib/auth/syncUser";
import { generateText } from "ai";
import { llm } from "@/lib/ai/client";
import { z } from "zod";

const chatMessageSchema = z.object({
  message: z.string().min(1, "Message is required"),
  role: z.enum(["user", "assistant"]).optional().default("user"),
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
      include: {
        user: {
          select: {
            name: true,
            email: true,
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

    // Fetch chat messages
    const messages = await prisma.contactChatMessage.findMany({
      where: {
        contactId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(
      {
        messages: messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          message: msg.message,
          createdAt: msg.createdAt.toISOString(),
        })),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch chat messages" },
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

    // Verify contact belongs to user and fetch with user info
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
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

    const body = await req.json();
    const parsed = chatMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { message, role } = parsed.data;

    // Save user message
    const userMessage = await prisma.contactChatMessage.create({
      data: {
        contactId,
        role: "user",
        message,
      },
    });

    // If user message, generate AI response
    if (role === "user") {
      // Get previous messages for context
      const previousMessages = await prisma.contactChatMessage.findMany({
        where: {
          contactId,
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 10, // Last 10 messages for context
      });

      // Build context about the contact
      const contactInfo = `
Contact Name: ${contact.name}
Company: ${contact.company || "Unknown"}
Role: ${contact.role || "Unknown"}
LinkedIn: ${contact.linkedInUrl || "Not provided"}
Email: ${contact.email || "Not provided"}
Notes: ${contact.notes || "None"}
Status: ${contact.status}
Last Contacted: ${contact.lastContactedAt ? contact.lastContactedAt.toISOString() : "Never"}
      `.trim();

      // Build conversation history
      const conversationHistory = previousMessages
        .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.message}`)
        .join("\n");

      const systemPrompt = `You are an AI assistant helping with networking outreach. The user is asking for help crafting messages to reach out to contacts during their job search.

Contact Information:
${contactInfo}

${conversationHistory ? `Previous conversation:\n${conversationHistory}\n\n` : ""}

Provide helpful, personalized, and professional advice for networking outreach. Keep responses concise and actionable.`;

      // Generate AI response
      const aiResponse = await generateText({
        model: llm("gemini-2.0-flash"),
        prompt: `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`,
      });

      // Save AI response
      const assistantMessage = await prisma.contactChatMessage.create({
        data: {
          contactId,
          role: "assistant",
          message: aiResponse.text,
        },
      });

      return NextResponse.json(
        {
          messages: [
            {
              id: userMessage.id,
              role: userMessage.role,
              message: userMessage.message,
              createdAt: userMessage.createdAt.toISOString(),
            },
            {
              id: assistantMessage.id,
              role: assistantMessage.role,
              message: assistantMessage.message,
              createdAt: assistantMessage.createdAt.toISOString(),
            },
          ],
        },
        { status: 201 }
      );
    }

    // Just return the user message if no AI response needed
    return NextResponse.json(
      {
        messages: [
          {
            id: userMessage.id,
            role: userMessage.role,
            message: userMessage.message,
            createdAt: userMessage.createdAt.toISOString(),
          },
        ],
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
});

