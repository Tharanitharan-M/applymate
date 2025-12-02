/**
 * Auth Library Index
 * 
 * Re-exports all auth-related utilities for easy imports.
 * 
 * THOUGHT PROCESS:
 * - Single import path for all auth utilities
 * - Clean API for consumers of this library
 * - Organized exports by category
 */

// Configuration
export { cognitoConfig, cookieConfig, authRoutes } from "./config";

// Validation Schemas and Types
export {
  loginSchema,
  signupSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginInput,
  type SignupInput,
  type VerifyEmailInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "./schemas";

// Cognito Client Operations
export {
  signUp,
  confirmSignUp,
  resendConfirmationCode,
  signIn,
  signOut,
  globalSignOut,
  forgotPassword,
  confirmPassword,
  getCognitoClient,
  type AuthTokens,
  type CognitoUserInfo,
} from "./cognito";

// Token Verification
export {
  verifyAccessToken,
  verifyIdToken,
  getUserFromToken,
  decodeTokenUnsafe,
  isTokenExpired,
} from "./verify";

// API Route Middleware
export {
  withAuth,
  withOptionalAuth,
  type AuthenticatedUser,
  type AuthContext,
  type ProtectedRouteHandler,
} from "./withAuth";

// User Database Sync
export {
  syncUser,
  getDbUser,
  ensureUserExists,
} from "./syncUser";

// React Context and Hook
export { AuthProvider, useAuth } from "./context";

