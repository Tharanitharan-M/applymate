import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Using Gemini through its Google Generative AI API
export const llm = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
});