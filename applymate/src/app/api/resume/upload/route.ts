/**
 * Resume Upload API Route
 * 
 * Handles resume file uploads with Cognito authentication.
 * Uploads the file to S3 and parses the PDF text.
 * 
 * PROTECTED: Requires valid Cognito authentication
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { s3 } from "@/lib/aws/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { withAuth } from "@/lib/auth/withAuth";
import { ensureUserExists } from "@/lib/auth/syncUser";
import { analyzeResumeATS } from "@/lib/ai/ats";

export const POST = withAuth(async (req, { user }) => {
  try {
    // Ensure user exists in database (syncs from Cognito)
    await ensureUserExists(user);

    const data = await req.formData();
    const file = data.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileKey = `resumes/${user.id}/${Date.now()}-${file.name}`;

    // Upload to S3
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: fileKey,
        Body: buffer,
        ContentType: file.type,
      })
    );

    // Parse resume text using pdf-parse-fork
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require("pdf-parse-fork") as (buffer: Buffer) => Promise<{ text: string }>;
    const parsed = await pdfParse(buffer);

    const resumeText = parsed.text || "";

    // Extract resume name from filename (remove extension)
    const resumeName = file.name.replace(/\.[^/.]+$/, "");

    // Store the S3 key instead of full URL (we'll generate presigned URLs on demand)
    // Create resume record
    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        fileUrl: fileKey, // Store just the S3 key
        parsedText: resumeText,
        name: resumeName,
      },
    });

    // Trigger ATS analysis asynchronously (don't wait for it)
    if (resumeText) {
      analyzeResumeATS(resumeText)
        .then((analysis) => {
          return prisma.resume.update({
            where: { id: resume.id },
            data: {
              atsScore: analysis.atsScore,
              atsGrade: analysis.grade,
              improvementActions: analysis.improvementActions,
            },
          });
        })
        .catch((error) => {
          console.error("Failed to analyze resume:", error);
          // Don't fail the upload if analysis fails
        });
    }

    return NextResponse.json({ resume }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Resume upload failed" },
      { status: 500 }
    );
  }
});
