import { z } from "zod";

export const jobStatusEnum = z.enum([
  "saved",
  "applied",
  "interviewing",
  "offer",
  "rejected",
]);

export const createJobSchema = z.object({
  company: z.string().min(1, "Company is required"),
  role: z.string().min(1, "Role is required"),
  location: z.string().optional(),
  jobUrl: z.string().url("Invalid job URL").optional(),
  jobDescription: z.string().optional(),
  notes: z.string().optional(),
  status: jobStatusEnum.default("saved"),
  resumeId: z.string().min(1, "Resume selection is required"),
});

export const updateJobSchema = z.object({
  company: z.string().min(1, "Company is required").optional(),
  role: z.string().min(1, "Role is required").optional(),
  location: z.string().optional().nullable(),
  jobUrl: z.string().url("Invalid job URL").optional().nullable(),
  jobDescription: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: jobStatusEnum.optional(),
  resumeId: z.string().optional(),
});

export type CreateJobSchema = z.infer<typeof createJobSchema>;
export type UpdateJobSchema = z.infer<typeof updateJobSchema>;