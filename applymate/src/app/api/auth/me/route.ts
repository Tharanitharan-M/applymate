/**
 * Current User API Route
 * 
 * Returns information about the currently authenticated user.
 * Uses the ID token from cookies to get user data.
 * 
 * THOUGHT PROCESS:
 * - This endpoint is called by the frontend to check auth status
 * - We verify the ID token server-side for security
 * - Returns user info if authenticated, 401 if not
 */

import { NextRequest, NextResponse } from "next/server";
import { cookieConfig } from "@/lib/auth/config";
import { getUserFromToken, verifyAccessToken } from "@/lib/auth/verify";

/**
 * GET /api/auth/me
 * 
 * Returns the current user's information.
 * 
 * Response:
 * - 200: { user: { sub, email, name } }
 * - 401: Not authenticated
 */
export async function GET(request: NextRequest) {
  try {
    // ==========================================================================
    // STEP 1: Get tokens from cookies
    // ==========================================================================
    const accessToken = request.cookies.get(cookieConfig.accessTokenName)?.value;
    const idToken = request.cookies.get(cookieConfig.idTokenName)?.value;

    // If no tokens, user is not authenticated
    if (!accessToken || !idToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
        },
        { status: 401 }
      );
    }

    // ==========================================================================
    // STEP 2: Verify the access token
    // 
    // We verify the access token to ensure the session is valid.
    // This checks signature, expiration, and issuer.
    // ==========================================================================
    const accessPayload = await verifyAccessToken(accessToken);

    if (!accessPayload) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired session",
        },
        { status: 401 }
      );
    }

    // ==========================================================================
    // STEP 3: Get user info from ID token
    // 
    // The ID token contains user attributes like email and name.
    // We extract these for the frontend.
    // ==========================================================================
    const user = await getUserFromToken(idToken);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to get user information",
        },
        { status: 401 }
      );
    }

    // ==========================================================================
    // STEP 4: Return user info
    // ==========================================================================
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.sub,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get current user error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get user information",
      },
      { status: 500 }
    );
  }
}






