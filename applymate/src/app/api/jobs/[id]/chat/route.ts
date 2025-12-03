/**
 * Job Chat API Route
 * 
 * GET: Returns all chat messages for a job
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
    const jobId = pathParts[pathParts.length - 2]; // chat is last, job id is before it

    // Verify job belongs to user
    const job = await prisma.jobApplication.findFirst({
      where: {
        id: jobId,
        userId: user.id,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Fetch chat messages
    const messages = await prisma.chatMessage.findMany({
      where: {
        jobId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ messages }, { status: 200 });
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
    const jobId = pathParts[pathParts.length - 2];

    const body = await req.json();
    const parsed = chatMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify job belongs to user
    const job = await prisma.jobApplication.findFirst({
      where: {
        id: jobId,
        userId: user.id,
      },
      include: {
        usedResumes: {
          include: {
            resume: true,
          },
          take: 1,
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    const { message, role } = parsed.data;

    // If user message, save it and generate assistant response
    if (role === "user") {
      // Save user message
      const userMessage = await prisma.chatMessage.create({
        data: {
          jobId,
          role: "user",
          message,
        },
      });

      // Get chat history for context
      const chatHistory = await prisma.chatMessage.findMany({
        where: { jobId },
        orderBy: { createdAt: "asc" },
      });

      // Build context for AI
      const resumeText = job.usedResumes[0]?.resume.parsedText || "";
      const jobDescription = job.jobDescription || "";

      const contextPrompt = `
You are an expert career coach and job application advisor helping a job seeker with a specific job application. Your responses must be DETAILED, SPECIFIC, ACTIONABLE, and directly relevant to THIS job and THIS user's resume.

CRITICAL INSTRUCTIONS:
- Read the entire job description and resume carefully
- Provide responses that are SPECIFIC to the actual content provided, not generic advice
- Give detailed, actionable recommendations with examples
- Reference specific skills, experiences, or qualifications from the resume when relevant
- Use the job description requirements to tailor your advice
- Be direct and helpful - the user is actively applying for this role

JOB INFORMATION:
- Company: ${job.company}
- Role: ${job.role}
- Location: ${("location" in job && job.location) ? job.location : "Not specified"}
- Current Application Status: ${job.status}

JOB DESCRIPTION:
${jobDescription.substring(0, 8000)}

USER'S RESUME:
${resumeText.substring(0, 8000)}

PREVIOUS CONVERSATION CONTEXT:
${chatHistory.map((m) => `${m.role}: ${m.message}`).join("\n\n")}

USER'S CURRENT QUESTION/REQUEST:
${message}

RESPONSE GUIDELINES:

1. **Cover Letter Requests:**
   - Write a complete, professional cover letter
   - Reference SPECIFIC experiences from the resume that match job requirements
   - Include specific skills, projects, or achievements mentioned in the resume
   - Use the company name and role throughout
   - Keep it concise (3-4 paragraphs) but impactful
   - Show genuine interest in the role and company

2. **Resume Improvement/Summary Rewrites:**
   - Provide the EXACT rewritten text, not just suggestions
   - Incorporate keywords from the job description
   - Highlight relevant experience from the actual resume
   - Be specific about which sections to update and show the before/after
   - Include quantifiable achievements where possible

3. **Interview Preparation:**
   - Provide specific talking points based on the resume experiences
   - Reference actual projects, roles, or achievements from the resume
   - Connect resume experiences to job requirements
   - Give detailed answers to common interview questions tailored to this role
   - Include STAR method examples using real experiences from the resume

4. **General Questions:**
   - Analyze the resume against specific job requirements
   - Identify gaps and provide specific steps to address them
   - Suggest specific improvements with examples from the resume
   - Provide actionable next steps

5. **All Responses Must:**
   - Be specific and reference actual content from the resume/job description
   - Include concrete examples, not vague advice
   - Be actionable with clear steps the user can take
   - Be relevant to THIS specific job application
   - Be professional but conversational in tone

EXAMPLES OF GOOD RESPONSES:

For "Write a cover letter":
- Start with a compelling opening paragraph mentioning the role and company
- Include 2-3 specific examples from the resume that match job requirements
- Close with enthusiasm and a call to action
- Include the complete letter text, ready to use

For "How do I answer 'Tell me about yourself'":
- Provide a 60-90 second structured answer
- Reference specific roles/experiences from the resume
- Connect experiences to the job requirements
- Give the exact script to use

For "Rewrite my resume summary":
- Show the current summary (if identifiable) or create one based on the resume
- Provide the improved version with keywords from the job description
- Explain why each change was made
- Include specific achievements from the resume

Now respond to the user's question with a detailed, specific, actionable answer that directly uses information from the job description and resume provided above.
`;

      // Generate AI response
      const aiResponse = await generateText({
        model: llm("gemini-2.0-flash"),
        prompt: contextPrompt,
      });

      // Save assistant message
      const assistantMessage = await prisma.chatMessage.create({
        data: {
          jobId,
          role: "assistant",
          message: aiResponse.text,
        },
      });

      return NextResponse.json({
        userMessage,
        assistantMessage,
      }, { status: 201 });
    } else {
      // Direct assistant message (for testing or manual additions)
      const assistantMessage = await prisma.chatMessage.create({
        data: {
          jobId,
          role: "assistant",
          message,
        },
      });

      return NextResponse.json({ message: assistantMessage }, { status: 201 });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
});

