import { z } from "zod";

export const createJobSchema = z.object({
  company: z.string().min(1, "Company is required"),
  role: z.string().min(1, "Role is required"),
  jobUrl: z.string().url("Invalid job URL").min(1, "Job URL is required"),
  jobDescription: z.string().min(20, "Job description is too short").optional(),
  status: z.enum(["saved", "applied", "interview", "offer", "rejected"]).default("saved"),
  resumeId: z.string().min(1, "Resume selection is required"),
});

export type CreateJobSchema = z.infer<typeof createJobSchema>;