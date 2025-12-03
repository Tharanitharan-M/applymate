/**
 * Parse Job from URL API Route
 * 
 * Fetches a job posting URL and extracts job information using LLM
 * 
 * PROTECTED: Requires valid Cognito authentication
 */

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/withAuth";
import { ensureUserExists } from "@/lib/auth/syncUser";
import { parseJobFromHTML } from "@/lib/ai/jobParser";
import { z } from "zod";

const parseUrlSchema = z.object({
  url: z.string().url("Invalid URL"),
});

export const POST = withAuth(async (req, { user }) => {
  try {
    await ensureUserExists(user);

    const body = await req.json();
    const parsed = parseUrlSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid URL" },
        { status: 400 }
      );
    }

    const { url } = parsed.data;

    // Fetch the webpage
    let htmlContent: string;
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }

      htmlContent = await response.text();
    } catch (error) {
      console.error("Failed to fetch URL:", error);
      return NextResponse.json(
        { error: "Failed to fetch job posting. Please check the URL and try again." },
        { status: 400 }
      );
    }

    // Parse job information using LLM
    try {
      const parsedJob = await parseJobFromHTML(htmlContent, url);
      
      return NextResponse.json({
        success: true,
        job: parsedJob,
      });
    } catch (error) {
      console.error("Failed to parse job:", error);
      return NextResponse.json(
        { error: "Failed to parse job information. Please try adding the job manually." },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

