/**
 * Logout API Route
 * 
 * Handles user logout by clearing authentication cookies.
 * 
 * THOUGHT PROCESS:
 * - We clear all auth cookies to end the session
 * - This is a local logout (tokens still valid until they expire)
 * - For sensitive apps, you might want global logout (invalidates all sessions)
 */

import { NextRequest, NextResponse } from "next/server";
import { cookieConfig } from "@/lib/auth/config";

/**
 * POST /api/auth/logout
 * 
 * Logs out the user by clearing auth cookies.
 * No request body needed.
 * 
 * Response:
 * - 200: Logout successful
 */
export async function POST(request: NextRequest) {
  // Create response
  const response = NextResponse.json(
    {
      success: true,
      message: "Logged out successfully",
    },
    { status: 200 }
  );

  // ==========================================================================
  // Clear all authentication cookies
  // 
  // We set maxAge to 0 to immediately expire the cookies.
  // We also need to match the path and other options from when we set them.
  // ==========================================================================

  // Clear access token
  response.cookies.set(cookieConfig.accessTokenName, "", {
    ...cookieConfig.options,
    maxAge: 0,
  });

  // Clear ID token
  response.cookies.set(cookieConfig.idTokenName, "", {
    ...cookieConfig.options,
    maxAge: 0,
  });

  // Clear refresh token
  response.cookies.set(cookieConfig.refreshTokenName, "", {
    ...cookieConfig.options,
    maxAge: 0,
  });

  return response;
}






