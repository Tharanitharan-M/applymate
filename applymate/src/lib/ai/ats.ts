import { generateText } from "ai";
import { llm } from "@/lib/ai/client";

export async function analyzeResumeAgainstJob(resume: string, jobDescription: string) {
  const prompt = `
You are an expert ATS evaluator.

Return ONLY this JSON:
{
  "matchScore": number,
  "missingSkills": string[],
  "suggestedBullets": string[],
  "improvedSummary": string,
  "atsKeywords": string[]
}

Resume:
${resume}

Job Description:
${jobDescription}
`;

  const response = await generateText({
    model: llm("gemini-pro"),
    prompt,
  });

  try {
    return JSON.parse(response.text);
  } catch {
    console.error("AI JSON parse failed:", response.text);
    return {
      matchScore: 0,
      missingSkills: [],
      suggestedBullets: [],
      improvedSummary: "",
      atsKeywords: []
    };
  }
}