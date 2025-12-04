/**
 * Signup API Route
 * 
 * Handles user registration with AWS Cognito.
 * This route validates input, creates the user, and returns appropriate responses.
 * 
 * THOUGHT PROCESS:
 * - Server-side validation catches any client-side bypass attempts
 * - We use Cognito's signUp which sends verification email automatically
 * - Detailed error handling provides clear feedback to users
 */

import { NextRequest, NextResponse } from "next/server";
import { signupSchema } from "@/lib/auth/schemas";
import { signUp } from "@/lib/auth/cognito";

/**
 * POST /api/auth/signup
 * 
 * Request body:
 * {
 *   name: string,
 *   email: string,
 *   password: string,
 *   confirmPassword: string
 * }
 * 
 * Response:
 * - 200: Signup successful, verification email sent
 * - 400: Validation error or user already exists
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // ==========================================================================
    // STEP 1: Parse the request body
    // ==========================================================================
    const body = await request.json();

    // ==========================================================================
    // STEP 2: Validate input with Zod
    // 
    // safeParse returns { success: boolean, data?, error? }
    // instead of throwing, making error handling cleaner
    // ==========================================================================
    const validationResult = signupSchema.safeParse(body);

    if (!validationResult.success) {
      // Format Zod errors into a user-friendly object
      // Each field gets its own error message
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

    // Destructure validated data
    // At this point, we know all fields are valid
    const { name, email, password } = validationResult.data;

    // ==========================================================================
    // STEP 3: Create user in Cognito
    // 
    // signUp handles:
    // - Creating the user with SRP-hashed password
    // - Storing user attributes
    // - Sending verification email (if configured)
    // ==========================================================================
    const result = await signUp(email, password, name);

    // ==========================================================================
    // STEP 4: Return success response
    // 
    // If email verification is enabled (default), userConfirmed will be false
    // and we tell the user to check their email
    // ==========================================================================
    return NextResponse.json(
      {
        success: true,
        message: result.userConfirmed
          ? "Account created successfully"
          : "Account created. Please check your email for verification code.",
        userConfirmed: result.userConfirmed,
        // Include email so frontend knows which account needs verification
        email: email,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    // ==========================================================================
    // ERROR HANDLING
    // 
    // Cognito throws specific error codes we can use for better messages
    // Common codes:
    // - UsernameExistsException: Email already registered
    // - InvalidPasswordException: Password doesn't meet requirements
    // - InvalidParameterException: Invalid input format
    // ==========================================================================
    console.error("Signup error:", error);

    // Type guard for Cognito errors
    if (error && typeof error === "object" && "code" in error) {
      const cognitoError = error as { code: string; message: string };

      // Handle specific Cognito errors with user-friendly messages
      switch (cognitoError.code) {
        case "UsernameExistsException":
          return NextResponse.json(
            {
              success: false,
              error: "An account with this email already exists",
            },
            { status: 400 }
          );

        case "InvalidPasswordException":
          return NextResponse.json(
            {
              success: false,
              error: "Password does not meet requirements",
            },
            { status: 400 }
          );

        case "InvalidParameterException":
          return NextResponse.json(
            {
              success: false,
              error: cognitoError.message || "Invalid input provided",
            },
            { status: 400 }
          );

        default:
          // Log unexpected errors for debugging
          console.error("Unhandled Cognito error:", cognitoError.code);
      }
    }

    // Generic error response for unexpected errors
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create account. Please try again.",
      },
      { status: 500 }
    );
  }
}




