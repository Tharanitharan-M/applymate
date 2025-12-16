/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the app.
 * Uses React Context for global state management.
 * 
 * THOUGHT PROCESS:
 * - Context avoids prop drilling for auth state
 * - We check auth status on mount and after navigation
 * - Loading state prevents flash of unauthenticated content
 * - All auth operations are centralized here
 */

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authRoutes } from "./config";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * User object returned from the /api/auth/me endpoint
 */
interface User {
  id: string;
  email: string;
  name?: string;
  emailVerified?: boolean;
}

/**
 * Auth context state and methods
 */
interface AuthContextType {
  // Current user (null if not authenticated)
  user: User | null;

  // Loading state while checking authentication
  isLoading: boolean;

  // Whether the user is authenticated
  isAuthenticated: boolean;

  // Sign in with email and password
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;

  // Sign up with name, email, and password
  signup: (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<{ success: boolean; error?: string; needsVerification?: boolean }>;

  // Verify email with code
  verifyEmail: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;

  // Resend verification code
  resendCode: (email: string) => Promise<{ success: boolean; error?: string }>;

  // Sign out the current user
  logout: () => Promise<void>;

  // Refresh user data
  refreshUser: () => Promise<void>;
}

// =============================================================================
// CONTEXT CREATION
// =============================================================================

/**
 * Create the auth context with undefined default
 * This forces us to use the provider and catch missing providers
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

/**
 * AuthProvider
 * 
 * Wraps the application to provide authentication state.
 * Place this high in your component tree (e.g., in layout.tsx).
 * 
 * @param children - Child components that need auth access
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  // Current authenticated user
  const [user, setUser] = useState<User | null>(null);

  // Loading state while checking auth
  const [isLoading, setIsLoading] = useState(true);

  // Router for redirects
  const router = useRouter();

  // ---------------------------------------------------------------------------
  // FETCH CURRENT USER
  // ---------------------------------------------------------------------------

  /**
   * Fetches the current user from the API
   * 
   * This is called on mount and after auth state changes.
   * Uses the cookies set by the login API to authenticate.
   */
  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", {
        // Include cookies in the request
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Not authenticated or error
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // CHECK AUTH ON MOUNT
  // ---------------------------------------------------------------------------

  /**
   * Check authentication status when the provider mounts
   * 
   * This ensures we know the auth state before rendering protected content.
   */
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // ---------------------------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------------------------

  /**
   * Sign in with email and password
   * 
   * Calls the login API and updates state on success.
   * Returns an object with success status and optional error.
   */
  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Fetch user data after successful login
          await refreshUser();
          return { success: true };
        }

        return {
          success: false,
          error: data.error || "Login failed",
          needsVerification: data.needsVerification,
        };
      } catch (error) {
        console.error("Login error:", error);
        return { success: false, error: "Network error. Please try again." };
      }
    },
    [refreshUser]
  );

  // ---------------------------------------------------------------------------
  // SIGNUP
  // ---------------------------------------------------------------------------

  /**
   * Register a new user
   * 
   * Creates the account and returns whether verification is needed.
   */
  const signup = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      confirmPassword: string
    ) => {
      try {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, confirmPassword }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          return {
            success: true,
            needsVerification: !data.userConfirmed,
          };
        }

        // Format field errors if present
        if (data.fieldErrors) {
          const firstError = Object.values(data.fieldErrors)[0];
          return {
            success: false,
            error: Array.isArray(firstError) ? firstError[0] : data.error,
          };
        }

        return { success: false, error: data.error || "Signup failed" };
      } catch (error) {
        console.error("Signup error:", error);
        return { success: false, error: "Network error. Please try again." };
      }
    },
    []
  );

  // ---------------------------------------------------------------------------
  // EMAIL VERIFICATION
  // ---------------------------------------------------------------------------

  /**
   * Verify email with the 6-digit code
   */
  const verifyEmail = useCallback(async (email: string, code: string) => {
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return { success: true };
      }

      return { success: false, error: data.error || "Verification failed" };
    } catch (error) {
      console.error("Verification error:", error);
      return { success: false, error: "Network error. Please try again." };
    }
  }, []);

  /**
   * Resend the verification code
   */
  const resendCode = useCallback(async (email: string) => {
    try {
      const response = await fetch("/api/auth/verify", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return { success: true };
      }

      return { success: false, error: data.error || "Failed to resend code" };
    } catch (error) {
      console.error("Resend code error:", error);
      return { success: false, error: "Network error. Please try again." };
    }
  }, []);

  // ---------------------------------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------------------------------

  /**
   * Sign out the current user
   * 
   * Clears cookies and redirects to home page.
   */
  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear user state regardless of API success
      setUser(null);
      router.push(authRoutes.afterLogout);
    }
  }, [router]);

  // ---------------------------------------------------------------------------
  // CONTEXT VALUE
  // ---------------------------------------------------------------------------

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    verifyEmail,
    resendCode,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * useAuth Hook
 * 
 * Access the auth context from any component.
 * Must be used within an AuthProvider.
 * 
 * @example
 * const { user, login, logout } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}








