import { generateText } from "ai";
import { llm } from "@/lib/ai/client";

export interface ParsedJobData {
  jobTitle: string;
  company: string;
  location?: string;
  jobDescription?: string;
  responsibilities?: string[];
  requirements?: string[];
}

/**
 * Parses job posting from HTML content using LLM
 */
export async function parseJobFromHTML(htmlContent: string, url: string): Promise<ParsedJobData> {
  // Extract text content from HTML (simple approach - remove script/style tags)
  const textContent = htmlContent
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 50000); // Limit to 50k chars for LLM

  const prompt = `
You are a job posting parser. Extract job information from this webpage content.

Webpage URL: ${url}

Webpage Content:
${textContent}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "jobTitle": string,
  "company": string,
  "location": string (optional),
  "jobDescription": string (optional, full job description),
  "responsibilities": string[] (optional, array of key responsibilities),
  "requirements": string[] (optional, array of key requirements/qualifications)
}

If any field cannot be determined, use null or empty string. Be as accurate as possible.
`;

  const response = await generateText({
    model: llm("gemini-2.0-flash"),
    prompt,
  });

  try {
    let jsonText = response.text.trim();
    // Remove markdown code blocks if present
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```json\n?/, "").replace(/^```\n?/, "").replace(/\n?```$/, "");
    }
    
    const parsed = JSON.parse(jsonText);
    
    return {
      jobTitle: parsed.jobTitle || "",
      company: parsed.company || "",
      location: parsed.location || undefined,
      jobDescription: parsed.jobDescription || undefined,
      responsibilities: Array.isArray(parsed.responsibilities) ? parsed.responsibilities : undefined,
      requirements: Array.isArray(parsed.requirements) ? parsed.requirements : undefined,
    };
  } catch (error) {
    console.error("Failed to parse job data from LLM response:", error);
    throw new Error("Failed to parse job information from URL");
  }
}

