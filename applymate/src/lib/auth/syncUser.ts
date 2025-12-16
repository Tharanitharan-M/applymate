/**
 * User Sync - Ensure Cognito users exist in database
 * 
 * This file provides a function to sync Cognito user data with our Prisma database.
 * 
 * THOUGHT PROCESS:
 * - When a user authenticates, we need to ensure they exist in our database
 * - We use upsert to create if new, or update if existing
 * - This is called from protected route handlers after authentication
 */

import { prisma } from "@/lib/db";
import type { AuthenticatedUser } from "./withAuth";

/**
 * Sync User to Database
 * 
 * Ensures the authenticated Cognito user exists in our database.
 * Creates the user if they don't exist, updates if they do.
 * 
 * @param user - The authenticated user from Cognito
 * @returns The database user record
 */
export async function syncUser(user: AuthenticatedUser) {
  const dbUser = await prisma.user.upsert({
    where: { id: user.id },
    update: {
      // Update these fields if user already exists
      email: user.email,
      name: user.name ?? undefined,
      emailVerified: user.emailVerified ?? false,
    },
    create: {
      // Create new user with Cognito data
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified ?? false,
    },
  });

  return dbUser;
}

/**
 * Get User from Database
 * 
 * Retrieves a user by their Cognito sub (id).
 * Returns null if user doesn't exist.
 * 
 * @param userId - The Cognito sub
 * @returns The database user or null
 */
export async function getDbUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
  });
}

/**
 * Ensure User Exists
 * 
 * Similar to syncUser but only creates if missing.
 * Does not update existing user data.
 * Useful when you just need to ensure the user exists.
 * 
 * @param user - The authenticated user from Cognito
 * @returns The database user record
 */
export async function ensureUserExists(user: AuthenticatedUser) {
  // First check if user exists to avoid unnecessary updates
  const existingUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (existingUser) {
    return existingUser;
  }

  // User doesn't exist, create them
  return prisma.user.create({
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified ?? false,
    },
  });
}








