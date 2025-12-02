/**
 * Zod Validation Schemas for Authentication
 * 
 * This file defines all validation schemas used in the auth flow.
 * Zod provides runtime validation with TypeScript type inference.
 * 
 * THOUGHT PROCESS:
 * - Zod schemas validate both client and server side
 * - We get TypeScript types automatically from schemas
 * - Custom error messages provide clear feedback to users
 * - Reusable field definitions keep code DRY
 * 
 * NOTE: Using Zod 4.x API which uses .check() instead of .refine() for some cases
 */

import { z } from "zod";

// =============================================================================
// REUSABLE FIELD SCHEMAS
// =============================================================================

/**
 * Email Field Schema
 * 
 * Validates that:
 * - Field is not empty (required)
 * - Value is a valid email format
 * 
 * The .trim() ensures whitespace doesn't cause issues
 */
const emailField = z
  .string({ message: "Email is required" })
  .trim()
  .min(1, "Email is required")
  .email("Please enter a valid email address");

/**
 * Password Field Schema
 * 
 * Validates AWS Cognito default password requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * 
 * Each regex check provides a specific error message
 */
const passwordField = z
  .string({ message: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character (!@#$%^&*)"
  );

/**
 * Name Field Schema
 * 
 * Simple validation for user's name:
 * - Required field
 * - Minimum 2 characters (prevents single-letter names)
 * - Maximum 50 characters (reasonable limit)
 */
const nameField = z
  .string({ message: "Name is required" })
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be less than 50 characters");

// =============================================================================
// AUTHENTICATION SCHEMAS
// =============================================================================

/**
 * Login Schema
 * 
 * Used for validating the login form submission.
 * Simpler password validation since we're just checking credentials.
 */
export const loginSchema = z.object({
  email: emailField,
  // For login, we don't need strict password rules
  // We just need to ensure they provided something
  password: z.string().min(1, "Password is required"),
});

/**
 * Signup Schema
 * 
 * Used for validating new user registration.
 * Includes password confirmation to prevent typos.
 * 
 * We use .refine() to add a custom validation that ensures passwords match.
 */
export const signupSchema = z
  .object({
    name: nameField,
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

/**
 * Email Verification Schema
 * 
 * Used when users need to verify their email with a code.
 * Cognito sends a 6-digit code by default.
 */
export const verifyEmailSchema = z.object({
  email: emailField,
  code: z
    .string()
    .min(1, "Verification code is required")
    .regex(/^\d{6}$/, "Verification code must be 6 digits"),
});

/**
 * Forgot Password Schema
 * 
 * First step of password reset - just need the email.
 */
export const forgotPasswordSchema = z.object({
  email: emailField,
});

/**
 * Reset Password Schema
 * 
 * Second step of password reset - need code and new password.
 */
export const resetPasswordSchema = z
  .object({
    email: emailField,
    code: z
      .string()
      .min(1, "Verification code is required")
      .regex(/^\d{6}$/, "Verification code must be 6 digits"),
    newPassword: passwordField,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// =============================================================================
// TYPE EXPORTS
// =============================================================================

/**
 * TypeScript Types Inferred from Schemas
 * 
 * z.infer<> extracts the TypeScript type from a Zod schema.
 * This means we never have to define types separately -
 * they're always in sync with our validation rules.
 */
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
