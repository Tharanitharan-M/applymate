/**
 * Email Verification API Route
 * 
 * Handles email verification with the 6-digit code from Cognito.
 * Also handles resending verification codes.
 * 
 * THOUGHT PROCESS:
 * - POST: Verify email with code
 * - PUT: Resend verification code
 * - Separate methods for different operations
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyEmailSchema } from "@/lib/auth/schemas";
import { confirmSignUp, resendConfirmationCode } from "@/lib/auth/cognito";
import { z } from "zod";

/**
 * POST /api/auth/verify
 * 
 * Verifies user's email with the code from Cognito.
 * 
 * Request body:
 * {
 *   email: string,
 *   code: string (6 digits)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = verifyEmailSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;

      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          fieldErrors: errors,
        },
        { status: 400 }
      );
    }

    const { email, code } = validationResult.data;

    // ==========================================================================
    // Confirm the user's email with Cognito
    // 
    // This marks the user's email as verified in Cognito.
    // After this, the user can sign in.
    // ==========================================================================
    await confirmSignUp(email, code);

    return NextResponse.json(
      {
        success: true,
        message: "Email verified successfully. You can now sign in.",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Verification error:", error);

    if (error && typeof error === "object" && "code" in error) {
      const cognitoError = error as { code: string; message: string };

      switch (cognitoError.code) {
        case "CodeMismatchException":
          return NextResponse.json(
            {
              success: false,
              error: "Invalid verification code",
            },
            { status: 400 }
          );

        case "ExpiredCodeException":
          return NextResponse.json(
            {
              success: false,
              error: "Verification code has expired. Please request a new one.",
            },
            { status: 400 }
          );

        case "NotAuthorizedException":
          return NextResponse.json(
            {
              success: false,
              error: "This account is already verified",
            },
            { status: 400 }
          );

        case "UserNotFoundException":
          return NextResponse.json(
            {
              success: false,
              error: "No account found with this email",
            },
            { status: 404 }
          );

        default:
          console.error("Unhandled Cognito error:", cognitoError.code);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Verification failed. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/auth/verify
 * 
 * Resends the verification code.
 * 
 * Request body:
 * {
 *   email: string
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Simple validation for resend - just need email
    const emailSchema = z.object({
      email: z.string().email("Invalid email address"),
    });

    const validationResult = emailSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide a valid email address",
        },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;

    // ==========================================================================
    // Resend the confirmation code
    // 
    // Cognito will send a new 6-digit code to the user's email.
    // Previous codes become invalid.
    // ==========================================================================
    await resendConfirmationCode(email);

    return NextResponse.json(
      {
        success: true,
        message: "Verification code sent. Please check your email.",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Resend code error:", error);

    if (error && typeof error === "object" && "code" in error) {
      const cognitoError = error as { code: string; message: string };

      switch (cognitoError.code) {
        case "UserNotFoundException":
          // Don't reveal if user exists
          return NextResponse.json(
            {
              success: true,
              message: "If an account exists, a verification code has been sent.",
            },
            { status: 200 }
          );

        case "LimitExceededException":
          return NextResponse.json(
            {
              success: false,
              error: "Too many attempts. Please try again later.",
            },
            { status: 429 }
          );

        default:
          console.error("Unhandled Cognito error:", cognitoError.code);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to send code. Please try again.",
      },
      { status: 500 }
    );
  }
}





