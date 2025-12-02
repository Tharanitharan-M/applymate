/**
 * AWS Cognito Client - Authentication Operations
 * 
 * This file handles all direct interactions with AWS Cognito.
 * We use @aws-sdk/client-cognito-identity-provider for auth operations.
 * 
 * THOUGHT PROCESS:
 * - Using AWS SDK v3 because it properly supports CLIENT_SECRET
 * - When a Cognito App Client has a secret, we must compute SECRET_HASH
 * - SECRET_HASH = Base64(HMAC_SHA256(clientSecret, username + clientId))
 * - This hash proves we know the secret without sending it directly
 */

import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  InitiateAuthCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  GlobalSignOutCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { createHmac } from "crypto";
import { cognitoConfig } from "./config";

// =============================================================================
// CLIENT INITIALIZATION
// =============================================================================

/**
 * Create the Cognito Identity Provider client
 * 
 * This is the main AWS SDK client for Cognito operations.
 * We specify the region where our User Pool is hosted.
 */
const cognitoClient = new CognitoIdentityProviderClient({
  region: cognitoConfig.region,
});

// =============================================================================
// SECRET HASH COMPUTATION
// =============================================================================

/**
 * Compute SECRET_HASH for Cognito requests
 * 
 * When a Cognito App Client is configured with a secret,
 * all API calls must include a SECRET_HASH.
 * 
 * The hash is computed as:
 * BASE64(HMAC_SHA256(clientSecret, username + clientId))
 * 
 * @param username - The username (email in our case)
 * @returns The computed SECRET_HASH or undefined if no secret configured
 * 
 * THOUGHT PROCESS:
 * - This proves we know the secret without exposing it
 * - HMAC-SHA256 is a secure one-way hash
 * - The username is included to prevent hash reuse attacks
 */
function computeSecretHash(username: string): string | undefined {
  const clientSecret = cognitoConfig.clientSecret;

  // If no secret is configured, return undefined
  if (!clientSecret) {
    return undefined;
  }

  // Create HMAC with SHA-256 using the client secret as the key
  const hmac = createHmac("sha256", clientSecret);

  // Update with username + clientId (this is the Cognito-required format)
  hmac.update(username + cognitoConfig.clientId);

  // Return the hash as base64
  return hmac.digest("base64");
}

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Authentication Result
 * 
 * Contains all tokens returned after successful authentication.
 */
export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

/**
 * User Information
 * 
 * Parsed from the ID token, contains user attributes.
 */
export interface CognitoUserInfo {
  sub: string;
  email: string;
  name?: string;
  email_verified?: boolean;
}

// =============================================================================
// AUTHENTICATION FUNCTIONS
// =============================================================================

/**
 * Sign Up a New User
 * 
 * Registers a new user with Cognito. The user will receive
 * a verification email with a 6-digit code.
 * 
 * @param email - User's email address (also used as username)
 * @param password - User's chosen password
 * @param name - User's display name
 * @returns Promise that resolves with signup result
 * 
 * THOUGHT PROCESS:
 * - We use email as the username for simpler UX
 * - UserAttributes contains additional user info stored in Cognito
 * - SecretHash is included if the app client has a secret
 */
export async function signUp(
  email: string,
  password: string,
  name: string
): Promise<{ userConfirmed: boolean; userSub: string }> {
  // Build the signup command
  const command = new SignUpCommand({
    // The App Client ID
    ClientId: cognitoConfig.clientId,

    // The SECRET_HASH (required if client has a secret)
    SecretHash: computeSecretHash(email),

    // Username - we use email
    Username: email,

    // Password
    Password: password,

    // Additional user attributes stored in Cognito
    UserAttributes: [
      { Name: "email", Value: email },
      { Name: "name", Value: name },
    ],
  });

  // Send the command to Cognito
  const response = await cognitoClient.send(command);

  return {
    // UserConfirmed is false if email verification is required
    userConfirmed: response.UserConfirmed ?? false,
    // UserSub is the unique identifier for this user
    userSub: response.UserSub ?? "",
  };
}

/**
 * Verify Email with Code
 * 
 * Confirms the user's email address using the code sent via email.
 * This must be called before the user can sign in.
 * 
 * @param email - User's email address
 * @param code - 6-digit verification code from email
 */
export async function confirmSignUp(
  email: string,
  code: string
): Promise<void> {
  const command = new ConfirmSignUpCommand({
    ClientId: cognitoConfig.clientId,
    SecretHash: computeSecretHash(email),
    Username: email,
    ConfirmationCode: code,
  });

  await cognitoClient.send(command);
}

/**
 * Resend Verification Code
 * 
 * Requests a new verification code if the original expired
 * or was never received.
 * 
 * @param email - User's email address
 */
export async function resendConfirmationCode(email: string): Promise<void> {
  const command = new ResendConfirmationCodeCommand({
    ClientId: cognitoConfig.clientId,
    SecretHash: computeSecretHash(email),
    Username: email,
  });

  await cognitoClient.send(command);
}

/**
 * Sign In User
 * 
 * Authenticates a user and returns their tokens.
 * Uses USER_PASSWORD_AUTH flow which works with client secrets.
 * 
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise with authentication tokens
 * 
 * IMPORTANT: This requires USER_PASSWORD_AUTH to be enabled in Cognito:
 * AWS Console → Cognito → User Pools → [Your Pool] → App integration → 
 * App client → Authentication flows → Enable ALLOW_USER_PASSWORD_AUTH
 * 
 * THOUGHT PROCESS:
 * - USER_PASSWORD_AUTH is required when using client secrets
 * - The password is sent over HTTPS so it's encrypted in transit
 * - SECRET_HASH proves we know the client secret
 */
export async function signIn(
  email: string,
  password: string
): Promise<AuthTokens> {
  const secretHash = computeSecretHash(email);

  const command = new InitiateAuthCommand({
    ClientId: cognitoConfig.clientId,
    AuthFlow: "USER_PASSWORD_AUTH",
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
      ...(secretHash && { SECRET_HASH: secretHash }),
    },
  });

  try {
    const response = await cognitoClient.send(command);
    const authResult = response.AuthenticationResult;

    if (!authResult?.AccessToken || !authResult?.IdToken || !authResult?.RefreshToken) {
      throw new Error("Authentication failed - missing tokens");
    }

    return {
      accessToken: authResult.AccessToken,
      idToken: authResult.IdToken,
      refreshToken: authResult.RefreshToken,
    };
  } catch (error: unknown) {
    // Provide helpful error message if USER_PASSWORD_AUTH is not enabled
    if (error && typeof error === "object" && "name" in error) {
      const awsError = error as { name: string; message?: string };
      if (
        awsError.name === "InvalidParameterException" &&
        awsError.message?.includes("USER_PASSWORD_AUTH")
      ) {
        throw new Error(
          "USER_PASSWORD_AUTH is not enabled. Please enable it in AWS Console: " +
          "Cognito → User Pools → App integration → App client → " +
          "Authentication flows → Enable ALLOW_USER_PASSWORD_AUTH"
        );
      }
    }
    throw error;
  }
}

/**
 * Sign Out User (Local)
 * 
 * For local signout, we just clear the tokens on the client.
 * The tokens will still be valid on the server until they expire.
 * 
 * This is a no-op in this implementation since we handle
 * token clearing in the API route.
 */
export function signOut(_email: string): void {
  // Local signout is handled by clearing cookies in the API
  // This function exists for API compatibility
}

/**
 * Global Sign Out
 * 
 * Signs out the user from all devices by invalidating
 * all tokens on the server.
 * 
 * @param accessToken - The user's current access token
 */
export async function globalSignOut(accessToken: string): Promise<void> {
  const command = new GlobalSignOutCommand({
    AccessToken: accessToken,
  });

  await cognitoClient.send(command);
}

/**
 * Initiate Forgot Password Flow
 * 
 * Sends a password reset code to the user's email.
 * 
 * @param email - User's email address
 */
export async function forgotPassword(email: string): Promise<void> {
  const command = new ForgotPasswordCommand({
    ClientId: cognitoConfig.clientId,
    SecretHash: computeSecretHash(email),
    Username: email,
  });

  await cognitoClient.send(command);
}

/**
 * Confirm New Password
 * 
 * Completes the password reset flow with the code and new password.
 * 
 * @param email - User's email address
 * @param code - Verification code from email
 * @param newPassword - New password to set
 */
export async function confirmPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<void> {
  const command = new ConfirmForgotPasswordCommand({
    ClientId: cognitoConfig.clientId,
    SecretHash: computeSecretHash(email),
    Username: email,
    ConfirmationCode: code,
    Password: newPassword,
  });

  await cognitoClient.send(command);
}

/**
 * Get Cognito Client
 * 
 * Returns the raw Cognito client for advanced operations.
 */
export function getCognitoClient(): CognitoIdentityProviderClient {
  return cognitoClient;
}
