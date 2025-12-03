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
    model: llm("gemini-2.0-flash"),
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

/**
 * Analyzes a resume for general ATS compatibility
 * Returns ATS score (0-100), grade (A-F), and actionable improvement suggestions
 */
export async function analyzeResumeATS(resumeText: string) {
  const prompt = `
You are an expert ATS (Applicant Tracking System) evaluator and career coach. Analyze this resume thoroughly and provide detailed, specific feedback based on the ACTUAL CONTENT of the resume.

CRITICAL: Read the entire resume carefully. Analyze the actual content, sections, formatting, and structure. Provide suggestions that are SPECIFIC to what is actually in this resume, not generic advice.

Evaluate the resume comprehensively:

1. **Format & Structure Analysis:**
   - Check for proper section headers (Contact, Summary/Objective, Experience, Education, Skills, Certifications, etc.)
   - Identify any formatting issues (tables, columns, graphics, unusual layouts)
   - Verify consistent date formatting throughout
   - Check for proper use of standard fonts and formatting

2. **Content Quality Analysis:**
   - Analyze the professional summary/objective (if present) - is it compelling and keyword-rich?
   - Review each work experience entry:
     * Are bullet points using strong action verbs?
     * Are achievements quantified with numbers, percentages, or metrics?
     * Is the impact clearly stated?
     * Are responsibilities vs achievements differentiated?
   - Check education section for completeness and relevance
   - Evaluate skills section for keyword optimization and relevance
   - Look for missing sections that would strengthen the resume

3. **ATS Optimization:**
   - Keyword density and relevance
   - Use of industry-standard terminology
   - Proper section naming (ATS-friendly headers)
   - Text-based content (no images/graphics that can't be parsed)
   - Consistent formatting that ATS systems can parse

4. **Specific Content Issues:**
   - Identify vague or generic descriptions
   - Find missing quantifiable achievements
   - Spot formatting inconsistencies
   - Note any missing critical information
   - Identify opportunities to strengthen weak sections

Return ONLY valid JSON (no markdown, no code blocks):
{
  "atsScore": number (0-100),
  "grade": string (A, B, C, D, or F),
  "improvementActions": string[] (array of DETAILED, SPECIFIC, ACTIONABLE suggestions based on the actual resume content)
}

IMPORTANT: The improvementActions must be:
- SPECIFIC to this resume's actual content
- DETAILED with examples from the resume where applicable
- ACTIONABLE with clear steps the user can take
- PRIORITIZED (most important first)

Examples of good, detailed suggestions:
- "In your 'Software Engineer' role at [Company], replace 'Worked on various projects' with a quantified achievement like 'Developed 5+ REST APIs that reduced API response time by 40%'"
- "Your Experience section uses inconsistent date formats - some entries show 'Jan 2020 - Present' while others show '2020-2023'. Standardize all dates to 'Month YYYY - Month YYYY' format"
- "Add a Professional Summary section (2-3 lines) at the top highlighting your 5+ years of experience in [specific technology] and key achievements like [mention specific achievement from resume]"
- "Your Skills section lists 'JavaScript' but your experience section doesn't mention any JavaScript projects. Add a bullet point under your [specific role] describing a JavaScript project you worked on"
- "The bullet point 'Managed team' is too vague. Replace with 'Led a team of 4 developers to deliver 3 major features, resulting in 25% increase in user engagement'"

Resume text:
${resumeText}
`;

  const response = await generateText({
    model: llm("gemini-2.0-flash"),
    prompt,
  });

  try {
    // Try to extract JSON from the response (handle markdown code blocks)
    let jsonText = response.text.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```json\n?/, "").replace(/^```\n?/, "").replace(/\n?```$/, "");
    }
    
    const parsed = JSON.parse(jsonText);
    
    // Validate and set defaults
    const atsScore = Math.max(0, Math.min(100, parsed.atsScore || 0));
    const grade = parsed.grade || getGradeFromScore(atsScore);
    const improvementActions = Array.isArray(parsed.improvementActions) 
      ? parsed.improvementActions 
      : [];
    
    return {
      atsScore,
      grade,
      improvementActions,
    };
  } catch (error) {
    console.error("AI JSON parse failed:", response.text, error);
    // Return default values on parse failure
    return {
      atsScore: 0,
      grade: "F",
      improvementActions: [
        "Unable to analyze resume. Please ensure the PDF is text-based and can be parsed correctly."
      ],
    };
  }
}

/**
 * Converts ATS score to letter grade
 */
function getGradeFromScore(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}