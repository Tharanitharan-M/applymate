import { generateText } from "ai";
import { llm } from "@/lib/ai/client";

export interface ResumeMatchAnalysis {
  matchScore: number;
  missingItems: string[]; // Combined missing skills/keywords - single line each
  skillsMatched: string[]; // Single line each
  suggestedBullets: string[]; // Single line each
  improvedSummary: string; // 2-3 lines max
  relevantExperience: string[]; // Single line each
  improvements: Array<{
    type: "sentence_rewrite" | "add_keyword" | "improve_bullet" | "enhance_clarity";
    current: string; // Single line
    suggested: string; // Single line
    explanation: string; // Single line
  }>;
}

export async function analyzeResumeAgainstJob(resume: string, jobDescription: string): Promise<ResumeMatchAnalysis> {
  const prompt = `
You are an expert ATS evaluator and career coach. Analyze how well this resume matches a specific job description.

CRITICAL FORMATTING RULES:
- improvedSummary: MUST be exactly 2-3 lines, concise and impactful
- missingItems: Combine missing skills AND keywords into ONE array, each item must be a SINGLE LINE
- skillsMatched: Each skill must be a SINGLE LINE (just the skill name)
- suggestedBullets: Each bullet must be a SINGLE LINE
- relevantExperience: Each experience point must be a SINGLE LINE
- improvements: Each field (current, suggested, explanation) must be a SINGLE LINE

Return ONLY valid JSON (no markdown, no code blocks):
{
  "matchScore": number (0-100),
  "missingItems": string[] (combine missing skills and keywords - single line each),
  "skillsMatched": string[] (single line each - just skill names),
  "suggestedBullets": string[] (single line each),
  "improvedSummary": string (EXACTLY 2-3 lines, concise and impactful),
  "relevantExperience": string[] (single line each),
  "improvements": [
    {
      "type": "sentence_rewrite" | "add_keyword" | "improve_bullet" | "enhance_clarity",
      "current": string (single line),
      "suggested": string (single line),
      "explanation": string (single line)
    }
  ]
}

Resume:
${resume.substring(0, 15000)}

Job Description:
${jobDescription.substring(0, 15000)}
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
    
    // Combine missingSkills and missingKeywords if they exist separately (backwards compatibility)
    const missingItems = Array.isArray(parsed.missingItems) 
      ? parsed.missingItems 
      : [
          ...(Array.isArray(parsed.missingSkills) ? parsed.missingSkills : []),
          ...(Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : []),
        ];
    
    // Ensure improvedSummary is limited to 2-3 lines
    let improvedSummary = parsed.improvedSummary || "";
    const summaryLines = improvedSummary.split('\n').filter((line: string) => line.trim());
    if (summaryLines.length > 3) {
      improvedSummary = summaryLines.slice(0, 3).join('\n');
    }
    
    return {
      matchScore: Math.max(0, Math.min(100, parsed.matchScore || 0)),
      missingItems: missingItems.map((item: string) => item.split('\n')[0].trim()), // Ensure single line
      skillsMatched: Array.isArray(parsed.skillsMatched) 
        ? parsed.skillsMatched.map((item: string) => item.split('\n')[0].trim()) 
        : [],
      suggestedBullets: Array.isArray(parsed.suggestedBullets) 
        ? parsed.suggestedBullets.map((item: string) => item.split('\n')[0].trim()) 
        : [],
      improvedSummary: improvedSummary,
      relevantExperience: Array.isArray(parsed.relevantExperience) 
        ? parsed.relevantExperience.map((item: string) => item.split('\n')[0].trim()) 
        : [],
      improvements: Array.isArray(parsed.improvements) 
        ? parsed.improvements.map((imp: any) => ({
            type: imp.type,
            current: imp.current?.split('\n')[0].trim() || "",
            suggested: imp.suggested?.split('\n')[0].trim() || "",
            explanation: imp.explanation?.split('\n')[0].trim() || "",
          }))
        : [],
    };
  } catch (error) {
    console.error("AI JSON parse failed:", response.text, error);
    return {
      matchScore: 0,
      missingItems: [],
      skillsMatched: [],
      suggestedBullets: [],
      improvedSummary: "",
      relevantExperience: [],
      improvements: [],
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