/**
 * Login API Route
 * 
 * Handles user authentication with AWS Cognito.
 * On success, sets HTTP-only cookies with auth tokens.
 * 
 * THOUGHT PROCESS:
 * - HTTP-only cookies prevent XSS attacks on tokens
 * - We validate input server-side for security
 * - Tokens are stored securely for subsequent requests
 */

import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/auth/schemas";
import { signIn } from "@/lib/auth/cognito";
import { cookieConfig } from "@/lib/auth/config";
import { getUserFromToken } from "@/lib/auth/verify";
import { syncUser } from "@/lib/auth/syncUser";

/**
 * POST /api/auth/login
 * 
 * Request body:
 * {
 *   email: string,
 *   password: string
 * }
 * 
 * Response:
 * - 200: Login successful, cookies set
 * - 400: Validation error
 * - 401: Invalid credentials
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // ==========================================================================
    // STEP 1: Parse and validate request body
    // ==========================================================================
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

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

    const { email, password } = validationResult.data;

    // ==========================================================================
    // STEP 2: Authenticate with Cognito
    // 
    // signIn uses SRP protocol which:
    // 1. Never sends password in plain text
    // 2. Uses challenge-response for authentication
    // 3. Returns tokens on success
    // ==========================================================================
    const tokens = await signIn(email, password);

    // ==========================================================================
    // STEP 3: Sync user to database
    // 
    // Extract user info from ID token and ensure they exist in our database.
    // This creates the user on first login or updates their info on subsequent logins.
    // ==========================================================================
    const userInfo = await getUserFromToken(tokens.idToken);
    
    if (userInfo) {
      await syncUser({
        id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        emailVerified: userInfo.emailVerified,
      });
    }

    // ==========================================================================
    // STEP 4: Create response with cookies
    // 
    // We store tokens in HTTP-only cookies because:
    // - They can't be accessed by JavaScript (XSS protection)
    // - They're automatically sent with each request
    // - We set Secure flag in production (HTTPS only)
    // ==========================================================================
    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful",
      },
      { status: 200 }
    );

    // Set the access token cookie
    // Used for API authorization
    response.cookies.set(
      cookieConfig.accessTokenName,
      tokens.accessToken,
      cookieConfig.options
    );

    // Set the ID token cookie
    // Contains user info for the frontend
    response.cookies.set(
      cookieConfig.idTokenName,
      tokens.idToken,
      cookieConfig.options
    );

    // Set the refresh token cookie
    // Used to get new tokens when access token expires
    // Has longer expiry (30 days)
    response.cookies.set(cookieConfig.refreshTokenName, tokens.refreshToken, {
      ...cookieConfig.options,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error: unknown) {
    // ==========================================================================
    // ERROR HANDLING
    // 
    // Common Cognito authentication errors:
    // - NotAuthorizedException: Wrong password
    // - UserNotFoundException: Email not registered
    // - UserNotConfirmedException: Email not verified
    // ==========================================================================
    console.error("Login error:", error);

    if (error && typeof error === "object" && "code" in error) {
      const cognitoError = error as { code: string; message: string };

      switch (cognitoError.code) {
        case "NotAuthorizedException":
          return NextResponse.json(
            {
              success: false,
              error: "Invalid email or password",
            },
            { status: 401 }
          );

        case "UserNotFoundException":
          // We return same message as wrong password
          // to prevent email enumeration attacks
          return NextResponse.json(
            {
              success: false,
              error: "Invalid email or password",
            },
            { status: 401 }
          );

        case "UserNotConfirmedException":
          return NextResponse.json(
            {
              success: false,
              error: "Please verify your email before logging in",
              // Include code so frontend can redirect to verification
              needsVerification: true,
            },
            { status: 401 }
          );

        case "PasswordResetRequiredException":
          return NextResponse.json(
            {
              success: false,
              error: "You must reset your password before logging in",
              needsPasswordReset: true,
            },
            { status: 401 }
          );

        default:
          console.error("Unhandled Cognito error:", cognitoError.code);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Login failed. Please try again.",
      },
      { status: 500 }
    );
  }
}

