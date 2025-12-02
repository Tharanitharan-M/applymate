/**
 * AWS Cognito Configuration
 * 
 * This file centralizes all Cognito-related configuration.
 * We export constants that will be used throughout the auth system.
 * 
 * THOUGHT PROCESS:
 * - Centralized config makes it easy to change settings in one place
 * - Environment variables keep sensitive data out of source code
 * - Type safety ensures we catch missing config at build time
 */

// Cognito User Pool configuration
// These are read from environment variables for security
export const cognitoConfig = {
  // The unique identifier for your Cognito User Pool
  // Found in AWS Console: Cognito > User Pools > [Your Pool] > Pool Id
  userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,

  // The Client ID for your app registered with Cognito
  // Found in AWS Console: Cognito > User Pools > App Clients
  clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,

  // The AWS region where your User Pool is hosted
  // e.g., 'us-east-1', 'eu-west-1'
  region: process.env.NEXT_PUBLIC_COGNITO_REGION || "us-east-1",

  // Optional: Client Secret (only needed if your app client has a secret configured)
  // Note: For browser-based apps, it's recommended NOT to use client secret
  clientSecret: process.env.COGNITO_CLIENT_SECRET,
} as const;

// Cookie configuration for storing auth tokens
// These settings control how we persist authentication state
export const cookieConfig = {
  // Name of the cookie that stores the access token
  accessTokenName: "applymate_access_token",

  // Name of the cookie that stores the refresh token
  refreshTokenName: "applymate_refresh_token",

  // Name of the cookie that stores the ID token
  idTokenName: "applymate_id_token",

  // Cookie options for security
  options: {
    // HttpOnly: Prevents JavaScript access (XSS protection)
    httpOnly: true,

    // Secure: Only sent over HTTPS in production
    secure: process.env.NODE_ENV === "production",

    // SameSite: Prevents CSRF attacks
    sameSite: "lax" as const,

    // Path: Cookie available on all routes
    path: "/",

    // MaxAge: Token lifetime in seconds (1 hour)
    maxAge: 60 * 60,
  },
} as const;

// Routes configuration
// Defines where users should be redirected based on auth state
export const authRoutes = {
  // Where to redirect after successful login
  afterLogin: "/dashboard",

  // Where to redirect after logout
  afterLogout: "/",

  // The login page URL
  login: "/login",

  // The signup page URL
  signup: "/signup",

  // Protected routes that require authentication
  protectedRoutes: ["/dashboard"],

  // Public routes that don't require authentication
  publicRoutes: ["/", "/login", "/signup"],
} as const;

