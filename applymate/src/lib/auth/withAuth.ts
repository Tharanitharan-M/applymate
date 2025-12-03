/**
 * Authentication Middleware for API Routes
 * 
 * This file provides a higher-order function that wraps API route handlers
 * to require and verify Cognito authentication.
 * 
 * THOUGHT PROCESS:
 * - We extract and verify tokens from HTTP-only cookies
 * - The middleware injects the authenticated user into the request context
 * - Protected routes get clean access to user data without boilerplate
 */

import { NextRequest, NextResponse } from "next/server";
import { cookieConfig } from "./config";
import { verifyAccessToken, getUserFromToken } from "./verify";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Authenticated User
 * 
 * The user object available to protected route handlers.
 * Contains the Cognito sub (id) and user attributes.
 */
export interface AuthenticatedUser {
  /** Cognito sub - unique user identifier */
  id: string;
  /** User's email address */
  email: string;
  /** User's display name */
  name?: string;
  /** Whether email has been verified */
  emailVerified?: boolean;
}

/**
 * Authenticated Request Context
 * 
 * Extended context passed to protected route handlers.
 */
export interface AuthContext {
  /** The authenticated user */
  user: AuthenticatedUser;
  /** The raw access token (for forwarding to other services) */
  accessToken: string;
}

/**
 * Protected Route Handler
 * 
 * The function signature for route handlers that require authentication.
 * The auth context is passed as the second parameter.
 */
export type ProtectedRouteHandler = (
  request: NextRequest,
  auth: AuthContext
) => Promise<NextResponse>;

// =============================================================================
// MIDDLEWARE IMPLEMENTATION
// =============================================================================

/**
 * withAuth - Authentication Middleware
 * 
 * Wraps an API route handler to require authentication.
 * 
 * Usage:
 * ```ts
 * export const POST = withAuth(async (request, { user }) => {
 *   // user is guaranteed to be authenticated here
 *   const userId = user.id;
 *   // ... your handler logic
 * });
 * ```
 * 
 * @param handler - The route handler to protect
 * @returns A wrapped handler that checks authentication first
 */
export function withAuth(handler: ProtectedRouteHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // ========================================================================
      // STEP 1: Extract tokens from cookies
      // ========================================================================
      const accessToken = request.cookies.get(cookieConfig.accessTokenName)?.value;
      const idToken = request.cookies.get(cookieConfig.idTokenName)?.value;

      if (!accessToken || !idToken) {
        return NextResponse.json(
          {
            success: false,
            error: "Authentication required",
            code: "UNAUTHENTICATED",
          },
          { status: 401 }
        );
      }

      // ========================================================================
      // STEP 2: Verify the access token
      // 
      // This validates:
      // - Token signature (using Cognito's public keys)
      // - Token expiration
      // - Token issuer (matches our User Pool)
      // - Token audience (matches our Client ID)
      // ========================================================================
      const accessPayload = await verifyAccessToken(accessToken);

      if (!accessPayload) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid or expired token",
            code: "INVALID_TOKEN",
          },
          { status: 401 }
        );
      }

      // ========================================================================
      // STEP 3: Get user information from ID token
      // ========================================================================
      const userInfo = await getUserFromToken(idToken);

      if (!userInfo) {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to get user information",
            code: "USER_INFO_ERROR",
          },
          { status: 401 }
        );
      }

      // ========================================================================
      // STEP 4: Build auth context and call handler
      // ========================================================================
      const authContext: AuthContext = {
        user: {
          id: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name,
          emailVerified: userInfo.emailVerified,
        },
        accessToken,
      };

      // Call the protected handler with auth context
      return await handler(request, authContext);

    } catch (error) {
      console.error("Auth middleware error:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Authentication failed",
          code: "AUTH_ERROR",
        },
        { status: 401 }
      );
    }
  };
}

/**
 * Optional Auth Middleware
 * 
 * Similar to withAuth but doesn't require authentication.
 * If tokens are present and valid, user info is provided.
 * If not, the handler still runs but user is null.
 * 
 * Useful for routes that behave differently for authenticated users.
 */
export function withOptionalAuth(
  handler: (
    request: NextRequest,
    auth: { user: AuthenticatedUser | null; accessToken: string | null }
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const accessToken = request.cookies.get(cookieConfig.accessTokenName)?.value;
      const idToken = request.cookies.get(cookieConfig.idTokenName)?.value;

      // If no tokens, proceed without user
      if (!accessToken || !idToken) {
        return await handler(request, { user: null, accessToken: null });
      }

      // Try to verify tokens
      const accessPayload = await verifyAccessToken(accessToken);
      if (!accessPayload) {
        return await handler(request, { user: null, accessToken: null });
      }

      const userInfo = await getUserFromToken(idToken);
      if (!userInfo) {
        return await handler(request, { user: null, accessToken: null });
      }

      // Tokens valid, provide user info
      return await handler(request, {
        user: {
          id: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name,
          emailVerified: userInfo.emailVerified,
        },
        accessToken,
      });

    } catch (error) {
      // On any error, proceed without user
      console.error("Optional auth error:", error);
      return await handler(request, { user: null, accessToken: null });
    }
  };
}


