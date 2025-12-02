/**
 * JWT Token Verification with aws-jwt-verify
 * 
 * This file handles server-side JWT token verification.
 * We use aws-jwt-verify to validate tokens issued by Cognito.
 * 
 * THOUGHT PROCESS:
 * - aws-jwt-verify is AWS's official library for JWT verification
 * - It handles JWKS (JSON Web Key Set) caching automatically
 * - We create verifiers for different token types
 * - Server-side verification ensures tokens are valid and not tampered
 */

import { CognitoJwtVerifier } from "aws-jwt-verify";
import { cognitoConfig } from "./config";

// =============================================================================
// TOKEN VERIFIERS
// =============================================================================

/**
 * Type for the Cognito JWT Verifier
 * 
 * We use ReturnType to infer the correct type from the factory function.
 * This ensures type safety without importing internal types.
 */
type CognitoAccessTokenVerifier = ReturnType<typeof CognitoJwtVerifier.create>;

/**
 * Access Token Verifier
 * 
 * Verifies access tokens used to call protected APIs.
 * Access tokens contain:
 * - sub: User's unique ID
 * - scope: Permissions granted
 * - token_use: "access"
 * 
 * THOUGHT PROCESS:
 * - We specify tokenUse: "access" to only accept access tokens
 * - The verifier fetches and caches the JWKS automatically
 * - It validates signature, expiration, issuer, and audience
 */
let accessTokenVerifier: CognitoAccessTokenVerifier | null = null;

/**
 * Get or create the access token verifier
 * 
 * We lazily initialize to avoid issues during SSR
 * when environment variables might not be available.
 */
function getAccessTokenVerifier() {
  if (!accessTokenVerifier) {
    accessTokenVerifier = CognitoJwtVerifier.create({
      // The User Pool that issued the token
      userPoolId: cognitoConfig.userPoolId,

      // Only accept access tokens (not ID tokens)
      tokenUse: "access",

      // The client ID that the token was issued to
      clientId: cognitoConfig.clientId,
    });
  }
  return accessTokenVerifier;
}

/**
 * ID Token Verifier
 * 
 * Verifies ID tokens used to get user information.
 * ID tokens contain:
 * - sub: User's unique ID
 * - email: User's email
 * - name: User's name
 * - token_use: "id"
 * 
 * THOUGHT PROCESS:
 * - ID tokens are used for frontend user info display
 * - They contain more claims than access tokens
 * - We verify them to ensure user info isn't forged
 */
let idTokenVerifier: CognitoAccessTokenVerifier | null = null;

function getIdTokenVerifier() {
  if (!idTokenVerifier) {
    idTokenVerifier = CognitoJwtVerifier.create({
      userPoolId: cognitoConfig.userPoolId,
      tokenUse: "id",
      clientId: cognitoConfig.clientId,
    });
  }
  return idTokenVerifier;
}

// =============================================================================
// VERIFICATION FUNCTIONS
// =============================================================================

/**
 * Verify Access Token
 * 
 * Validates an access token and returns the decoded payload.
 * 
 * @param token - The JWT access token string
 * @returns Decoded token payload if valid, null if invalid
 * 
 * THOUGHT PROCESS:
 * - We wrap in try-catch because invalid tokens throw
 * - Returning null for invalid tokens makes error handling easier
 * - The caller can decide how to handle invalid tokens
 */
export async function verifyAccessToken(token: string) {
  try {
    const verifier = getAccessTokenVerifier();

    // verify() does the following:
    // 1. Checks the token structure (3 parts: header.payload.signature)
    // 2. Decodes the header to find which key was used
    // 3. Fetches/uses cached JWKS to get the public key
    // 4. Verifies the signature using the public key
    // 5. Checks expiration (exp claim)
    // 6. Validates issuer (iss claim matches user pool)
    // 7. Validates audience (client_id claim matches)
    const payload = await verifier.verify(token);

    return payload;
  } catch (error) {
    // Token is invalid, expired, or tampered
    console.error("Access token verification failed:", error);
    return null;
  }
}

/**
 * Verify ID Token
 * 
 * Validates an ID token and returns the decoded payload.
 * The payload contains user attributes like email and name.
 * 
 * @param token - The JWT ID token string
 * @returns Decoded token payload if valid, null if invalid
 */
export async function verifyIdToken(token: string) {
  try {
    const verifier = getIdTokenVerifier();
    const payload = await verifier.verify(token);

    return payload;
  } catch (error) {
    console.error("ID token verification failed:", error);
    return null;
  }
}

/**
 * Get User from Token
 * 
 * Convenience function that verifies an ID token and
 * extracts user information in a clean format.
 * 
 * @param idToken - The JWT ID token string
 * @returns User info object or null if token is invalid
 */
export async function getUserFromToken(idToken: string) {
  const payload = await verifyIdToken(idToken);

  if (!payload) {
    return null;
  }

  // Extract and return relevant user fields
  return {
    sub: payload.sub,
    email: payload.email as string,
    name: payload.name as string | undefined,
    emailVerified: payload.email_verified as boolean | undefined,
  };
}

/**
 * Decode Token Without Verification
 * 
 * Decodes a JWT without verifying its signature.
 * ONLY use this for non-sensitive operations!
 * 
 * @param token - The JWT token string
 * @returns Decoded payload or null if malformed
 * 
 * WARNING: This does NOT verify the token is valid!
 * Use only for reading non-sensitive claims like expiration.
 */
export function decodeTokenUnsafe(token: string) {
  try {
    // JWT format: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    // The payload is base64url encoded
    // We need to decode it to read the claims
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    );

    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Check if Token is Expired
 * 
 * Quick check to see if a token has expired.
 * Uses unsafe decoding since we just need the exp claim.
 * 
 * @param token - The JWT token string
 * @returns true if expired or invalid, false if still valid
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeTokenUnsafe(token);

  if (!payload || !payload.exp) {
    return true; // Treat malformed tokens as expired
  }

  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = payload.exp * 1000;
  const now = Date.now();

  // Add 30 second buffer to handle clock skew
  return now >= expirationTime - 30000;
}

